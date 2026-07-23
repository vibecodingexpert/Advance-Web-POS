import { useState, useEffect } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ from: '', to: '', vendor: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [form, setForm] = useState({
    vendor: '', date: new Date().toISOString().split('T')[0],
    items: [], discount: 0, tax: 0, paid: 0, notes: '', status: 'pending'
  });
  const [newItem, setNewItem] = useState({ product: '', quantity: 1, price: 0 });

  useEffect(() => {
    fetchVendors();
    fetchProducts();
    fetchPurchases();
  }, [page, search, filters]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.vendor) params.vendor = filters.vendor;
      const { data } = await api.get('/api/purchases', { params });
      setPurchases(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/api/vendors');
      setVendors(data.data || []);
    } catch (error) { /* silent */ }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/api/products');
      setProducts(data.data || []);
    } catch (error) { /* silent */ }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({
      vendor: '', date: new Date().toISOString().split('T')[0],
      items: [], discount: 0, tax: 0, paid: 0, notes: '', status: 'pending'
    });
    setNewItem({ product: '', quantity: 1, price: 0 });
    setShowModal(true);
  };

  const openEditModal = (purchase) => {
    setEditing(purchase);
    setForm({
      vendor: purchase.vendor?._id || purchase.vendor || '',
      date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: purchase.items || [],
      discount: purchase.discount || 0,
      tax: purchase.tax || 0,
      paid: purchase.paid || 0,
      notes: purchase.notes || '',
      status: purchase.status || 'pending',
    });
    setShowModal(true);
  };

  const addItem = () => {
    if (!newItem.product) return toast.warn('Select a product');
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...newItem, _id: Date.now() }],
    }));
    setNewItem({ product: '', quantity: 1, price: 0 });
  };

  const removeItem = (id) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((item) => item._id !== id) }));
  };

  const purchaseSubtotal = form.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const purchaseTotal = purchaseSubtotal - (form.discount || 0) + ((purchaseSubtotal - (form.discount || 0)) * (form.tax || 0)) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) { toast.warn('Add at least one item'); return; }
    try {
      const payload = {
        ...form,
        subtotal: purchaseSubtotal,
        total: purchaseTotal,
      };
      if (editing) {
        await api.put(`/api/purchases/${editing._id}`, payload);
        toast.success('Purchase updated');
      } else {
        await api.post('/api/purchases', payload);
        toast.success('Purchase created');
      }
      setShowModal(false);
      fetchPurchases();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save purchase');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await api.delete(`/api/purchases/${id}`);
      toast.success('Purchase deleted');
      fetchPurchases();
    } catch (error) {
      toast.error('Failed to delete purchase');
    }
  };

  const viewPurchase = async (purchase) => {
    try {
      const { data } = await api.get(`/api/purchases/${purchase._id}`);
      setViewingPurchase(data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load purchase details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Purchases</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> New Purchase
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search purchases..." className="input-field pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <input type="date" className="input-field w-full sm:w-40" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className="input-field w-full sm:w-40" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <select className="input-field w-full sm:w-44" value={filters.vendor} onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}>
            <option value="">All Vendors</option>
            {vendors.map((v) => (<option key={v._id} value={v._id}>{v.name}</option>))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Purchase#</th>
                <th className="table-header">Date</th>
                <th className="table-header">Vendor</th>
                <th className="table-header">Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Due</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" /></td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-400">No purchases found</td></tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">#{p.purchaseNo || p._id?.slice(-6)}</td>
                    <td className="table-cell">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                    <td className="table-cell">{p.vendor?.name || '-'}</td>
                    <td className="table-cell">${(p.total || 0).toFixed(2)}</td>
                    <td className="table-cell text-green-600">${(p.paid || 0).toFixed(2)}</td>
                    <td className="table-cell text-red-600">${((p.total || 0) - (p.paid || 0)).toFixed(2)}</td>
                    <td className="table-cell">
                      <span className={`badge ${p.status === 'received' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>{p.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => viewPurchase(p)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => openEditModal(p)} className="text-purple-600 hover:text-purple-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm py-1 px-3">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm py-1 px-3">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editing ? 'Edit Purchase' : 'New Purchase'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor *</label>
                  <select required className="input-field" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (<option key={v._id} value={v._id}>{v.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items</label>
                <div className="flex gap-2 mb-2">
                  <select className="input-field flex-1" value={newItem.product} onChange={(e) => setNewItem({ ...newItem, product: e.target.value })}>
                    <option value="">Select Product</option>
                    {products.map((p) => (<option key={p._id} value={p._id}>{p.name}</option>))}
                  </select>
                  <input type="number" placeholder="Qty" className="input-field w-20" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
                  <input type="number" placeholder="Price" className="input-field w-28" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })} />
                  <button type="button" onClick={addItem} className="btn-primary text-sm">Add</button>
                </div>
                {form.items.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <th className="table-header">Product</th>
                          <th className="table-header">Qty</th>
                          <th className="table-header">Price</th>
                          <th className="table-header">Total</th>
                          <th className="table-header"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item) => {
                          const prod = products.find((p) => p._id === item.product);
                          return (
                            <tr key={item._id} className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="table-cell">{prod?.name || item.product}</td>
                              <td className="table-cell">{item.quantity}</td>
                              <td className="table-cell">${(item.price || 0).toFixed(2)}</td>
                              <td className="table-cell">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                              <td className="table-cell">
                                <button type="button" onClick={() => removeItem(item._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={14} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
                  <input type="number" step="0.01" className="input-field" value={form.discount} onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax (%)</label>
                  <input type="number" step="0.1" className="input-field" value={form.tax} onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Amount</label>
                  <input type="number" step="0.01" className="input-field" value={form.paid} onChange={(e) => setForm({ ...form, paid: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Subtotal: ${purchaseSubtotal.toFixed(2)}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">Total: ${purchaseTotal.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea className="input-field" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create Purchase'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingPurchase && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Purchase #{viewingPurchase.purchaseNo || viewingPurchase._id?.slice(-6)}</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Date:</span> <span className="text-gray-800 dark:text-white">{new Date(viewingPurchase.date || viewingPurchase.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500">Vendor:</span> <span className="text-gray-800 dark:text-white">{viewingPurchase.vendor?.name || '-'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`badge ${viewingPurchase.status === 'received' ? 'badge-success' : viewingPurchase.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>{viewingPurchase.status}</span></div>
            </div>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="table-header">Product</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewingPurchase.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="table-cell">{item.product?.name || item.name || '-'}</td>
                    <td className="table-cell">{item.quantity}</td>
                    <td className="table-cell">${(item.price || 0).toFixed(2)}</td>
                    <td className="table-cell">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">Subtotal: ${(viewingPurchase.subtotal || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500">Discount: ${(viewingPurchase.discount || 0).toFixed(2)}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">Total: ${(viewingPurchase.total || 0).toFixed(2)}</p>
              <p className="text-sm text-green-600">Paid: ${(viewingPurchase.paid || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
