module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define('SaleItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saleId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  }, {
    timestamps: true,
    underscored: true
  });
  return SaleItem;
};
