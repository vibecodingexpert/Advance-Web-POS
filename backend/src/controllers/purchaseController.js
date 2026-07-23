const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { generateInvoiceNumber } = require('../utils/helpers');
const { PAYMENT_STATUS, STOCK_TYPE } = require('../utils/constants');

const getPurchases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, vendorId, status } = req.query;

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
    if (status) where.status = status;

    const { count, rows } = await Purchase.findAndCountAll({
      where,
      include: [
        { model: Vendor, attributes: ['id', 'vendorName', 'companyName', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: PurchaseItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode'] }] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    ApiResponse.paginated(res, rows, count, page, limit);
  } catch (error) {
    next(error);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const { Purchase, Vendor, User, PurchaseItem, Product } = req.models;
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [
        { model: Vendor, attributes: ['id', 'vendorName', 'companyName', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: PurchaseItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode', 'purchasePrice'] }] }
      ]
    });

    if (!purchase) {
      return ApiResponse.error(res, 'Purchase not found', 404);
    }

    ApiResponse.success(res, purchase);
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const {
      vendorId, items, subtotal, discount, tax, total,
      paidAmount, paymentType, date, notes
    } = req.body;

    const { Purchase, PurchaseItem, Product, Vendor, DayBook, VendorLedger, StockHistory, ProductPurchaseHistory } = req.models;
    const sequelize = req.sequelize;

    const result = await sequelize.transaction(async (t) => {
      const purchaseNumber = generateInvoiceNumber('PUR');

      const dueAmount = paidAmount !== undefined ? Math.max(0, total - paidAmount) : total;
      const pStatus = dueAmount === 0 ? PAYMENT_STATUS.PAID : (paidAmount > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.UNPAID);

      const purchase = await Purchase.create({
        purchaseNumber,
        vendorId,
        userId: req.user.id,
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        paidAmount: paidAmount || 0,
        dueAmount,
        paymentType: paymentType || 'cash',
        paymentStatus: pStatus,
        date: date || new Date().toISOString().split('T')[0],
        notes
      }, { transaction: t });

      for (const item of items) {
        await PurchaseItem.create({
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          discount: item.discount || 0,
          total: item.total
        }, { transaction: t });

        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          await product.update({
            stockQuantity: parseFloat(product.stockQuantity) + parseFloat(item.quantity),
            purchasePrice: parseFloat(item.purchasePrice)
          }, { transaction: t });
        }

        await StockHistory.create({
          productId: item.productId,
          type: STOCK_TYPE.PURCHASE,
          quantity: parseFloat(item.quantity),
          referenceType: 'purchase',
          referenceId: purchase.id,
          notes: `Purchase #${purchaseNumber}`,
          createdBy: req.user.id
        }, { transaction: t });

        const vendor = await Vendor.findByPk(vendorId, { transaction: t });
        await ProductPurchaseHistory.create({
          productId: item.productId,
          purchaseId: purchase.id,
          vendorName: vendor ? vendor.vendorName : '',
          quantity: item.quantity,
          purchaseRate: item.purchasePrice,
          purchaseNumber,
          purchaseDate: date || new Date().toISOString().split('T')[0]
        }, { transaction: t });
      }

      const vendor = await Vendor.findByPk(vendorId, { transaction: t });
      if (vendor) {
        const newPurchaseTotal = parseFloat(vendor.purchaseTotal) + parseFloat(total);
        const newPaidAmount = parseFloat(vendor.paidAmount) + parseFloat(paidAmount || 0);
        const newDueAmount = parseFloat(vendor.dueAmount) + parseFloat(dueAmount);

        await vendor.update({
          purchaseTotal: newPurchaseTotal,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount
        }, { transaction: t });

        const lastLedger = await VendorLedger.findOne({
          where: { vendorId },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        const prevBalance = lastLedger ? parseFloat(lastLedger.balance) : 0;

        await VendorLedger.create({
          vendorId,
          date: date || new Date().toISOString().split('T')[0],
          type: 'purchase',
          referenceId: purchase.id,
          debit: total,
          credit: 0,
          balance: prevBalance + parseFloat(total),
          description: `Purchase #${purchaseNumber}`
        }, { transaction: t });
      }

      const lastDayBook = await DayBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevBalance = lastDayBook ? parseFloat(lastDayBook.balance) : 0;

      await DayBook.create({
        date: date || new Date().toISOString().split('T')[0],
        description: `Purchase #${purchaseNumber}`,
        debit: 0,
        credit: parseFloat(paidAmount || 0) > 0 ? parseFloat(paidAmount) : 0,
        balance: prevBalance - parseFloat(paidAmount || 0),
        referenceType: 'purchase',
        referenceId: purchase.id,
        userId: req.user.id
      }, { transaction: t });

      return purchase;
    });

    const purchase = await Purchase.findByPk(result.id, {
      include: [
        { model: req.models.Vendor, attributes: ['id', 'vendorName', 'companyName'] },
        { model: req.models.User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: req.models.PurchaseItem, include: [{ model: req.models.Product, attributes: ['id', 'name', 'barcode'] }] }
      ]
    });

    ApiResponse.created(res, purchase, 'Purchase created successfully');
  } catch (error) {
    next(error);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const { Purchase } = req.models;
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return ApiResponse.error(res, 'Purchase not found', 404);
    }

    const { notes } = req.body;
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;

    await purchase.update(updateData);
    ApiResponse.success(res, purchase, 'Purchase updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const { Purchase } = req.models;
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return ApiResponse.error(res, 'Purchase not found', 404);
    }

    await purchase.update({ status: 'cancelled' });
    ApiResponse.success(res, null, 'Purchase cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const getPurchasePriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { ProductPurchaseHistory } = req.models;

    const history = await ProductPurchaseHistory.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    ApiResponse.success(res, history);
  } catch (error) {
    next(error);
  }
};

const returnPurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const { Purchase, PurchaseItem, Product, Vendor, VendorLedger, DayBook, StockHistory } = req.models;
    const sequelize = req.sequelize;

    const purchase = await Purchase.findByPk(id);
    if (!purchase) {
      return ApiResponse.error(res, 'Purchase not found', 404);
    }

    const result = await sequelize.transaction(async (t) => {
      await purchase.update({ status: 'returned' }, { transaction: t });

      let returnTotal = 0;
      const itemsToReturn = items || await PurchaseItem.findAll({ where: { purchaseId: id }, transaction: t });

      for (const item of itemsToReturn) {
        const qty = item.quantity || item.qty;
        const price = item.purchasePrice || item.price;

        const product = await Product.findByPk(item.productId || item.product_id, { transaction: t });
        if (product) {
          await product.update({
            stockQuantity: Math.max(0, parseFloat(product.stockQuantity) - parseFloat(qty))
          }, { transaction: t });
        }

        const lineTotal = parseFloat(qty) * parseFloat(price);
        returnTotal += lineTotal;

        await StockHistory.create({
          productId: item.productId || item.product_id,
          type: STOCK_TYPE.RETURN,
          quantity: -parseFloat(qty),
          referenceType: 'purchase_return',
          referenceId: purchase.id,
          notes: `Return for Purchase #${purchase.purchaseNumber}`,
          createdBy: req.user.id
        }, { transaction: t });
      }

      const vendor = await Vendor.findByPk(purchase.vendorId, { transaction: t });
      if (vendor) {
        const newPurchaseTotal = Math.max(0, parseFloat(vendor.purchaseTotal) - returnTotal);
        const newDueAmount = Math.max(0, parseFloat(vendor.dueAmount) - returnTotal);

        await vendor.update({
          purchaseTotal: newPurchaseTotal,
          dueAmount: newDueAmount
        }, { transaction: t });
      }

      const lastLedger = await VendorLedger.findOne({
        where: { vendorId: purchase.vendorId },
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevBalance = lastLedger ? parseFloat(lastLedger.balance) : 0;

      await VendorLedger.create({
        vendorId: purchase.vendorId,
        date: new Date().toISOString().split('T')[0],
        type: 'return',
        referenceId: purchase.id,
        debit: 0,
        credit: returnTotal,
        balance: prevBalance - returnTotal,
        description: `Return for Purchase #${purchase.purchaseNumber}`
      }, { transaction: t });

      const lastDayBook = await DayBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevDayBalance = lastDayBook ? parseFloat(lastDayBook.balance) : 0;

      await DayBook.create({
        date: new Date().toISOString().split('T')[0],
        description: `Return for Purchase #${purchase.purchaseNumber}`,
        debit: returnTotal,
        credit: 0,
        balance: prevDayBalance + returnTotal,
        referenceType: 'purchase_return',
        referenceId: purchase.id,
        userId: req.user.id
      }, { transaction: t });

      return purchase;
    });

    ApiResponse.success(res, result, 'Purchase returned successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchasePriceHistory,
  returnPurchase
};
