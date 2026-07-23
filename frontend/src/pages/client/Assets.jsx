import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', category: '', purchaseDate: '', price: '',
    quantity: 1, location: '', condition: 'good', description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchAssetCategories();
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/assets');
      setAssets(data.data || []);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetCategories = async () => {
    try {
      const { data } = await api.get('/api/asset-categories');
      setCategories(data.data || []);
    } catch (error) { /* silent */ }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({
      name: '', category: '', purchaseDate: new Date().toISOString().split('T')[0],
      price: '', quantity: 1, location: '', condition: 'good', description: ''
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEditModal = (asset) => {
    setEditing(asset);
    setForm({
      name: asset.name || '',
      category: asset.category?._id || asset.category || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      price: asset.price || '',
      quantity: asset.quantity || 1,
      location: asset.location || '',
      condition: asset.condition || 'good',
      description: asset.description || '',
    });
    setImagePreview(asset.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null) formData.append(key, value);
      });
      if (imageFile) formData.append('image', imageFile);
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editing) {
        await api.put(`/api/assets/${editing._id}`, formData, config);
        toast.success('Asset updated');
      } else {
        await api.post('/api/assets', formData, config);
        toast.success('Asset created');
      }
      setShowModal(false);
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/api/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Assets</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Asset
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Image</th>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Purchase Date</th>
                <th className="table-header">Price</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Location</th>
                <th className="table-header">Condition</th>
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
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">No assets found</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell">
                      {asset.image ? (
                        <img src={asset.image} alt={asset.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">N/A</div>
                      )}
                    </td>
                    <td className="table-cell font-medium">{asset.name}</td>
                    <td className="table-cell">{asset.category?.name || '-'}</td>
                    <td className="table-cell">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</td>
                    <td className="table-cell">${(asset.price || 0).toFixed(2)}</td>
                    <td className="table-cell">{asset.quantity || 1}</td>
                    <td className="table-cell">{asset.location || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${asset.condition === 'good' ? 'badge-success' : asset.condition === 'damaged' ? 'badge-danger' : 'badge-warning'}`}>{asset.condition}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(asset)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(asset._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
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
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editing ? 'Edit Asset' : 'Add Asset'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select</option>
                  {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                <input type="date" className="input-field" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                <input type="number" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input type="number" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                <select className="input-field" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea className="input-field" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
                <div className="flex items-center gap-3">
                  <label className="btn-secondary cursor-pointer flex items-center gap-2">
                    <FiUpload size={16} /> Upload
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
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

export default Assets;
