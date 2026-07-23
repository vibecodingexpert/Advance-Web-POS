module.exports = (sequelize, DataTypes) => {
  const Asset = sequelize.define('Asset', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    assetName: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING },
    image: { type: DataTypes.STRING },
    purchaseDate: { type: DataTypes.DATEONLY },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2) },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    location: { type: DataTypes.STRING },
    condition: { type: DataTypes.ENUM('new', 'good', 'fair', 'poor'), defaultValue: 'new' },
    warrantyExpiry: { type: DataTypes.DATEONLY },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Asset;
};
