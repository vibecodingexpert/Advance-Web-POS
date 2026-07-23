import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    expiredClients: 0,
    revenue: 0
  });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/super-admin/dashboard');
      setStats(res.data.data.stats);
      setRecentClients(res.data.data.recentClients || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Clients', value: stats.totalClients, icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Active Clients', value: stats.activeClients, icon: FiCheckCircle, color: 'bg-green-500' },
    { label: 'Expired Clients', value: stats.expiredClients, icon: FiXCircle, color: 'bg-red-500' },
    { label: 'Revenue', value: `$${stats.revenue?.toLocaleString() || 0}`, icon: FiDollarSign, color: 'bg-yellow-500' }
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Clients</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Business Name</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Owner</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map((client) => (
                <tr key={client._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{client.businessName}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{client.ownerName}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{client.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      client.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 dark:text-gray-500">No clients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
