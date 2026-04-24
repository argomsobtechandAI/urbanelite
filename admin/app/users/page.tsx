'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { User } from '@/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';

interface UserWithStatus extends User {
    is_active?: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers({ page, limit: 10, search });
            setUsers(response.data.users);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: UserWithStatus) => {
        const newStatus = !user.is_active;
        const action = newStatus ? 'enable' : 'disable';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user "${user.name}"? ${!newStatus ? 'They will not be able to login.' : ''}`)) return;
        setTogglingId(user.id);
        try {
            await adminAPI.toggleUserStatus(user.id, newStatus);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 mt-2">Manage all registered users</p>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-600">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-600">No users found</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 ${user.is_active === false ? 'bg-red-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(user as any)._count?.bookings || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.is_active === false ? (
                                                <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-700">Disabled</span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-700">Active</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                disabled={togglingId === user.id}
                                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                    user.is_active === false
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                } disabled:opacity-50`}
                                                title={user.is_active === false ? 'Enable User' : 'Disable User'}
                                            >
                                                {user.is_active === false
                                                    ? <><ToggleRight className="w-4 h-4" /> Enable</>
                                                    : <><ToggleLeft className="w-4 h-4" /> Disable</>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
                        <span className="px-4 py-2 text-gray-700">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}


