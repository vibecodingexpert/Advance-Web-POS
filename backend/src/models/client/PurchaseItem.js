module.exports = (sequelize, DataTypes) => {
  const PurchaseItem = sequelize.define('PurchaseItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchaseId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  }, {
    timestamps: true,
    underscored: true
  });
  return PurchaseItem;
};
