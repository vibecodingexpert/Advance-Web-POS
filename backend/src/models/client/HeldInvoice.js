module.exports = (sequelize, DataTypes) => {
  const HeldInvoice = sequelize.define('HeldInvoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerName: { type: DataTypes.STRING },
    customerPhone: { type: DataTypes.STRING },
    items: { type: DataTypes.TEXT },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    notes: { type: DataTypes.TEXT },
    userId: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    timestamps: true,
    underscored: true
  });
  return HeldInvoice;
};
