module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'unpaid', 'partial'),
      defaultValue: 'unpaid'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'subscriptions'
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    Subscription.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' });
  };

  return Subscription;
};
