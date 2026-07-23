module.exports = (sequelize, DataTypes) => {
  const CustomerLedger = sequelize.define('CustomerLedger', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.ENUM('sale', 'payment', 'return', 'adjustment'), allowNull: false },
    referenceId: { type: DataTypes.INTEGER },
    debit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    underscored: true
  });
  return CustomerLedger;
};
