const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { generateReceiptNumber } = require('../utils/helpers');

const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, type } = req.query;

    const { Payment } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }
    if (type) where.type = type;

    const { count, rows } = await Payment.findAndCountAll({
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

const getPayment = async (req, res, next) => {
  try {
    const { Payment } = req.models;
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 404);
    }

    ApiResponse.success(res, payment);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { type, referenceId, amount, paymentMethod, date, notes } = req.body;

    const {
      Payment, Sale, Purchase, Customer, Vendor,
      CustomerLedger, VendorLedger, DayBook, CashBook
    } = req.models;
    const sequelize = req.sequelize;

    const result = await sequelize.transaction(async (t) => {
      const paymentNumber = generateReceiptNumber('PAY');

      const payment = await Payment.create({
        paymentNumber,
        type,
        referenceId,
        amount,
        paymentMethod: paymentMethod || 'cash',
        date: date || new Date().toISOString().split('T')[0],
        notes,
        createdBy: req.user.id
      }, { transaction: t });

      if (type === 'sale') {
        const sale = await Sale.findByPk(referenceId, { transaction: t });
        if (sale) {
          const newPaidAmount = parseFloat(sale.paidAmount) + parseFloat(amount);
          const newDueAmount = Math.max(0, parseFloat(sale.total) - newPaidAmount);
          const pStatus = newDueAmount === 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

          await sale.update({
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: pStatus
          }, { transaction: t });

          if (sale.customerId) {
            const customer = await Customer.findByPk(sale.customerId, { transaction: t });
            if (customer) {
              const newPaid = parseFloat(customer.paidAmount) + parseFloat(amount);
              const newDue = Math.max(0, parseFloat(customer.dueAmount) - parseFloat(amount));

              await customer.update({
                paidAmount: newPaid,
                dueAmount: newDue
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
              date: date || new Date().toISOString().split('T')[0],
              type: 'payment',
              referenceId: payment.id,
              debit: 0,
              credit: parseFloat(amount),
              balance: prevBalance - parseFloat(amount),
              description: `Payment received for Sale #${sale.invoiceNumber}`
            }, { transaction: t });
          }
        }
      } else if (type === 'purchase') {
        const purchase = await Purchase.findByPk(referenceId, { transaction: t });
        if (purchase) {
          const newPaidAmount = parseFloat(purchase.paidAmount) + parseFloat(amount);
          const newDueAmount = Math.max(0, parseFloat(purchase.total) - newPaidAmount);
          const pStatus = newDueAmount === 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

          await purchase.update({
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: pStatus
          }, { transaction: t });

          const vendor = await Vendor.findByPk(purchase.vendorId, { transaction: t });
          if (vendor) {
            const newPaid = parseFloat(vendor.paidAmount) + parseFloat(amount);
            const newDue = Math.max(0, parseFloat(vendor.dueAmount) - parseFloat(amount));

            await vendor.update({
              paidAmount: newPaid,
              dueAmount: newDue
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
            date: date || new Date().toISOString().split('T')[0],
            type: 'payment',
            referenceId: payment.id,
            debit: 0,
            credit: parseFloat(amount),
            balance: prevBalance - parseFloat(amount),
            description: `Payment made for Purchase #${purchase.purchaseNumber}`
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
        description: `Payment ${paymentNumber} for ${type} #${referenceId}`,
        debit: type === 'sale' ? parseFloat(amount) : 0,
        credit: type === 'purchase' ? parseFloat(amount) : 0,
        balance: type === 'sale' ? prevDayBalance + parseFloat(amount) : prevDayBalance - parseFloat(amount),
        referenceType: 'payment',
        referenceId: payment.id,
        userId: req.user.id
      }, { transaction: t });

      const lastCashBook = await CashBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevCashBalance = lastCashBook ? parseFloat(lastCashBook.balance) : 0;

      await CashBook.create({
        date: date || new Date().toISOString().split('T')[0],
        description: `Payment ${paymentNumber} for ${type} #${referenceId}`,
        type: type === 'sale' ? 'in' : 'out',
        amount: parseFloat(amount),
        balance: type === 'sale' ? prevCashBalance + parseFloat(amount) : prevCashBalance - parseFloat(amount),
        referenceType: 'payment',
        referenceId: payment.id,
        userId: req.user.id
      }, { transaction: t });

      return payment;
    });

    ApiResponse.created(res, result, 'Payment created successfully');
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const { Payment } = req.models;
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 404);
    }

    await payment.destroy();
    ApiResponse.success(res, null, 'Payment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  deletePayment
};
