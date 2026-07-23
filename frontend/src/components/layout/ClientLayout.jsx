import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleDarkMode } from '../../store/slices/uiSlice';
import {
  FiGrid, FiShoppingCart, FiPackage, FiFolder, FiTag, FiBox,
  FiUsers, FiTruck, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiLayers, FiFileText, FiSettings, FiLogOut, FiMenu, FiSun, FiMoon, FiUserPlus
} from 'react-icons/fi';

const ClientLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { path: '/dashboard/pos', label: 'Sale Invoice', icon: FiShoppingCart },
    { path: '/dashboard/sales', label: 'Sales Register', icon: FiShoppingBag },
    { path: '/dashboard/purchases', label: 'Purchases', icon: FiTruck },
    { path: '/dashboard/products', label: 'Products', icon: FiPackage },
    { path: '/dashboard/categories', label: 'Categories', icon: FiFolder },
    { path: '/dashboard/brands', label: 'Brands', icon: FiTag },
    { path: '/dashboard/units', label: 'Units', icon: FiBox },
    { path: '/dashboard/customers', label: 'Customers', icon: FiUsers },
    { path: '/dashboard/vendors', label: 'Vendors', icon: FiTruck },
    { path: '/dashboard/inventory', label: 'Inventory', icon: FiLayers },
    { path: '/dashboard/expenses', label: 'Expenses', icon: FiDollarSign },
    { path: '/dashboard/assets', label: 'Assets', icon: FiTrendingUp },
    { path: '/dashboard/reports', label: 'Reports', icon: FiFileText },
    { path: '/dashboard/users', label: 'Users', icon: FiUserPlus },
    { path: '/dashboard/settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className={`fixed top-0 left-0 h-full bg-sidebar-bg z-30 transition-all duration-300 overflow-y-auto ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <h1 className="text-white font-bold text-lg">POS System</h1>}
          <button onClick={() => dispatch(toggleSidebar())} className="text-gray-300 hover:text-white p-1">
            <FiMenu size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
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
          <div className="flex items-center gap-3">
            {sidebarOpen && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user?.businessName || user?.name}
              </span>
            )}
          </div>
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

export default ClientLayout;
