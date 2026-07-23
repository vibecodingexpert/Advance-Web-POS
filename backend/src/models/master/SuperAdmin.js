module.exports = (sequelize, DataTypes) => {
  const SuperAdmin = sequelize.define('SuperAdmin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    image: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    lastLogin: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'super_admins'
  });

  return SuperAdmin;
};
