const { Op, fn, col, literal } = require('sequelize');
const ApiResponse = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
  try {
    const { Sale, Customer, Product, Purchase, Expense } = req.models;

    const today = new Date().toISOString().split('T')[0];

    const todaySalesCount = await Sale.count({
      where: { date: today, status: 'completed' }
    });

    const todaySalesAmount = await Sale.sum('total', {
      where: { date: today, status: 'completed' }
    });

    const totalCustomers = await Customer.count({ where: { status: 'active' } });
    const totalProducts = await Product.count({ where: { status: 'active' } });

    const lowStockCount = await Product.count({
      where: literal('stock_quantity <= minimum_stock')
    });

    const totalPurchases = await Purchase.sum('total', {});
    const totalExpenses = await Expense.sum('amount', {});

    ApiResponse.success(res, {
      todaySales: {
        count: todaySalesCount || 0,
        amount: parseFloat(todaySalesAmount || 0)
      },
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      lowStockCount: lowStockCount || 0,
      totalPurchases: parseFloat(totalPurchases || 0),
      totalExpenses: parseFloat(totalExpenses || 0)
    });
  } catch (error) {
    next(error);
  }
};

const getTodaySales = async (req, res, next) => {
  try {
    const { Sale, Customer, User, SaleItem, Product } = req.models;

    const today = new Date().toISOString().split('T')[0];

    const sales = await Sale.findAll({
      where: { date: today },
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.success(res, sales);
  } catch (error) {
    next(error);
  }
};

const getChartData = async (req, res, next) => {
  try {
    const { Sale } = req.models;

    const months = [];
    const salesData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      months.push(monthStr);

      const total = await Sale.sum('total', {
        where: {
          date: { [Op.between]: [startDate, endDate] },
          status: 'completed'
        }
      });

      salesData.push(parseFloat(total || 0));
    }

    ApiResponse.success(res, {
      months,
      sales: salesData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getTodaySales,
  getChartData
};
