module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    openingBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalSale: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    creditLimit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Customer;
};
