import { useState, useEffect } from 'react';
import {
  FiSearch, FiEye, FiPrinter, FiRotateCcw, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ from: '', to: '', customer: '', paymentType: '' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchSales();
  }, [page, search, filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.customer) params.customer = filters.customer;
      if (filters.paymentType) params.paymentType = filters.paymentType;
      const { data } = await api.get('/api/sales', { params });
      setSales(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/api/customers');
      setCustomers(data.data || []);
    } catch (error) {
      // silent
    }
  };

  const viewSale = async (sale) => {
    try {
      const { data } = await api.get(`/api/sales/${sale.id}`);
      setViewingSale(data.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const handlePrint = async (sale) => {
    try {
      const { data } = await api.get(`/api/sales/${sale.id}/print`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to print invoice');
    }
  };

  const handleReturn = async (sale) => {
    if (!window.confirm('Process return for this sale?')) return;
    try {
      await api.post(`/api/sales/${sale.id}/return`);
      toast.success('Return processed');
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Register</h1>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <input
            type="date"
            className="input-field w-full sm:w-40"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <input
            type="date"
            className="input-field w-full sm:w-40"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <select
            className="input-field w-full sm:w-44"
            value={filters.customer}
            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="input-field w-full sm:w-36"
            value={filters.paymentType}
            onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
          >
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Invoice#</th>
                <th className="table-header">Date</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Total</th>
                <th className="table-header">Paid</th>
                <th className="table-header">Due</th>
                <th className="table-header">Payment Type</th>
                <th className="table-header">Created By</th>
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
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">No sales found</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">#{sale.invoiceNumber || sale.id}</td>
                    <td className="table-cell">{new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td className="table-cell">{sale.Customer?.name || 'Walk-in'}</td>
                    <td className="table-cell">{formatCurrency(sale.total || 0)}</td>
                    <td className="table-cell text-green-600">{formatCurrency(sale.paidAmount || 0)}</td>
                    <td className="table-cell text-red-600">{formatCurrency(sale.dueAmount || 0)}</td>
                    <td className="table-cell">
                      <span className={`badge ${sale.paymentType === 'cash' ? 'badge-success' : sale.paymentType === 'credit' ? 'badge-warning' : 'badge-info'}`}>
                        {sale.paymentType}
                      </span>
                    </td>
                    <td className="table-cell">{sale.createdBy?.name || '-'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => viewSale(sale)} className="text-blue-600 hover:text-blue-800" title="View"><FiEye size={16} /></button>
                        <button onClick={() => handlePrint(sale)} className="text-purple-600 hover:text-purple-800" title="Print"><FiPrinter size={16} /></button>
                        <button onClick={() => handleReturn(sale)} className="text-orange-600 hover:text-orange-800" title="Return"><FiRotateCcw size={16} /></button>
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

      {showViewModal && viewingSale && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Sale #{viewingSale.invoiceNumber || viewingSale.id}
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Date:</span> <span className="text-gray-800 dark:text-white">{new Date(viewingSale.createdAt).toLocaleString()}</span></div>
              <div><span className="text-gray-500">Customer:</span> <span className="text-gray-800 dark:text-white">{viewingSale.Customer?.name || 'Walk-in'}</span></div>
              <div><span className="text-gray-500">Payment:</span> <span className="text-gray-800 dark:text-white capitalize">{viewingSale.paymentType}</span></div>
              <div><span className="text-gray-500">Created By:</span> <span className="text-gray-800 dark:text-white">{viewingSale.createdBy?.name || '-'}</span></div>
            </div>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="table-header">Product</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Discount</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody>
                {(viewingSale.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="table-cell">{item.Product?.name || item.name || '-'}</td>
                    <td className="table-cell">{item.quantity || 0}</td>
                    <td className="table-cell">{formatCurrency(item.price || 0)}</td>
                    <td className="table-cell">{formatCurrency(item.discount || 0)}</td>
                    <td className="table-cell">{formatCurrency((item.price || 0) * (item.quantity || 0) - (item.discount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-right">
              <p className="text-sm text-gray-500">Subtotal: {formatCurrency(viewingSale.subtotal || 0)}</p>
              <p className="text-sm text-gray-500">Discount: {formatCurrency(viewingSale.discount || 0)}</p>
              <p className="text-sm text-gray-500">Tax: {formatCurrency(viewingSale.tax || 0)}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">Total: {formatCurrency(viewingSale.total || 0)}</p>
              <p className="text-sm text-green-600">Paid: {formatCurrency(viewingSale.paidAmount || 0)}</p>
              {(viewingSale.dueAmount || 0) > 0 && <p className="text-sm text-red-600">Due: {formatCurrency(viewingSale.dueAmount || 0)}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
