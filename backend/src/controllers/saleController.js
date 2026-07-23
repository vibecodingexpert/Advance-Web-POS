const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { generateInvoiceNumber, generateReceiptNumber } = require('../utils/helpers');
const { PAYMENT_TYPES, PAYMENT_STATUS, SALE_STATUS, STOCK_TYPE } = require('../utils/constants');

const getSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, customerId, status } = req.query;

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
    if (status) where.status = status;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode'] }] }
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

const getSale = async (req, res, next) => {
  try {
    const { Sale, Customer, User, SaleItem, Product } = req.models;
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: SaleItem, include: [{ model: Product, attributes: ['id', 'name', 'barcode', 'salePrice'] }] }
      ]
    });

    if (!sale) {
      return ApiResponse.error(res, 'Sale not found', 404);
    }

    ApiResponse.success(res, sale);
  } catch (error) {
    next(error);
  }
};

const createSale = async (req, res, next) => {
  try {
    const {
      customerId, items, subtotal, discount, total,
      paidAmount, paymentType, date, notes
    } = req.body;

    const { Sale, SaleItem, Product, Customer, DayBook, CustomerLedger, StockHistory, ProductSaleHistory } = req.models;
    const sequelize = req.sequelize;

    const result = await sequelize.transaction(async (t) => {
      const invoiceNumber = generateInvoiceNumber('SALE');

      const dueAmount = paidAmount !== undefined ? Math.max(0, total - paidAmount) : total;
      const pStatus = dueAmount === 0 ? PAYMENT_STATUS.PAID : (paidAmount > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.UNPAID);

      const sale = await Sale.create({
        invoiceNumber,
        customerId: customerId || null,
        userId: req.user.id,
        subtotal,
        discount: discount || 0,
        total,
        paidAmount: paidAmount || 0,
        dueAmount,
        paymentType: paymentType || PAYMENT_TYPES.CASH,
        paymentStatus: pStatus,
        status: SALE_STATUS.COMPLETED,
        date: date || new Date().toISOString().split('T')[0],
        notes
      }, { transaction: t });

      let customerTotal = 0;
      for (const item of items) {
        const saleItem = await SaleItem.create({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: item.total
        }, { transaction: t });

        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          await product.update({
            stockQuantity: parseFloat(product.stockQuantity) - parseFloat(item.quantity)
          }, { transaction: t });
        }

        customerTotal += parseFloat(item.total);

        await StockHistory.create({
          productId: item.productId,
          type: STOCK_TYPE.SALE,
          quantity: -parseFloat(item.quantity),
          referenceType: 'sale',
          referenceId: sale.id,
          notes: `Sale #${invoiceNumber}`,
          createdBy: req.user.id
        }, { transaction: t });

        let customerName = 'Walk-in Customer';
        if (customerId) {
          const cust = await Customer.findByPk(customerId, { transaction: t });
          if (cust) customerName = cust.name;
        }

        await ProductSaleHistory.create({
          productId: item.productId,
          saleId: sale.id,
          customerName,
          quantity: item.quantity,
          price: item.price,
          invoiceNumber,
          saleDate: date || new Date().toISOString().split('T')[0]
        }, { transaction: t });
      }

      if (customerId) {
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (customer) {
          const newTotalSale = parseFloat(customer.totalSale) + parseFloat(total);
          const newPaidAmount = parseFloat(customer.paidAmount) + parseFloat(paidAmount || 0);
          const newDueAmount = parseFloat(customer.dueAmount) + parseFloat(dueAmount);

          await customer.update({
            totalSale: newTotalSale,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount
          }, { transaction: t });

          const lastLedger = await CustomerLedger.findOne({
            where: { customerId },
            order: [['createdAt', 'DESC']],
            transaction: t
          });
          const prevBalance = lastLedger ? parseFloat(lastLedger.balance) : 0;

          await CustomerLedger.create({
            customerId,
            date: date || new Date().toISOString().split('T')[0],
            type: 'sale',
            referenceId: sale.id,
            debit: total,
            credit: 0,
            balance: prevBalance + parseFloat(total),
            description: `Sale #${invoiceNumber}`
          }, { transaction: t });
        }
      }

      const lastDayBook = await DayBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevDayBalance = lastDayBook ? parseFloat(lastDayBook.balance) : 0;

      await DayBook.create({
        date: date || new Date().toISOString().split('T')[0],
        description: `Sale #${invoiceNumber}`,
        debit: parseFloat(paidAmount || 0) > 0 ? parseFloat(paidAmount) : 0,
        credit: 0,
        balance: prevDayBalance + parseFloat(paidAmount || 0),
        referenceType: 'sale',
        referenceId: sale.id,
        userId: req.user.id
      }, { transaction: t });

      return sale;
    });

    const sale = await Sale.findByPk(result.id, {
      include: [
        { model: req.models.Customer, attributes: ['id', 'name', 'phone'] },
        { model: req.models.User, as: 'createdBy', attributes: ['id', 'name'] },
        { model: req.models.SaleItem, include: [{ model: req.models.Product, attributes: ['id', 'name', 'barcode'] }] }
      ]
    });

    ApiResponse.created(res, sale, 'Sale created successfully');
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const { Sale } = req.models;
    const sale = await Sale.findByPk(req.params.id);

    if (!sale) {
      return ApiResponse.error(res, 'Sale not found', 404);
    }

    const { notes } = req.body;
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;

    await sale.update(updateData);
    ApiResponse.success(res, sale, 'Sale updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const { Sale } = req.models;
    const sale = await Sale.findByPk(req.params.id);

    if (!sale) {
      return ApiResponse.error(res, 'Sale not found', 404);
    }

    await sale.update({ status: SALE_STATUS.CANCELLED });
    ApiResponse.success(res, null, 'Sale cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const holdInvoice = async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, subtotal, discount, total, notes } = req.body;

    const { HeldInvoice } = req.models;
    const invoiceNumber = generateInvoiceNumber('HLD');

    const heldInvoice = await HeldInvoice.create({
      invoiceNumber,
      customerName,
      customerPhone,
      items: JSON.stringify(items),
      subtotal,
      discount: discount || 0,
      total,
      notes,
      userId: req.user.id
    });

    ApiResponse.created(res, heldInvoice, 'Invoice held successfully');
  } catch (error) {
    next(error);
  }
};

const getHeldInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { HeldInvoice, User } = req.models;

    const { count, rows } = await HeldInvoice.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] }
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

const getHeldInvoice = async (req, res, next) => {
  try {
    const { HeldInvoice } = req.models;
    const heldInvoice = await HeldInvoice.findByPk(req.params.id);

    if (!heldInvoice) {
      return ApiResponse.error(res, 'Held invoice not found', 404);
    }

    const result = heldInvoice.toJSON();
    if (result.items && typeof result.items === 'string') {
      result.items = JSON.parse(result.items);
    }

    ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const deleteHeldInvoice = async (req, res, next) => {
  try {
    const { HeldInvoice } = req.models;
    const heldInvoice = await HeldInvoice.findByPk(req.params.id);

    if (!heldInvoice) {
      return ApiResponse.error(res, 'Held invoice not found', 404);
    }

    await heldInvoice.destroy();
    ApiResponse.success(res, null, 'Held invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getPriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const { ProductSaleHistory } = req.models;

    const where = {};
    if (productId) where.productId = productId;

    const history = await ProductSaleHistory.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    ApiResponse.success(res, history);
  } catch (error) {
    next(error);
  }
};

const returnSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const { Sale, SaleItem, Product, Customer, CustomerLedger, DayBook, StockHistory } = req.models;
    const sequelize = req.sequelize;

    const sale = await Sale.findByPk(id);
    if (!sale) {
      return ApiResponse.error(res, 'Sale not found', 404);
    }

    const result = await sequelize.transaction(async (t) => {
      await sale.update({ status: SALE_STATUS.RETURNED }, { transaction: t });

      let returnTotal = 0;
      const itemsToReturn = items || await SaleItem.findAll({ where: { saleId: id }, transaction: t });

      for (const item of itemsToReturn) {
        const qty = item.quantity || item.qty;
        const price = item.price || item.unitPrice;

        const product = await Product.findByPk(item.productId || item.product_id, { transaction: t });
        if (product) {
          await product.update({
            stockQuantity: parseFloat(product.stockQuantity) + parseFloat(qty)
          }, { transaction: t });
        }

        const lineTotal = parseFloat(qty) * parseFloat(price);
        returnTotal += lineTotal;

        await StockHistory.create({
          productId: item.productId || item.product_id,
          type: STOCK_TYPE.RETURN,
          quantity: parseFloat(qty),
          referenceType: 'sale_return',
          referenceId: sale.id,
          notes: `Return for Sale #${sale.invoiceNumber}`,
          createdBy: req.user.id
        }, { transaction: t });
      }

      if (sale.customerId) {
        const customer = await Customer.findByPk(sale.customerId, { transaction: t });
        if (customer) {
          const newTotalSale = Math.max(0, parseFloat(customer.totalSale) - returnTotal);
          const newDueAmount = Math.max(0, parseFloat(customer.dueAmount) - returnTotal);

          await customer.update({
            totalSale: newTotalSale,
            dueAmount: newDueAmount
          }, { transaction: t });
        }

        const lastLedger = await CustomerLedger.findOne({
          where: { customerId: sale.customerId },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        const prevBalance = lastLedger ? parseFloat(lastLedger.balance) : 0;

        await CustomerLedger.create({
          customerId: sale.customerId,
          date: new Date().toISOString().split('T')[0],
          type: 'return',
          referenceId: sale.id,
          debit: 0,
          credit: returnTotal,
          balance: prevBalance - returnTotal,
          description: `Return for Sale #${sale.invoiceNumber}`
        }, { transaction: t });
      }

      const lastDayBook = await DayBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevBalance = lastDayBook ? parseFloat(lastDayBook.balance) : 0;

      await DayBook.create({
        date: new Date().toISOString().split('T')[0],
        description: `Return for Sale #${sale.invoiceNumber}`,
        debit: 0,
        credit: returnTotal,
        balance: prevBalance - returnTotal,
        referenceType: 'sale_return',
        referenceId: sale.id,
        userId: req.user.id
      }, { transaction: t });

      return sale;
    });

    ApiResponse.success(res, result, 'Sale returned successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
  holdInvoice,
  getHeldInvoices,
  getHeldInvoice,
  deleteHeldInvoice,
  getPriceHistory,
  returnSale
};
