import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  FiUsers, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiRefreshCw, FiCalendar, FiTrendingUp, FiPackage
} from 'react-icons/fi';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/super-admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentClients = data?.recentClients || [];

  const statCards = [
    { label: 'Total Clients', value: stats.totalClients || 0, icon: FiUsers, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Active', value: stats.activeClients || 0, icon: FiCheckCircle, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Suspended', value: stats.suspendedClients || 0, icon: FiAlertTriangle, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Expired', value: stats.expiredClients || 0, icon: FiXCircle, color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your POS system</p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary text-sm flex items-center gap-2">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl p-5 border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="text-white" size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Clients</h2>
          {recentClients.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">No clients registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Business</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{c.businessName}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{c.ownerName}</td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{c.email}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          c.status === 'suspended' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          c.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>{c.status}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Info</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FiTrendingUp className="text-primary-500" size={20} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">New (6 months)</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data?.monthlyClients || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FiPackage className="text-emerald-500" size={20} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Subscriptions</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalSubscriptions || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FiCalendar className="text-purple-500" size={20} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plans</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{(data?.plans || []).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
