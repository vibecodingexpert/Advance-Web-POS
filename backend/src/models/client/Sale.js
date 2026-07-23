module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerId: { type: DataTypes.INTEGER },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paymentType: { type: DataTypes.ENUM('cash', 'credit', 'partial', 'card', 'bank_transfer'), defaultValue: 'cash' },
    paymentStatus: { type: DataTypes.ENUM('paid', 'unpaid', 'partial'), defaultValue: 'paid' },
    status: { type: DataTypes.ENUM('completed', 'hold', 'returned', 'cancelled'), defaultValue: 'completed' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    underscored: true
  });
  return Sale;
};
