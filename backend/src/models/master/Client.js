module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    city: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING
    },
    logo: {
      type: DataTypes.STRING
    },
    databaseName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    subscriptionPlan: {
      type: DataTypes.STRING
    },
    expiryDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'expired', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'clients'
  });

  Client.associate = (models) => {
    Client.hasMany(models.Subscription, { foreignKey: 'clientId', as: 'subscriptions' });
  };

  return Client;
};
