import { useState, useEffect } from 'react';
import { FiDollarSign, FiPackage, FiUsers, FiAlertTriangle, FiShoppingCart, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, salesRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/chart-data'),
        api.get('/api/dashboard/today-sales'),
      ]);
      setStats(statsRes.data.data);
      setChartData(chartRes.data.data);
      setRecentSales(salesRes.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val || 0);
  };

  const statCards = [
    { label: "Today's Sales", value: stats?.todaySales?.amount ?? 0, icon: FiDollarSign, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', prefix: true },
    { label: 'Sale Count', value: stats?.todaySales?.count ?? 0, icon: FiTrendingUp, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: FiPackage, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: FiUsers, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Low Stock Items', value: stats?.lowStockCount ?? 0, icon: FiAlertTriangle, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', link: '/dashboard/inventory' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Business overview</p>
        </div>
        <button onClick={fetchData} className="btn-secondary text-sm flex items-center gap-2"><FiRefreshCw size={14} /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const content = (
            <div className={`${card.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700 h-full`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {card.prefix ? formatCurrency(card.value) : card.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${card.color} p-2.5 rounded-xl shadow-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
            </div>
          );
          return card.link ? <Link key={idx} to={card.link}>{content}</Link> : <div key={idx}>{content}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Sales (6 Months)</h2>
          {chartData && chartData.months ? (
            <div className="flex items-end gap-3 h-52">
              {chartData.months.map((month, idx) => {
                const max = Math.max(...chartData.sales, 1);
                const height = (chartData.sales[idx] / max) * 100;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatCurrency(chartData.sales[idx])}
                    </span>
                    <div className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-300 hover:from-primary-600" style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {month.slice(-2) + '/' + month.slice(2, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No sales data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Sales</h2>
          {recentSales.length > 0 ? (
            <div className="space-y-2">
              {recentSales.slice(0, 6).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                      <FiShoppingCart className="text-emerald-600 dark:text-emerald-400" size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.Customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-gray-500">#{sale.invoiceNumber}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No sales today</p>
          )}
          <Link to="/dashboard/sales" className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3 font-medium">
            View All Sales →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
