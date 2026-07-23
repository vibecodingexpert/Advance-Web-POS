import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const defaultForm = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  subscriptionPlan: '',
  expiryDate: ''
};

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, [page, search]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/super-admin/clients', {
        params: { page, limit: 10, search }
      });
      setClients(res.data.data.clients);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setFormData(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditing(client);
    setFormData({
      businessName: client.businessName || '',
      ownerName: client.ownerName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || '',
      subscriptionPlan: client.subscriptionPlan || '',
      expiryDate: client.expiryDate ? client.expiryDate.split('T')[0] : ''
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/super-admin/clients/${editing._id}`, formData);
        toast.success('Client updated successfully');
      } else {
        await api.post('/api/super-admin/clients', formData);
        toast.success('Client created successfully');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/super-admin/clients/${id}`);
      toast.success('Client deleted successfully');
      setDeleteModal(null);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    }
  };

  const toggleStatus = async (client) => {
    try {
      const newStatus = client.status === 'active' ? 'suspended' : 'active';
      await api.put(`/api/super-admin/clients/${client._id}`, { status: newStatus });
      toast.success(`Client ${newStatus} successfully`);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      expired: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const filtered = clients.filter((c) =>
    !search ||
    c.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    c.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={18} />
          Add Client
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="relative mb-4 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
            placeholder="Search clients..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Business Name</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Owner</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Subscription</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{client.businessName}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{client.ownerName}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{client.email}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{client.phone}</td>
                  <td className="py-3 px-4">{statusBadge(client.status)}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{client.subscriptionPlan || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(client)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Edit">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => toggleStatus(client)} className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={client.status === 'active' ? 'Suspend' : 'Activate'}>
                        {client.status === 'active' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                      </button>
                      <button onClick={() => setDeleteModal(client)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 dark:text-gray-500">No clients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? 'Edit Client' : 'Add Client'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} className="input-field" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name</label>
                  <input name="ownerName" value={formData.ownerName} onChange={handleChange} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input name="address" value={formData.address} onChange={handleChange} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Plan</label>
                  <input name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary px-6">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Delete</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{deleteModal.businessName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteModal._id)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
