module.exports = (sequelize, DataTypes) => {
  const ProductSaleHistory = sequelize.define('ProductSaleHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    saleId: { type: DataTypes.INTEGER, allowNull: false },
    customerName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    invoiceNumber: { type: DataTypes.STRING },
    saleDate: { type: DataTypes.DATEONLY }
  }, {
    timestamps: true,
    underscored: true
  });
  return ProductSaleHistory;
};
