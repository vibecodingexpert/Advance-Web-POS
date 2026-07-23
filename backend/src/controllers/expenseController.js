const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');

const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { from, to, category } = req.query;

    const { Expense } = req.models;
    const where = {};

    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    } else if (from) {
      where.date = { [Op.gte]: from };
    } else if (to) {
      where.date = { [Op.lte]: to };
    }
    if (category) where.category = category;

    const { count, rows } = await Expense.findAndCountAll({
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

const getExpense = async (req, res, next) => {
  try {
    const { Expense } = req.models;
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return ApiResponse.error(res, 'Expense not found', 404);
    }

    ApiResponse.success(res, expense);
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { category, title, amount, description, date } = req.body;

    const { Expense, DayBook } = req.models;
    const sequelize = req.sequelize;

    const result = await sequelize.transaction(async (t) => {
      const expense = await Expense.create({
        category,
        title,
        amount,
        description,
        date: date || new Date().toISOString().split('T')[0],
        createdBy: req.user.id
      }, { transaction: t });

      const lastDayBook = await DayBook.findOne({
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      const prevBalance = lastDayBook ? parseFloat(lastDayBook.balance) : 0;

      await DayBook.create({
        date: date || new Date().toISOString().split('T')[0],
        description: `Expense: ${title}`,
        debit: 0,
        credit: parseFloat(amount),
        balance: prevBalance - parseFloat(amount),
        referenceType: 'expense',
        referenceId: expense.id,
        userId: req.user.id
      }, { transaction: t });

      return expense;
    });

    ApiResponse.created(res, result, 'Expense created successfully');
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { Expense } = req.models;
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return ApiResponse.error(res, 'Expense not found', 404);
    }

    await expense.update(req.body);
    ApiResponse.success(res, expense, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { Expense } = req.models;
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return ApiResponse.error(res, 'Expense not found', 404);
    }

    await expense.destroy();
    ApiResponse.success(res, null, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense
};
