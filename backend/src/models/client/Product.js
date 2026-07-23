module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    categoryId: { type: DataTypes.INTEGER },
    brandId: { type: DataTypes.INTEGER },
    unitId: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
    barcode: { type: DataTypes.STRING, unique: true },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    salePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    wholesalePrice: { type: DataTypes.DECIMAL(10, 2) },
    stockQuantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    minimumStock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Product;
};
