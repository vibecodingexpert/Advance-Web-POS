import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleDarkMode } from '../../store/slices/uiSlice';
import { FiLayout, FiUsers, FiCreditCard, FiLogOut, FiMenu, FiSun, FiMoon, FiBell } from 'react-icons/fi';

const SuperAdminLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: FiLayout },
    { path: '/admin/clients', label: 'Clients', icon: FiUsers },
    { path: '/admin/plans', label: 'Plans', icon: FiCreditCard }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className={`fixed top-0 left-0 h-full bg-sidebar-bg z-30 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <h1 className="text-white font-bold text-lg">POS Admin</h1>}
          <button onClick={() => dispatch(toggleSidebar())} className="text-gray-300 hover:text-white p-1">
            <FiMenu size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <button onClick={() => dispatch(toggleDarkMode())} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
