module.exports = (sequelize, DataTypes) => {
  const VendorLedger = sequelize.define('VendorLedger', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: { type: DataTypes.ENUM('purchase', 'payment', 'return', 'adjustment'), allowNull: false },
    referenceId: { type: DataTypes.INTEGER },
    debit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    underscored: true
  });
  return VendorLedger;
};
