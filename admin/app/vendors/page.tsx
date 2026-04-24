'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircle, XCircle, Clock, Building2, Briefcase, MapPin, Star, Phone, Mail, UserCheck, Plus, DollarSign, Timer, ShieldCheck, User, Layers, ImageIcon, Eye } from 'lucide-react';

interface Vendor {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    service_category: string;
    business_name: string;
    business_address: string;
    experience_years: number | null;
    aadhaar_url: string | null;
    pan_url: string | null;
    certification_docs: string[] | null;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    is_active?: boolean;
    created_at: string;
}

interface VendorService {
    id: string;
    vendorServiceId: string;
    name: string;
    basePrice: string | null;
    baseDuration: string | null;
    customPrice: string | null;
    customDuration: number | null;
    isEnabled: boolean;
    priceUpdatedBy: 'VENDOR' | 'ADMIN';
    durationUpdatedBy: 'VENDOR' | 'ADMIN';
    image: string | null;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [togglingVendorId, setTogglingVendorId] = useState<string | null>(null);

    // Specialization State
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCatId, setSelectedCatId] = useState('');
    const [categoryItems, setCategoryItems] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [specPrice, setSpecPrice] = useState('');

    // Pricing Management State
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [pricingVendor, setPricingVendor] = useState<Vendor | null>(null);
    const [vendorServices, setVendorServices] = useState<VendorService[]>([]);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});
    const [editMap, setEditMap] = useState<Record<string, { customPrice: string; customDuration: string }>>({});

    useEffect(() => {
        fetchVendors();
    }, [filter]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await adminAPI.getServiceCategories();
                if (res.data.success) setCategories(res.data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadItems = async () => {
            if (!selectedCatId) {
                setCategoryItems([]);
                return;
            }
            try {
                const res = await adminAPI.getServiceItems(selectedCatId);
                if (res.data.success) setCategoryItems(res.data.items);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };
        loadItems();
    }, [selectedCatId]);

    const openSpecializationModal = (vendor: Vendor) => {
        setSelectedVendor(vendor);
        setIsSpecModalOpen(true);
        setSelectedCatId('');
        setSelectedServiceId('');
        setSpecPrice('');
    };

    const openPricingModal = async (vendor: Vendor) => {
        setPricingVendor(vendor);
        setIsPricingModalOpen(true);
        setPricingLoading(true);
        try {
            const res = await adminAPI.getVendorServicePricing(vendor.id);
            if (res.data.success) {
                const services: VendorService[] = res.data.data;
                setVendorServices(services);
                // Initialize edit state
                const initMap: Record<string, { customPrice: string; customDuration: string }> = {};
                services.forEach(s => {
                    initMap[s.id] = {
                        customPrice: s.customPrice || '',
                        customDuration: s.customDuration ? String(s.customDuration) : '',
                    };
                });
                setEditMap(initMap);
            }
        } catch (error) {
            console.error('Error fetching vendor service pricing:', error);
        } finally {
            setPricingLoading(false);
        }
    };

    const handleSavePricing = async (service: VendorService) => {
        if (!pricingVendor) return;
        const edit = editMap[service.id];
        setUpdatingMap(prev => ({ ...prev, [service.id]: true }));
        try {
            await adminAPI.updateVendorServicePricing(pricingVendor.id, {
                serviceItemId: service.id,
                customPrice: edit.customPrice || undefined,
                customDuration: edit.customDuration ? parseInt(edit.customDuration) : null,
            });
            // Reflect changes in local state
            setVendorServices(prev => prev.map(s => s.id === service.id ? {
                ...s,
                customPrice: edit.customPrice || s.customPrice,
                customDuration: edit.customDuration ? parseInt(edit.customDuration) : s.customDuration,
                priceUpdatedBy: 'ADMIN',
                durationUpdatedBy: 'ADMIN',
            } : s));
            alert(`✅ Pricing updated for "${service.name}"`);
        } catch (error) {
            console.error('Error updating pricing:', error);
            alert('Failed to update pricing');
        } finally {
            setUpdatingMap(prev => ({ ...prev, [service.id]: false }));
        }
    };

    const handleAddSpecialization = async () => {
        if (!selectedVendor || !selectedServiceId) return;

        try {
            await adminAPI.assignServiceToVendor({
                vendorId: selectedVendor.id,
                serviceItemId: selectedServiceId,
                customPrice: specPrice
            });
            alert('Specialization added successfully!');
            setIsSpecModalOpen(false);
        } catch (error) {
            console.error('Error adding specialization:', error);
            alert('Failed to add specialization');
        }
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            if (filter === 'PENDING') {
                const response = await adminAPI.getPendingVendors();
                setVendors(response.data.vendors);
            } else {
                const params = filter === 'ALL' ? {} : { status: filter };
                const response = await adminAPI.getAllVendors(params);
                setVendors(response.data.vendors);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!confirm(`Approve vendor "${name}"? They will be able to login and access the vendor dashboard.`)) return;

        try {
            await adminAPI.approveVendor(id);
            alert(`✅ Vendor "${name}" has been approved! They can now login.`);
            fetchVendors();
        } catch (error) {
            console.error('Error approving vendor:', error);
            alert('Failed to approve vendor');
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (!confirm(`Reject vendor "${name}"? They will not be able to login.`)) return;

        try {
            await adminAPI.rejectVendor(id);
            alert(`❌ Vendor "${name}" has been rejected.`);
            fetchVendors();
        } catch (error) {
            console.error('Error rejecting vendor:', error);
            alert('Failed to reject vendor');
        }
    };

    const handleToggleVendorStatus = async (vendor: Vendor) => {
        const newStatus = vendor.is_active === false ? true : false;
        const action = newStatus ? 'enable' : 'disable';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} vendor "${vendor.name}"? ${!newStatus ? 'They will not be able to login even if approved.' : 'They will be able to login.'}`)) return;
        setTogglingVendorId(vendor.id);
        try {
            await adminAPI.toggleVendorStatus(vendor.id, newStatus);
            setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, is_active: newStatus } : v));
        } catch (error) {
            console.error('Error toggling vendor status:', error);
            alert('Failed to update vendor status');
        } finally {
            setTogglingVendorId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4" />
                        Pending Approval
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4" />
                        Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    const UpdatedByBadge = ({ by }: { by: 'VENDOR' | 'ADMIN' }) => (
        by === 'ADMIN'
            ? <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3" /> Admin set
              </span>
            : <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <User className="w-3 h-3" /> Vendor set
              </span>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Service Providers (Vendors)</h1>
                    <p className="text-gray-600 mt-2">Manage service provider registrations, approvals, and pricing</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-900">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900 mt-2">
                            {vendors.filter(v => v.approval_status === 'PENDING').length}
                        </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Approved</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900 mt-2">
                            {vendors.filter(v => v.approval_status === 'APPROVED').length}
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-900">Rejected</span>
                        </div>
                        <p className="text-2xl font-bold text-red-900 mt-2">
                            {vendors.filter(v => v.approval_status === 'REJECTED').length}
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 mt-2">
                            {vendors.length}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 ${filter === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Vendors List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center text-gray-600 py-12">
                            Loading service providers...
                        </div>
                    ) : vendors.length === 0 ? (
                        <div className="text-center text-gray-600 py-12 bg-white rounded-lg shadow">
                            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium">No {filter.toLowerCase()} vendors found</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {filter === 'PENDING'
                                    ? 'New vendor registrations will appear here for approval'
                                    : 'Vendors will appear here once they register'}
                            </p>
                        </div>
                    ) : (
                        vendors.map((vendor) => (
                            <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{vendor.name}</h3>
                                            {getStatusBadge(vendor.approval_status)}
                                        </div>
                                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                <span>{vendor.email}</span>
                                            </div>
                                            {vendor.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{vendor.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Building2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Business Name</p>
                                            <p className="text-sm text-gray-900 font-medium">{vendor.business_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Briefcase className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Service Category</p>
                                            <p className="text-sm text-gray-900 font-medium">{vendor.service_category}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Business Address</p>
                                            <p className="text-sm text-gray-900">{vendor.business_address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Experience</p>
                                            <p className="text-sm text-gray-900 font-medium">
                                                {vendor.experience_years ? `${vendor.experience_years} years` : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* KYC Documents Section */}
                                <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                                        <UserCheck className="w-3 h-3 text-blue-500" />
                                        KYC Verification Documents (Aadhaar/PAN)
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[200px]">
                                            <p className="text-xs text-gray-400 mb-1">Aadhaar Card</p>
                                            {vendor.aadhaar_url ? (
                                                <a
                                                    href={vendor.aadhaar_url}
                                                    target="_blank"
                                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white p-2 rounded border border-blue-100 transition-colors"
                                                >
                                                    View Aadhaar Card ↗
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic bg-white p-2 rounded border border-gray-100">Not provided</p>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <p className="text-xs text-gray-400 mb-1">PAN Card</p>
                                            {vendor.pan_url ? (
                                                <a
                                                    href={vendor.pan_url}
                                                    target="_blank"
                                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white p-2 rounded border border-blue-100 transition-colors"
                                                >
                                                    View PAN Card ↗
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic bg-white p-2 rounded border border-gray-100">Not provided</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Certification & Licenses High Quality Docs */}
                                {vendor.certification_docs && vendor.certification_docs.length > 0 && (
                                    <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                                            Licenses & Certifications (High Quality)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {vendor.certification_docs.map((doc, idx) => {
                                                const isPdf = doc.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <a
                                                        key={idx}
                                                        href={doc}
                                                        target="_blank"
                                                        className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-400 hover:shadow-sm transition-all text-sm group"
                                                    >
                                                        {isPdf ? (
                                                            <div className="bg-red-50 p-2 rounded text-red-600">
                                                                <Layers className="w-5 h-5" />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-green-50 p-2 rounded text-green-600">
                                                                <ImageIcon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div className="overflow-hidden">
                                                            <p className="font-semibold text-gray-800 truncate">Document {idx + 1}</p>
                                                            <p className="text-xs text-gray-500 uppercase">{isPdf ? 'PDF Document' : 'Image File'}</p>
                                                        </div>
                                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                                    <span>Registered: {new Date(vendor.created_at).toLocaleString()}</span>
                                    <span className="text-gray-400">ID: {vendor.id.slice(0, 8)}...</span>
                                </div>

                                {/* Action Buttons */}
                                {vendor.approval_status === 'PENDING' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(vendor.id, vendor.name)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Approve Vendor
                                        </button>
                                        <button
                                            onClick={() => handleReject(vendor.id, vendor.name)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reject Vendor
                                        </button>
                                    </div>
                                )}

                                {vendor.approval_status === 'APPROVED' && (
                                    <div className="space-y-3">
                                        <div className={`border rounded-lg p-3 text-center ${
                                            vendor.is_active === false
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-green-50 border-green-200'
                                        }`}>
                                            <p className={`text-sm ${
                                                vendor.is_active === false ? 'text-red-800' : 'text-green-800'
                                            }`}>
                                                {vendor.is_active === false
                                                    ? '🚫 This vendor is approved but currently DISABLED and cannot login'
                                                    : '✅ This vendor is approved and can login to provide services'
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openSpecializationModal(vendor)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors bg-white font-medium"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Manage Specializations
                                            </button>
                                            <button
                                                onClick={() => openPricingModal(vendor)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors bg-white font-medium"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Manage Service Pricing
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleToggleVendorStatus(vendor)}
                                            disabled={togglingVendorId === vendor.id}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                                                vendor.is_active === false
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                        >
                                            {vendor.is_active === false
                                                ? <><UserCheck className="w-4 h-4" /> Enable Vendor Account</>
                                                : <><XCircle className="w-4 h-4" /> Disable Vendor Account</>
                                            }
                                        </button>
                                    </div>
                                )}

                                {vendor.approval_status === 'REJECTED' && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                        <p className="text-sm text-red-800">
                                            ❌ This vendor has been rejected and cannot login
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Specialization Modal */}
                {isSpecModalOpen && selectedVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Manage Specializations
                                </h2>
                                <button onClick={() => setIsSpecModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                Assign specific service items to <strong>{selectedVendor.name}</strong>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Service Category</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        value={selectedCatId}
                                        onChange={(e) => setSelectedCatId(e.target.value)}
                                    >
                                        <option value="">-- Choose Category --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCatId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Sub-Service (Specialization)</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            value={selectedServiceId}
                                            onChange={(e) => setSelectedServiceId(e.target.value)}
                                        >
                                            <option value="">-- Choose Service --</option>
                                            {categoryItems.map(item => (
                                                <option key={item.id} value={item.id}>{item.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Price for Vendor (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ₹599"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        value={specPrice}
                                        onChange={(e) => setSpecPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsSpecModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSpecialization}
                                    disabled={!selectedServiceId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    Add Specialization
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Pricing Management Modal */}
                {isPricingModalOpen && pricingVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-orange-500" />
                                        Service Pricing — {pricingVendor.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Override pricing and duration set by the vendor. Changes here take precedence.
                                    </p>
                                </div>
                                <button onClick={() => setIsPricingModalOpen(false)} className="text-gray-400 hover:text-gray-600 ml-4">
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Legend */}
                            <div className="px-6 pt-4 pb-2 flex gap-4 flex-shrink-0">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><User className="w-3 h-3" /> Vendor set</span>
                                    <span>= Price/duration set by the vendor</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium"><ShieldCheck className="w-3 h-3" /> Admin set</span>
                                    <span>= Overridden by admin</span>
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="overflow-y-auto flex-1 px-6 pb-6">
                                {pricingLoading ? (
                                    <div className="text-center py-12 text-gray-500">Loading services...</div>
                                ) : vendorServices.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No services assigned to this vendor yet.</p>
                                        <p className="text-sm mt-1">Use &quot;Manage Specializations&quot; to assign services first.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 mt-2">
                                        {vendorServices.map(service => (
                                            <div key={service.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {service.image ? (
                                                        <img src={service.image} alt={service.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <Briefcase className="w-5 h-5 text-orange-500" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{service.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            Catalog price: {service.basePrice || 'N/A'} · Catalog duration: {service.baseDuration || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                            {service.isEnabled ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Price Field */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                <DollarSign className="w-3 h-3" /> Custom Price
                                                            </label>
                                                            <UpdatedByBadge by={service.priceUpdatedBy} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder={service.basePrice || 'e.g. ₹599'}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                            value={editMap[service.id]?.customPrice ?? ''}
                                                            onChange={e => setEditMap(prev => ({
                                                                ...prev,
                                                                [service.id]: { ...prev[service.id], customPrice: e.target.value }
                                                            }))}
                                                        />
                                                    </div>

                                                    {/* Duration Field */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                <Timer className="w-3 h-3" /> Duration (mins)
                                                            </label>
                                                            <UpdatedByBadge by={service.durationUpdatedBy} />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            placeholder={service.baseDuration || 'e.g. 60'}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                            value={editMap[service.id]?.customDuration ?? ''}
                                                            onChange={e => setEditMap(prev => ({
                                                                ...prev,
                                                                [service.id]: { ...prev[service.id], customDuration: e.target.value }
                                                            }))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={() => handleSavePricing(service)}
                                                        disabled={updatingMap[service.id]}
                                                        className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {updatingMap[service.id] ? 'Saving...' : 'Save Changes'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
