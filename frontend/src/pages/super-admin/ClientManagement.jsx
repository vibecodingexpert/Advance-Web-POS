import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const defaultForm = { businessName: '', ownerName: '', email: '', phone: '', address: '', city: '', country: '', password: '' };

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, [page]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/super-admin/clients', { params: { page, limit: 10, search } });
      setClients(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => { setEditing(null); setFormData(defaultForm); setModalOpen(true); };

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
      password: ''
    });
    setModalOpen(true);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/super-admin/clients/${editing.id}`, formData);
        toast.success('Client updated');
      } else {
        await api.post('/api/super-admin/clients', formData);
        toast.success('Client created');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/super-admin/clients/${id}`);
      toast.success('Client deleted');
      setDeleteModal(null);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleStatus = async (client) => {
    try {
      const action = client.status === 'active' ? 'suspend' : 'activate';
      await api.put(`/api/super-admin/clients/${client.id}/${action}`);
      toast.success(`Client ${action}d`);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>{status}</span>;
  };

  const handleSearch = () => { setPage(1); fetchClients(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total clients</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><FiPlus size={18} /> Add Client</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10" placeholder="Search by name, email, phone..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <button onClick={handleSearch} className="btn-primary">Search</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="table-header">Business</th>
                <th className="table-header">Owner</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Status</th>
                <th className="table-header">Database</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No clients found</td></tr>
              ) : clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="table-cell font-medium">{client.businessName}</td>
                  <td className="table-cell">{client.ownerName}</td>
                  <td className="table-cell text-gray-500">{client.email}</td>
                  <td className="table-cell text-gray-500">{client.phone || '-'}</td>
                  <td className="table-cell">{statusBadge(client.status)}</td>
                  <td className="table-cell text-xs text-gray-400 font-mono">{client.databaseName}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(client)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Edit"><FiEdit2 size={15} /></button>
                      <button onClick={() => toggleStatus(client)} className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={client.status === 'active' ? 'Suspend' : 'Activate'}>
                        {client.status === 'active' ? <FiToggleRight size={15} /> : <FiToggleLeft size={15} />}
                      </button>
                      <button onClick={() => setDeleteModal(client)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Delete"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} className="input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name</label>
                  <input name="ownerName" value={formData.ownerName} onChange={handleChange} className="input-field" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input name="address" value={formData.address} onChange={handleChange} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} className="input-field" /></div>
              </div>
              {!editing && (
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Default: password123" /></div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Client</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Delete <strong>{deleteModal.businessName}</strong>? Their database will also be removed permanently.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteModal.id)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
