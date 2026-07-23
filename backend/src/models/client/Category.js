module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Category;
};
