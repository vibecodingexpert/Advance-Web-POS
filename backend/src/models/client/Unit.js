module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    shortName: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    timestamps: true,
    underscored: true
  });
  return Unit;
};
