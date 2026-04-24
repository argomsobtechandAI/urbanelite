'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Plus, Pencil, Search, Loader2, X, ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    is_active: boolean;
    _count?: {
        services: number;
    };
}

export default function ServicesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', image: '' });
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getServiceCategories();
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async () => {
        try {
            if (!formData.name) { alert('Name is required'); return; }
            setSaving(true);

            const payload = { name: formData.name, image: formData.image || null };

            if (editingCategory) {
                await adminAPI.updateServiceCategory(editingCategory.id, payload);
            } else {
                await adminAPI.createServiceCategory(payload);
            }

            setIsDialogOpen(false);
            setFormData({ name: '', image: '' });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (category: Category) => {
        const action = category.is_active ? 'disable' : 'enable';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} category "${category.name}"?`)) return;
        try {
            await adminAPI.updateServiceCategory(category.id, { is_active: !category.is_active });
            setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: !c.is_active } : c));
        } catch (error) {
            console.error('Error toggling category:', error);
            alert('Failed to update category status');
        }
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, image: category.image || '' });
        setIsDialogOpen(true);
    };

    const openAdd = () => {
        setEditingCategory(null);
        setFormData({ name: '', image: '' });
        setIsDialogOpen(true);
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Service Categories</h1>
                        <p className="text-gray-500 mt-1">Manage service categories and their icons.</p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Add Category
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            placeholder="Search categories..."
                            className="pl-9 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700 w-[80px]">Icon</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Slug</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="h-32 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-32 text-center text-gray-500">
                                            No categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {category.image ? (
                                                    <img
                                                        src={category.image}
                                                        alt={category.name}
                                                        className="w-12 h-12 object-contain rounded-lg bg-gray-100 p-1 border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">{category.name}</td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{category.slug}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                    category.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {category.is_active !== false ? '● Enabled' : '● Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/services/${category.id}`}
                                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                                                    >
                                                        <Plus className="h-4 w-4" /> Sub-Categories
                                                    </Link>
                                                    <button
                                                        onClick={() => openEdit(category)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(category)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            category.is_active !== false
                                                                ? 'text-green-600 hover:bg-green-50'
                                                                : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                        title={category.is_active !== false ? 'Disable' : 'Enable'}
                                                    >
                                                        {category.is_active !== false
                                                            ? <ToggleRight className="h-5 w-5" />
                                                            : <ToggleLeft className="h-5 w-5" />
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                <button onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Electrician"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Icon Image Upload */}
                                <ImageUpload
                                    label="Category Icon"
                                    value={formData.image}
                                    onChange={(url) => setFormData({ ...formData, image: url })}
                                    bucket="service-icons"
                                    folder="categories"
                                    hint="PNG, JPG, WebP, SVG — max 2 MB. Shown as icon in app."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {saving ? 'Saving…' : editingCategory ? 'Update Category' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
