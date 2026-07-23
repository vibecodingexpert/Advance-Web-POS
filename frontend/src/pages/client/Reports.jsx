import { useState, useEffect } from 'react';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const TABS = ['Sales Report', 'Purchases', 'Profit/Loss', 'Stock', 'Day Book', 'Cash Book'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('Sales Report');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (from && to) fetchReport();
  }, [activeTab, from, to]);

  const fetchReport = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const params = { from, to };
      let endpoint = '';
      switch (activeTab) {
        case 'Sales Report': endpoint = '/api/reports/sales'; break;
        case 'Purchases': endpoint = '/api/reports/purchases'; break;
        case 'Profit/Loss': endpoint = '/api/reports/profit-loss'; break;
        case 'Stock': endpoint = '/api/reports/stock'; break;
        case 'Day Book': endpoint = '/api/reports/day-book'; break;
        case 'Cash Book': endpoint = '/api/reports/cash-book'; break;
      }
      const { data: res } = await api.get(endpoint, { params });
      if (activeTab === 'Profit/Loss') {
        setSummary(res.data);
        setData([]);
      } else {
        setData(res.data || []);
        setSummary(null);
      }
    } catch (error) {
      toast.error('Failed to load report');
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = { from, to };
      let endpoint = '';
      switch (activeTab) {
        case 'Sales Report': endpoint = '/api/reports/sales/export'; break;
        case 'Purchases': endpoint = '/api/reports/purchases/export'; break;
        case 'Stock': endpoint = '/api/reports/stock/export'; break;
        case 'Day Book': endpoint = '/api/reports/day-book/export'; break;
        case 'Cash Book': endpoint = '/api/reports/cash-book/export'; break;
        default: toast.warn('Export not available for this tab'); return;
      }
      const { data: blob } = await api.get(endpoint, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (activeTab === 'Profit/Loss') {
      if (!summary) return <p className="text-center text-gray-400 py-8">Select date range to view report</p>;
      const profit = (summary.totalSales || 0) - (summary.totalPurchases || 0) - (summary.totalExpenses || 0);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSales || 0)}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchases</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPurchases || 0)}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalExpenses || 0)}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Profit / Loss</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{formatCurrency(Math.abs(profit))}
            </p>
          </div>
        </div>
      );
    }

    if (activeTab === 'Stock') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Min Stock</th>
                <th className="table-header">Sale Price</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-400">No data available</td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="table-cell">{item.name || item.Product?.name || '-'}</td>
                    <td className="table-cell">{item.Category?.name || '-'}</td>
                    <td className={`table-cell ${item.stock <= (item.minStock || 0) ? 'text-red-600 font-medium' : ''}`}>{item.stock ?? 0}</td>
                    <td className="table-cell">{item.minStock || 0}</td>
                    <td className="table-cell">{formatCurrency(item.salePrice || 0)}</td>
                    <td className="table-cell">
                      <span className={`badge ${(item.stock ?? 0) > (item.minStock || 0) ? 'badge-success' : 'badge-danger'}`}>
                        {(item.stock ?? 0) > (item.minStock || 0) ? 'In Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {data.length > 0 &&
                Object.keys(data[0])
                  .filter((k) => !k.startsWith('_') && k !== '__v')
                  .slice(0, 8)
                  .map((key) => (
                    <th key={key} className="table-header capitalize">{key.replace(/([A-Z])/g, ' $1').replace('_', ' ')}</th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-400">No data available</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                  {Object.entries(row)
                    .filter(([k]) => !k.startsWith('_') && k !== '__v')
                    .slice(0, 8)
                    .map(([key, val], i) => (
                      <td key={i} className="table-cell">
                        {key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('price')
                          ? typeof val === 'number' ? formatCurrency(val) : val
                          : key.toLowerCase().includes('date') || key.toLowerCase().includes('createdat')
                          ? val ? new Date(val).toLocaleDateString() : '-'
                          : typeof val === 'object' && val !== null
                          ? val.name || val.id || JSON.stringify(val)
                          : String(val ?? '-')}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reports</h1>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab !== 'Profit/Loss' && activeTab !== 'Stock' && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 ml-auto">
              <FiDownload size={16} /> Export
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
            <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
            <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={fetchReport} className="btn-primary flex items-center gap-2">
            <FiSearch size={16} /> Load
          </button>
        </div>

        {renderTable()}

        {activeTab === 'Sales Report' && data.length > 0 && (
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p className="text-sm text-gray-500">
              Total: <span className="font-bold text-gray-800 dark:text-white">
                {formatCurrency(data.reduce((sum, row) => sum + (row.total || 0), 0))}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Paid: <span className="font-bold text-green-600">
                {formatCurrency(data.reduce((sum, row) => sum + (row.paid || 0), 0))}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Due: <span className="font-bold text-red-600">
                {formatCurrency(data.reduce((sum, row) => sum + (row.due || 0), 0))}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
