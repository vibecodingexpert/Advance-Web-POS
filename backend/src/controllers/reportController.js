const { Op, fn, col, literal } = require('sequelize');
const ApiResponse = require('../utils/response');
const { generatePDF, generateExcel } = require('../services/reportService');

const getSalesReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, customerId } = req.query;

    const { Sale, Customer, User, SaleItem, Product } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }
    if (customerId) where.customerId = customerId;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode'] }] }
      ],
      limit,
      offset,
      order: [['date', 'DESC']]
    });

    const totalAmount = await Sale.sum('total', { where });
    const totalPaid = await Sale.sum('paidAmount', { where });
    const totalDue = await Sale.sum('dueAmount', { where });

    ApiResponse.paginated(res, {
      sales: rows,
      summary: {
        totalSales: count,
        totalAmount: parseFloat(totalAmount || 0),
        totalPaid: parseFloat(totalPaid || 0),
        totalDue: parseFloat(totalDue || 0)
      }
    }, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getPurchaseReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, vendorId } = req.query;

    const { Purchase, Vendor, User, PurchaseItem, Product } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }
    if (vendorId) where.vendorId = vendorId;

    const { count, rows } = await Purchase.findAndCountAll({
      where,
      include: [
        { model: Vendor, attributes: ['id', 'vendorName', 'companyName'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: PurchaseItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode'] }] }
      ],
      limit,
      offset,
      order: [['date', 'DESC']]
    });

    const totalAmount = await Purchase.sum('total', { where });
    const totalPaid = await Purchase.sum('paidAmount', { where });
    const totalDue = await Purchase.sum('dueAmount', { where });

    ApiResponse.paginated(res, {
      purchases: rows,
      summary: {
        totalPurchases: count,
        totalAmount: parseFloat(totalAmount || 0),
        totalPaid: parseFloat(totalPaid || 0),
        totalDue: parseFloat(totalDue || 0)
      }
    }, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getProfitLoss = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const { Sale, Purchase, Expense } = req.models;
    const dateFilter = {};
    if (from && to) {
      dateFilter.date = { [Op.between]: [from, to] };
    } else if (from) {
      dateFilter.date = { [Op.gte]: from };
    } else if (to) {
      dateFilter.date = { [Op.lte]: to };
    }

    const totalSales = await Sale.sum('total', { where: dateFilter });
    const totalPurchases = await Purchase.sum('total', { where: dateFilter });
    const totalExpenses = await Expense.sum('amount', { where: dateFilter });

    const salesAmount = parseFloat(totalSales || 0);
    const purchasesAmount = parseFloat(totalPurchases || 0);
    const expensesAmount = parseFloat(totalExpenses || 0);
    const profitLoss = salesAmount - purchasesAmount - expensesAmount;

    ApiResponse.success(res, {
      totalSales: salesAmount,
      totalPurchases: purchasesAmount,
      totalExpenses: expensesAmount,
      grossProfit: salesAmount - purchasesAmount,
      netProfitLoss: profitLoss,
      fromDate: from || 'All',
      toDate: to || 'All'
    });
  } catch (error) {
    next(error);
  }
};

const getStockReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { categoryId, brandId, lowStock } = req.query;

    const { Product, Category, Brand, Unit } = req.models;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (lowStock === 'true') {
      where.stockQuantity = { [Op.lte]: col('minimum_stock') };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'barcode', 'stockQuantity', 'minimumStock',
        'purchasePrice', 'salePrice'
      ],
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Brand, attributes: ['id', 'name'] },
        { model: Unit, attributes: ['id', 'name', 'shortName'] }
      ],
      limit,
      offset,
      order: [['stockQuantity', 'ASC']]
    });

    const totalStockValue = await Product.sum(
      literal('stock_quantity * purchase_price'),
      { where: { ...where, status: 'active' } }
    );

    ApiResponse.paginated(res, {
      products: rows,
      totalStockValue: parseFloat(totalStockValue || 0)
    }, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getDayBook = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to } = req.query;

    const { DayBook, User } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }

    const { count, rows } = await DayBook.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalDebit = await DayBook.sum('debit', { where });
    const totalCredit = await DayBook.sum('credit', { where });

    ApiResponse.paginated(res, {
      entries: rows,
      totalDebit: parseFloat(totalDebit || 0),
      totalCredit: parseFloat(totalCredit || 0)
    }, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getCashBook = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to } = req.query;

    const { CashBook, User } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }

    const { count, rows } = await CashBook.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalIn = await CashBook.sum('amount', { where: { ...where, type: 'in' } });
    const totalOut = await CashBook.sum('amount', { where: { ...where, type: 'out' } });

    ApiResponse.paginated(res, {
      entries: rows,
      totalIn: parseFloat(totalIn || 0),
      totalOut: parseFloat(totalOut || 0)
    }, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getCustomerLedger = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to } = req.query;
    const customerId = req.params.id;

    const { CustomerLedger } = req.models;

    const customer = await req.models.Customer.findByPk(customerId);
    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    const where = { customerId };
    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    }

    const { count, rows } = await CustomerLedger.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getVendorLedger = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to } = req.query;
    const vendorId = req.params.id;

    const { VendorLedger } = req.models;

    const vendor = await req.models.Vendor.findByPk(vendorId);
    if (!vendor) {
      return ApiResponse.error(res, 'Vendor not found', 404);
    }

    const where = { vendorId };
    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    }

    const { count, rows } = await VendorLedger.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const exportPDF = async (req, res, next) => {
  try {
    const { type, from, to } = req.query;
    const models = req.models;

    let data = [];
    let columns = [];
    let title = 'Report';

    if (type === 'sales') {
      const sales = await models.Sale.findAll({
        where: from && to ? { date: { [Op.between]: [from, to] } } : {},
        include: [{ model: models.Customer, attributes: ['name'] }]
      });
      data = sales.map(s => ({
        'Invoice': s.invoiceNumber,
        'Customer': s.Customer ? s.Customer.name : 'Walk-in',
        'Total': s.total,
        'Paid': s.paidAmount,
        'Due': s.dueAmount,
        'Date': s.date,
        'Status': s.paymentStatus
      }));
      columns = ['Invoice', 'Customer', 'Total', 'Paid', 'Due', 'Date', 'Status'];
      title = 'Sales Report';
    } else if (type === 'purchases') {
      const purchases = await models.Purchase.findAll({
        where: from && to ? { date: { [Op.between]: [from, to] } } : {},
        include: [{ model: models.Vendor, attributes: ['vendorName'] }]
      });
      data = purchases.map(p => ({
        'Purchase No': p.purchaseNumber,
        'Vendor': p.Vendor ? p.Vendor.vendorName : '',
        'Total': p.total,
        'Paid': p.paidAmount,
        'Due': p.dueAmount,
        'Date': p.date,
        'Status': p.paymentStatus
      }));
      columns = ['Purchase No', 'Vendor', 'Total', 'Paid', 'Due', 'Date', 'Status'];
      title = 'Purchases Report';
    } else if (type === 'stock') {
      const products = await models.Product.findAll({
        attributes: ['name', 'barcode', 'stockQuantity', 'minimumStock', 'purchasePrice', 'salePrice']
      });
      data = products.map(p => ({
        'Product': p.name,
        'Barcode': p.barcode,
        'Stock': p.stockQuantity,
        'Min Stock': p.minimumStock,
        'Purchase Price': p.purchasePrice,
        'Sale Price': p.salePrice
      }));
      columns = ['Product', 'Barcode', 'Stock', 'Min Stock', 'Purchase Price', 'Sale Price'];
      title = 'Stock Report';
    }

    await generatePDF(data, columns, title, res);
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const { type, from, to } = req.query;
    const models = req.models;

    let data = [];
    let columns = [];
    let title = 'Report';

    if (type === 'sales') {
      const sales = await models.Sale.findAll({
        where: from && to ? { date: { [Op.between]: [from, to] } } : {},
        include: [{ model: models.Customer, attributes: ['name'] }]
      });
      data = sales.map(s => ({
        'Invoice': s.invoiceNumber,
        'Customer': s.Customer ? s.Customer.name : 'Walk-in',
        'Total': s.total,
        'Paid': s.paidAmount,
        'Due': s.dueAmount,
        'Date': s.date,
        'Status': s.paymentStatus
      }));
      columns = ['Invoice', 'Customer', 'Total', 'Paid', 'Due', 'Date', 'Status'];
      title = 'Sales Report';
    } else if (type === 'purchases') {
      const purchases = await models.Purchase.findAll({
        where: from && to ? { date: { [Op.between]: [from, to] } } : {},
        include: [{ model: models.Vendor, attributes: ['vendorName'] }]
      });
      data = purchases.map(p => ({
        'Purchase No': p.purchaseNumber,
        'Vendor': p.Vendor ? p.Vendor.vendorName : '',
        'Total': p.total,
        'Paid': p.paidAmount,
        'Due': p.dueAmount,
        'Date': p.date,
        'Status': p.paymentStatus
      }));
      columns = ['Purchase No', 'Vendor', 'Total', 'Paid', 'Due', 'Date', 'Status'];
      title = 'Purchases Report';
    } else if (type === 'stock') {
      const products = await models.Product.findAll({
        attributes: ['name', 'barcode', 'stockQuantity', 'minimumStock', 'purchasePrice', 'salePrice']
      });
      data = products.map(p => ({
        'Product': p.name,
        'Barcode': p.barcode,
        'Stock': p.stockQuantity,
        'Min Stock': p.minimumStock,
        'Purchase Price': p.purchasePrice,
        'Sale Price': p.salePrice
      }));
      columns = ['Product', 'Barcode', 'Stock', 'Min Stock', 'Purchase Price', 'Sale Price'];
      title = 'Stock Report';
    }

    await generateExcel(data, columns, title, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getProfitLoss,
  getStockReport,
  getDayBook,
  getCashBook,
  getCustomerLedger,
  getVendorLedger,
  exportPDF,
  exportExcel
};
