import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    expiredClients: 0,
    suspendedClients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/super-admin/dashboard');
      setStats(res.data.data);
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
    { label: 'Suspended', value: stats.suspendedClients, icon: FiAlertTriangle, color: 'bg-orange-500' }
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
    </div>
  );
};

export default Dashboard;
