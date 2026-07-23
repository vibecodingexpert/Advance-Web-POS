module.exports = (sequelize, DataTypes) => {
  const StockHistory = sequelize.define('StockHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'initial'), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    referenceType: { type: DataTypes.STRING },
    referenceId: { type: DataTypes.INTEGER },
    notes: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.INTEGER }
  }, {
    timestamps: true,
    underscored: true
  });
  return StockHistory;
};
