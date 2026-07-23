import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import ClientLogin from './pages/auth/ClientLogin';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import ClientLayout from './components/layout/ClientLayout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import ClientManagement from './pages/super-admin/ClientManagement';
import PlanManagement from './pages/super-admin/PlanManagement';
import ClientDashboard from './pages/client/Dashboard';
import POS from './pages/client/POS';
import Products from './pages/client/Products';
import Categories from './pages/client/Categories';
import Brands from './pages/client/Brands';
import Units from './pages/client/Units';
import Customers from './pages/client/Customers';
import Vendors from './pages/client/Vendors';
import Sales from './pages/client/Sales';
import Purchases from './pages/client/Purchases';
import Expenses from './pages/client/Expenses';
import Assets from './pages/client/Assets';
import Inventory from './pages/client/Inventory';
import Reports from './pages/client/Reports';
import Settings from './pages/client/Settings';
import Users from './pages/client/Users';

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/portal/login" />} />
      <Route path="/portal/login" element={<ClientLogin />} />
      <Route path="/secure/login" element={<SuperAdminLogin />} />

      {user?.role === 'super_admin' ? (
        <Route path="/admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="plans" element={<PlanManagement />} />
        </Route>
      ) : isAuthenticated ? (
        <Route path="/dashboard" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="units" element={<Units />} />
          <Route path="customers" element={<Customers />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="sales" element={<Sales />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="assets" element={<Assets />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<Users />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/portal/login" />} />
      )}
    </Routes>
  );
}

export default App;
