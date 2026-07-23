module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    maxProducts: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    features: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'plans'
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  };

  return Plan;
};
