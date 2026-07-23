module.exports = (sequelize, DataTypes) => {
  const CashBook = sequelize.define('CashBook', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.ENUM('in', 'out'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    referenceType: { type: DataTypes.STRING },
    referenceId: { type: DataTypes.INTEGER },
    userId: { type: DataTypes.INTEGER }
  }, {
    timestamps: true,
    underscored: true
  });
  return CashBook;
};
