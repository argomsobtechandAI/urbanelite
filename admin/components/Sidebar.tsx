'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Layers,
    LogOut,
    UserCheck,
    CreditCard,
    LayoutGrid,
    GitBranch,
    ClipboardList,
    Inbox,
    Megaphone,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Vendors', href: '/vendors', icon: UserCheck },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Categories', href: '/services/categories', icon: LayoutGrid },
    { name: 'Sub-Category', href: '/services/subcategories', icon: GitBranch },
    { name: 'Services', href: '/services/list', icon: ClipboardList },
    { name: 'Others Requests', href: '/others-requests', icon: Inbox },
    { name: 'Offers & Ads', href: '/offers', icon: Megaphone },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
];

export default function Sidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white w-64">
            <div className="p-6">
                <img src="/images/logo.png" alt="Olfix Logo" className="h-10 mb-2 brightness-0 invert" />
                <p className="text-gray-400 text-sm">Admin Panel</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (
                        pathname.startsWith(item.href) && item.href !== '/' // Simple active check, better logic might be needed
                    );

                    const isActiveStrict = pathname === item.href;
                    // Categories should match /services/categories*
                    // Sub-Cat should match /services/subcategories*
                    // Services list should match /services/list*

                    // But /services/[id] might conflict if we don't structure URLs well.
                    // Currently: /services/[categoryId] -> SubCategoriesPage (nested under category)
                    //           /services/[categoryId]/[subCategoryId] -> ServiceItemsPage (nested)

                    // The requested flow is "Create 3 specific sections... make necessary changes to Admin Panel".
                    // Maybe we should restructure routing to avoid nesting if they want separate sections?
                    // Or keep nesting but expose direct entry points.

                    // Let's create:
                    // /services/categories -> List Categories (with link to view subcats)
                    // /services/subcategories -> List ALL SubCats (filterable by category)
                    // /services/list -> List ALL items (filterable by subcat)

                    // Currently /services -> List Categories. Let's move this to /services/categories and redirect /services?
                    // Or just use /services for Categories.

                    // Let's stick to the user request.

                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActiveStrict
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
