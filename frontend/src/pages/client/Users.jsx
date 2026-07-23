import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: '', status: 'active'
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/api/roles');
      setRoles(data.data || []);
    } catch (error) { /* silent */ }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', password: '', role: '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role?._id || user.role || '',
      status: user.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await api.put(`/api/users/${editing._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/api/users', payload);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const viewPermissions = async (user) => {
    setPermissionUser(user);
    try {
      const { data } = await api.get(`/api/users/${user._id}/permissions`);
      setPermissions(data.data || []);
      setShowPermissionModal(true);
    } catch (error) {
      toast.error('Failed to load permissions');
      setPermissions([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Users</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add User
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Last Login</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="table-cell font-medium">{user.name}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">{user.phone || '-'}</td>
                    <td className="table-cell">
                      <span className="badge badge-info">{user.role?.name || user.role || 'staff'}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{user.status}</span>
                    </td>
                    <td className="table-cell">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => viewPermissions(user)} className="text-purple-600 hover:text-purple-800" title="Permissions">
                          <FiShield size={16} />
                        </button>
                        <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-800"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-800"><FiTrash2 size={16} /></button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editing ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {editing ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                <select required className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="">Select Role</option>
                  {roles.map((r) => (<option key={r._id} value={r._id}>{r.name}</option>))}
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermissionModal && permissionUser && (
        <div className="modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Permissions - {permissionUser.name}
              </h3>
              <button onClick={() => setShowPermissionModal(false)} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
            </div>
            {permissions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className={`w-2 h-2 rounded-full ${perm.allowed ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {perm.module || perm.permission || '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {['dashboard', 'pos', 'products', 'categories', 'brands', 'units', 'customers', 'vendors', 'sales', 'purchases', 'expenses', 'assets', 'inventory', 'reports', 'settings', 'users'].map((module) => (
                  <div key={module} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{module}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
