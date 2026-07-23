module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vendorName: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    openingBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    purchaseTotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    creditLimit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Vendor;
};
