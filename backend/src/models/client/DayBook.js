module.exports = (sequelize, DataTypes) => {
  const DayBook = sequelize.define('DayBook', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    debit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    referenceType: { type: DataTypes.STRING },
    referenceId: { type: DataTypes.INTEGER },
    userId: { type: DataTypes.INTEGER }
  }, {
    timestamps: true,
    underscored: true
  });
  return DayBook;
};
