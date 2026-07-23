import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerVendor, setLedgerVendor] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', address: '',
    openingBalance: 0, status: 'active'
  });

  useEffect(() => { fetchVendors(); }, [search]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/api/vendors', { params });
      setVendors(data.data || []);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ name: '', company: '', phone: '', email: '', address: '', openingBalance: 0, status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setEditing(vendor);
    setForm({
      name: vendor.name || '',
      company: vendor.company || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      openingBalance: vendor.openingBalance || 0,
      status: vendor.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/vendors/${editing._id}`, form);
        toast.success('Vendor updated');
      } else {
        await api.post('/api/vendors', form);
        toast.success('Vendor created');
      }
      setShowModal(false);
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await api.delete(`/api/vendors/${id}`);
      toast.success('Vendor deleted');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  const viewLedger = async (vendor) => {
    setLedgerVendor(vendor);
    try {
      const { data } = await api.get(`/api/vendors/${vendor._id}/ledger`);
      setLedgerData(data.data || []);
    } catch (error) {
      toast.error('Failed to load ledger');
      setLedgerData([]);
    }
    setShowLedger(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Vendors</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Vendor
        </button>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Vendor Name</th>
                <th className="table-header">Company</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Email</th>
                <th className="table-header">Total Purchase</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Due</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">No vendors found</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">{vendor.name}</td>
                    <td className="table-cell">{vendor.company || '-'}</td>
                    <td className="table-cell">{vendor.phone || '-'}</td>
                    <td className="table-cell">{vendor.email || '-'}</td>
                    <td className="table-cell">${(vendor.totalPurchase || 0).toFixed(2)}</td>
                    <td className="table-cell text-green-600">${(vendor.totalPaid || 0).toFixed(2)}</td>
                    <td className="table-cell text-red-600">${(vendor.totalDue || 0).toFixed(2)}</td>
                    <td className="table-cell">
                      <span className={`badge ${vendor.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{vendor.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => viewLedger(vendor)} className="text-purple-600 hover:text-purple-800" title="View Ledger">
                          <FiEye size={16} />
                        </button>
                        <button onClick={() => openEditModal(vendor)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(vendor._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editing ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                <input type="text" className="input-field" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea className="input-field" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Balance</label>
                <input type="number" step="0.01" className="input-field" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLedger && ledgerVendor && (
        <div className="modal-overlay" onClick={() => setShowLedger(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Ledger - {ledgerVendor.name}
              </h3>
              <button onClick={() => setShowLedger(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="table-header">Date</th>
                    <th className="table-header">Description</th>
                    <th className="table-header">Debit</th>
                    <th className="table-header">Credit</th>
                    <th className="table-header">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.length > 0 ? (
                    ledgerData.map((entry, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="table-cell">{new Date(entry.date || entry.createdAt).toLocaleDateString()}</td>
                        <td className="table-cell">{entry.description || entry.note || '-'}</td>
                        <td className="table-cell text-red-600">{entry.debit ? `$${entry.debit.toFixed(2)}` : '-'}</td>
                        <td className="table-cell text-green-600">{entry.credit ? `$${entry.credit.toFixed(2)}` : '-'}</td>
                        <td className="table-cell font-medium">${(entry.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-400">No ledger entries found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
