module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paymentNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('sale', 'purchase', 'expense'), allowNull: false },
    referenceId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: { type: DataTypes.ENUM('cash', 'card', 'bank_transfer'), defaultValue: 'cash' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    timestamps: true,
    underscored: true
  });
  return Payment;
};
