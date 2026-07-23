module.exports = (sequelize, DataTypes) => {
  const Purchase = sequelize.define('Purchase', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchaseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paymentType: { type: DataTypes.ENUM('cash', 'credit', 'partial'), defaultValue: 'cash' },
    paymentStatus: { type: DataTypes.ENUM('paid', 'unpaid', 'partial'), defaultValue: 'paid' },
    status: { type: DataTypes.ENUM('completed', 'returned', 'cancelled'), defaultValue: 'completed' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    underscored: true
  });
  return Purchase;
};
