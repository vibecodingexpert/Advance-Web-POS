import { useState, useEffect } from 'react';
import { FiDollarSign, FiPackage, FiUsers, FiAlertTriangle, FiShoppingCart, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartRes, salesRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/chart-data'),
        api.get('/api/dashboard/today-sales'),
      ]);
      setStats(statsRes.data.data);
      setChartData(chartRes.data.data || []);
      setRecentSales(salesRes.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Today's Sales",
      value: stats?.todaySales ?? 0,
      icon: FiDollarSign,
      color: 'bg-blue-500',
      prefix: '$',
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? 0,
      icon: FiPackage,
      color: 'bg-green-500',
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      icon: FiUsers,
      color: 'bg-purple-500',
    },
    {
      label: 'Low Stock Items',
      value: stats?.lowStockItems ?? 0,
      icon: FiAlertTriangle,
      color: 'bg-red-500',
      link: '/dashboard/inventory',
    },
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const content = (
            <div className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className={`${card.color} p-4 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {card.prefix}{card.value}
                </p>
              </div>
            </div>
          );
          return card.link ? <Link key={idx} to={card.link}>{content}</Link> : <div key={idx}>{content}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Sales Overview (Last 7 Days)
          </h2>
          {chartData.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {chartData.map((item, idx) => {
                const max = Math.max(...chartData.map((d) => d.total || d.amount || 0), 1);
                const height = ((item.total || item.amount || 0) / max) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">
                      ${(item.total || item.amount || 0).toFixed(0)}
                    </span>
                    <div
                      className="w-full bg-primary-500 rounded-t"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-500 truncate w-full text-center">
                      {item.label || item.date || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No chart data available</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Recent Sales
          </h2>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.slice(0, 5).map((sale, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                      <FiShoppingCart className="text-green-600 dark:text-green-400" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {sale.customer?.name || 'Walk-in'}
                      </p>
                      <p className="text-xs text-gray-500">#{sale.invoiceNo || sale._id?.slice(-6)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    ${(sale.total || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No sales today</p>
          )}
          <Link
            to="/dashboard/sales"
            className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3 font-medium"
          >
            View All Sales
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
