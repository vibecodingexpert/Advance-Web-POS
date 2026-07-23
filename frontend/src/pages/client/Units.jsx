import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', shortName: '', status: 'active' });

  useEffect(() => { fetchUnits(); }, []);

  const fetchUnits = async () => {
    try {
      const { data } = await api.get('/api/units');
      setUnits(data.data || []);
    } catch (error) {
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ name: '', shortName: '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (unit) => {
    setEditing(unit);
    setForm({
      name: unit.name || '',
      shortName: unit.shortName || '',
      status: unit.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/units/${editing._id}`, form);
        toast.success('Unit updated');
      } else {
        await api.post('/api/units', form);
        toast.success('Unit created');
      }
      setShowModal(false);
      fetchUnits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save unit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this unit?')) return;
    try {
      await api.delete(`/api/units/${id}`);
      toast.success('Unit deleted');
      fetchUnits();
    } catch (error) {
      toast.error('Failed to delete unit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Units</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Unit
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Name</th>
                <th className="table-header">Short Name</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400">No units found</td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">{unit.name}</td>
                    <td className="table-cell">{unit.shortName || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${unit.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{unit.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(unit)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(unit._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editing ? 'Edit Unit' : 'Add Unit'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Name</label>
                <input type="text" className="input-field" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="e.g. KG, PCS" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
