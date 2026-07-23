module.exports = (sequelize, DataTypes) => {
  const ProductPurchaseHistory = sequelize.define('ProductPurchaseHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    purchaseId: { type: DataTypes.INTEGER, allowNull: false },
    vendorName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    purchaseRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    purchaseNumber: { type: DataTypes.STRING },
    purchaseDate: { type: DataTypes.DATEONLY }
  }, {
    timestamps: true,
    underscored: true
  });
  return ProductPurchaseHistory;
};
