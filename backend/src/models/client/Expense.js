module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define('Expense', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category: { type: DataTypes.ENUM('utilities', 'rent', 'salary', 'transport', 'maintenance', 'other'), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    timestamps: true,
    underscored: true
  });
  return Expense;
};
