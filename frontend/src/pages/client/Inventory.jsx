import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiX, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'add', quantity: 1, reason: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => { fetchProducts(); }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/api/products', { params });
      setProducts(data.data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (product) => {
    setAdjustProduct(product);
    setAdjustForm({ type: 'add', quantity: 1, reason: '' });
    setShowAdjustModal(true);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/products/${adjustProduct.id}/adjust-stock`, adjustForm);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const viewHistory = async (product) => {
    setHistoryProduct(product);
    try {
      const { data } = await api.get(`/api/products/${product.id}/stock-history`);
      setHistoryData(data.data || []);
      setShowHistoryModal(true);
    } catch (error) {
      toast.error('Failed to load stock history');
      setHistoryData([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory</h1>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
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
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Min Stock</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">No products found</td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = (product.stockQuantity ?? 0) <= (product.minStock || 0);
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isLowStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                    >
                      <td className="table-cell font-medium">{product.name}</td>
                      <td className="table-cell">{product.Category?.name || '-'}</td>
                      <td className={`table-cell font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                        {product.stockQuantity ?? 0}
                      </td>
                      <td className="table-cell">{product.minStock || 0}</td>
                      <td className="table-cell">
                        {isLowStock ? (
                          <span className="badge badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAdjustModal(product)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                          >
                            <FiPlus size={14} /> Adjust
                          </button>
                          <button
                            onClick={() => viewHistory(product)}
                            className="text-purple-600 hover:text-purple-800"
                            title="View History"
                          >
                            <FiEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdjustModal && adjustProduct && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Adjust Stock - {adjustProduct.name}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Current Stock: <strong>{adjustProduct.stockQuantity ?? 0}</strong></p>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select className="input-field" value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
                  <option value="add">Add Stock</option>
                  <option value="subtract">Subtract Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                <textarea className="input-field" rows="2" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. Stock count correction, damaged goods..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Adjust Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historyProduct && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Stock History - {historyProduct.name}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="table-header">Date</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Before</th>
                    <th className="table-header">After</th>
                    <th className="table-header">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.length > 0 ? (
                    historyData.map((entry, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="table-cell">{new Date(entry.createdAt || entry.date).toLocaleString()}</td>
                        <td className="table-cell">
                          <span className={`badge ${entry.type === 'add' ? 'badge-success' : 'badge-danger'}`}>{entry.type}</span>
                        </td>
                        <td className="table-cell">{entry.quantity || 0}</td>
                        <td className="table-cell">{entry.before || 0}</td>
                        <td className="table-cell">{entry.after || 0}</td>
                        <td className="table-cell max-w-xs truncate">{entry.reason || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-400">No history available</td>
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

export default Inventory;
