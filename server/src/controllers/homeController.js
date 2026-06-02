const supabase = require('../config/database');

// Get Home Data
const getHomeData = async (req, res) => {
    try {
        console.log('Home Controller: Fetching home data...');
        const { data: services, error } = await supabase
            .from('service_categories')
            .select('id, name, image, slug, is_others');

        if (error) {
            console.error('Home Controller DB Error:', error);
            throw error;
        }

        console.log(`Home Controller: Found ${services?.length} services`);

        res.json({
            services: services,
            banners: [],
            offers: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Service Categories (for Vendor Registration - excludes Others)
const getServiceCategories = async (req, res) => {
    try {
        const { data: categories, error } = await supabase
            .from('service_categories')
            .select('*');

        if (error) throw error;

        const filteredCategories = (categories || []).filter(
            cat => cat.is_others !== true && cat.slug !== 'others'
        );

        res.json({
            success: true,
            categories: filteredCategories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
};

// Get Subcategories (Level 2)
const getSubCategories = async (req, res) => {
    const { slug } = req.params;
    try {
        // Step 1: Get Category (Level 1)
        const { data: category, error: catError } = await supabase
            .from('service_categories')
            .select('*')
            .eq('slug', slug)
            .single();

        if (catError || !category) {
            // Log for debugging
            console.error(`Category not found for slug: ${slug}`);
            return res.status(404).json({ message: 'Category not found' });
        }

        // Step 2: Get Subcategories
        const { data: subcategories, error: subError } = await supabase
            .from('service_subcategories')
            .select('*')
            .eq('category_id', category.id);

        if (subError) throw subError;

        res.json({
            category,
            subcategories: subcategories || [] // Ensure array even if empty
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Service Items (Level 3 - Service Options)
const getServiceListing = async (req, res) => {
    const { slug } = req.params; // subcategory slug

    try {
        // Step 1: Get Subcategory
        const { data: subcategory, error: subError } = await supabase
            .from('service_subcategories')
            .select('*, service_categories(name, slug)') // Join with parent category
            .eq('slug', slug)
            .single();

        // If subcategory not found, try fetching as Category for backward compatibility 
        // (In case user clicks a category that HAS NO subcategories yet and services are directly linked? 
        // No, we are enforcing 3 levels now. Errors here mean data issue.)
        if (subError || !subcategory) {
            // Fallback: Check if it's a category slug acting as subcategory (for backward compatibility if needed)
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Step 2: Get Service Items (Options)
        const { data: services, error: servError } = await supabase
            .from('service_items')
            .select('*')
            .eq('subcategory_id', subcategory.id);

        if (servError) throw servError;

        // Mock filters
        const filters = ['ALL', 'RECOMMENDED', 'LOW PRICE'];

        res.json({
            subcategory,
            category: subcategory.service_categories,
            filters,
            services
        });

    } catch (error) {
        console.error('Error fetching service listing:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Subcategories by Category ID (for Registration)
const getSubCategoriesById = async (req, res) => {
    const { categoryId } = req.params;
    try {
        const { data: subcategories, error } = await supabase
            .from('service_subcategories')
            .select('*')
            .eq('category_id', categoryId);

        if (error) throw error;

        res.json({
            success: true,
            subcategories: subcategories || []
        });
    } catch (error) {
        console.error('Error fetching subcategories by ID:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch subcategories' });
    }
};

// Get Service Items by Subcategory ID (for Registration)
const getServiceListingById = async (req, res) => {
    const { subCategoryId } = req.params;
    try {
        const { data: services, error } = await supabase
            .from('service_items')
            .select('*')
            .eq('subcategory_id', subCategoryId);

        if (error) throw error;

        res.json({
            success: true,
            services: services || []
        });
    } catch (error) {
        console.error('Error fetching service listing by ID:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
};

// Deprecated: Old getServiceDetails (kept/renamed if necessary, but we are replacing it)
// We will replace the export with the new functions.

// Get Service Item Detail (with augmented mock data)
const getServiceDetailById = async (req, res) => {
    const { id } = req.params;
    try {
        const { data: service, error } = await supabase
            .from('service_items')
            .select('*, service_categories(name, slug)')
            .eq('id', id)
            .single();

        if (error || !service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Augment with detailed data
        const augmentedService = {
            ...service,
            category: service.service_categories,
            titleFull: service.title_full || service.title,
            isImage: service.is_image,
            provider: {
                name: 'Expert',
                surname: 'Professional',
                image: 'https://img.freepik.com/free-photo/portrait-handsome-young-man-with-crossed-arms_23-2148464103.jpg',
                rating: '4.9',
                services: '1,240 SERVICES',
                verified: true
            },
            specifications: service.description || `Professional ${service.title} service. Our certified experts ensure top-quality results using premium tools and safe practices. Guaranteed satisfaction with post-service support.`,
            features: [
                'Certified Professional',
                '100% Guaranteed',
                'Post-Service Support'
            ],
            reviews: []
        };
        res.json(augmentedService);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Global Search across Categories, Subcategories, and Service Items
const search = async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.json({ results: [] });
    }

    try {
        const query = q.toLowerCase();

        // 1. Search Categories
        const { data: categories } = await supabase
            .from('service_categories')
            .select('id, name, slug, image')
            .ilike('name', `%${query}%`);

        // 2. Search Subcategories
        const { data: subcategories } = await supabase
            .from('service_subcategories')
            .select('id, name, slug, image, category_id, service_categories(slug)')
            .ilike('name', `%${query}%`);

        // 3. Search Service Items
        const { data: items } = await supabase
            .from('service_items')
            .select('id, title, subcategory_id, price, image, service_subcategories(slug)')
            .ilike('title', `%${query}%`);

        // Format results for the frontend
        const results = [
            ...(categories || []).map(c => ({
                id: c.id,
                name: c.name,
                type: 'CATEGORY',
                slug: c.slug,
                image: c.image
            })),
            ...(subcategories || []).map(s => ({
                id: s.id,
                name: s.name,
                type: 'SUBCATEGORY',
                slug: s.slug,
                image: s.image,
                categorySlug: s.service_categories?.slug
            })),
            ...(items || []).map(i => ({
                id: i.id,
                name: i.title,
                type: 'SERVICE',
                price: i.price,
                image: i.image,
                subcategorySlug: i.service_subcategories?.slug
            }))
        ];

        res.json({ results: results.slice(0, 15) }); // Limit to top 15 results
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
};

module.exports = {
    getHomeData,
    getSubCategories,
    getServiceListing,
    getServiceDetailById,
    getServiceCategories,
    getSubCategoriesById,
    getServiceListingById,
    search
};
