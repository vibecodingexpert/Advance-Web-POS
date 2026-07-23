import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPlus, FiX } from 'react-icons/fi';

const defaultForm = {
  name: '',
  price: '',
  durationDays: '',
  maxUsers: '',
  maxProducts: ''
};

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/super-admin/plans');
      setPlans(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setFormData(defaultForm);
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditing(plan);
    setFormData({
      name: plan.name || '',
      price: plan.price || '',
      durationDays: plan.durationDays || '',
      maxUsers: plan.maxUsers || '',
      maxProducts: plan.maxProducts || ''
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
        await api.put(`/api/super-admin/plans/${editing.id}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/api/super-admin/plans', formData);
        toast.success('Plan created successfully');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/super-admin/plans/${id}`);
      toast.success('Plan deleted successfully');
      setDeleteModal(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const toggleStatus = async (plan) => {
    try {
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/super-admin/plans/${plan.id}`, { status: newStatus });
      toast.success(`Plan ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle plan status');
    }
  };

  const statusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'active'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }`}>
      {status}
    </span>
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Management</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={18} />
          Add Plan
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Duration (Days)</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Max Users</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Max Products</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{plan.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">${plan.price}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{plan.durationDays}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{plan.maxUsers}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{plan.maxProducts}</td>
                  <td className="py-3 px-4">{statusBadge(plan.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Edit">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => toggleStatus(plan)} className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={plan.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {plan.status === 'active' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                      </button>
                      <button onClick={() => setDeleteModal(plan)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 dark:text-gray-500">No plans found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? 'Edit Plan' : 'Add Plan'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                  <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Days)</label>
                  <input name="durationDays" type="number" min="1" value={formData.durationDays} onChange={handleChange} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Users</label>
                  <input name="maxUsers" type="number" min="1" value={formData.maxUsers} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Products</label>
                  <input name="maxProducts" type="number" min="1" value={formData.maxProducts} onChange={handleChange} className="input-field" required />
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
              Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteModal.id)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
