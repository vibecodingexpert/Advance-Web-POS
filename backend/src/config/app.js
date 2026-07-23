const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const errorHandler = require('../middleware/errorHandler');
const superAdminRoutes = require('../routes/superAdmin');
const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const categoryRoutes = require('../routes/categories');
const brandRoutes = require('../routes/brands');
const unitRoutes = require('../routes/units');
const customerRoutes = require('../routes/customers');
const vendorRoutes = require('../routes/vendors');
const saleRoutes = require('../routes/sales');
const purchaseRoutes = require('../routes/purchases');
const paymentRoutes = require('../routes/payments');
const expenseRoutes = require('../routes/expenses');
const assetRoutes = require('../routes/assets');
const stockRoutes = require('../routes/stock');
const reportRoutes = require('../routes/reports');
const settingRoutes = require('../routes/settings');
const userRoutes = require('../routes/users');
const dashboardRoutes = require('../routes/dashboard');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/super-admin', superAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'POS API is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
