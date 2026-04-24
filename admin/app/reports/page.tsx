'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adminAPI } from '@/lib/api';
import { Flag, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';

interface Report {
    id: string;
    reason: string;
    description: string | null;
    status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
    admin_notes: string | null;
    created_at: string;
    reporter: { id: string; name: string; email: string } | null;
    reported: { id: string; name: string; email: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    REVIEWED: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-100' },
    RESOLVED: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
    DISMISSED: { label: 'Dismissed', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => { fetchReports(); }, [filter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = filter !== 'ALL' ? `?status=${filter}` : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports${params}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            const data = await res.json();
            setReports(data.reports || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ status, admin_notes: adminNotes })
            });
            setSelectedReport(null);
            setAdminNotes('');
            fetchReports();
        } catch (e) {
            alert('Failed to update report');
        } finally {
            setUpdatingId(null);
        }
    };

    const pendingCount = reports.filter(r => r.status === 'PENDING').length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Flag className="w-8 h-8 text-red-500" />
                            Reports
                            {pendingCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                    {pendingCount} pending
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-600 mt-1">Review and manage user & vendor misbehaviour reports</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm w-fit">
                    {['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                filter === s ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label}
                        </button>
                    ))}
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading reports...</div>
                    ) : reports.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No reports found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Reporter</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Reported Person</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Reason</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reports.map(report => {
                                    const sc = STATUS_CONFIG[report.status];
                                    return (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 text-sm">{report.reporter?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{report.reporter?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900 text-sm">{report.reported?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{report.reported?.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-800">{report.reason}</p>
                                                {report.description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.color}`}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(report.created_at).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ''); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                                                >
                                                    <Eye className="w-4 h-4" /> Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Flag className="w-5 h-5 text-red-500" /> Review Report
                                </h2>
                                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reporter</p>
                                    <p className="font-bold text-gray-900">{selectedReport.reporter?.name}</p>
                                    <p className="text-xs text-gray-500">{selectedReport.reporter?.email}</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4">
                                    <p className="text-xs text-red-500 font-semibold uppercase mb-1">Reported</p>
                                    <p className="font-bold text-gray-900">{selectedReport.reported?.name}</p>
                                    <p className="text-xs text-gray-500">{selectedReport.reported?.email}</p>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Reason</p>
                                <p className="font-semibold text-gray-900">{selectedReport.reason}</p>
                                {selectedReport.description && (
                                    <p className="text-sm text-gray-600 mt-2">{selectedReport.description}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Add notes about the action taken..."
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleUpdateStatus(selectedReport.id, 'REVIEWED')}
                                    disabled={!!updatingId}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    <Clock className="w-4 h-4" /> Mark Reviewed
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                                    disabled={!!updatingId}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-100 text-green-700 rounded-xl font-semibold text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" /> Resolve
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                                    disabled={!!updatingId}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
