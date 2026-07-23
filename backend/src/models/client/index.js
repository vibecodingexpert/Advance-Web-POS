const Sequelize = require('sequelize');

const initClientModels = (sequelize) => {
  const User = require('./User')(sequelize, Sequelize.DataTypes);
  const Role = require('./Role')(sequelize, Sequelize.DataTypes);
  const Permission = require('./Permission')(sequelize, Sequelize.DataTypes);
  const Product = require('./Product')(sequelize, Sequelize.DataTypes);
  const Category = require('./Category')(sequelize, Sequelize.DataTypes);
  const Brand = require('./Brand')(sequelize, Sequelize.DataTypes);
  const Unit = require('./Unit')(sequelize, Sequelize.DataTypes);
  const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
  const Vendor = require('./Vendor')(sequelize, Sequelize.DataTypes);
  const Sale = require('./Sale')(sequelize, Sequelize.DataTypes);
  const SaleItem = require('./SaleItem')(sequelize, Sequelize.DataTypes);
  const Purchase = require('./Purchase')(sequelize, Sequelize.DataTypes);
  const PurchaseItem = require('./PurchaseItem')(sequelize, Sequelize.DataTypes);
  const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
  const Expense = require('./Expense')(sequelize, Sequelize.DataTypes);
  const Asset = require('./Asset')(sequelize, Sequelize.DataTypes);
  const StockHistory = require('./StockHistory')(sequelize, Sequelize.DataTypes);
  const CustomerLedger = require('./CustomerLedger')(sequelize, Sequelize.DataTypes);
  const VendorLedger = require('./VendorLedger')(sequelize, Sequelize.DataTypes);
  const DayBook = require('./DayBook')(sequelize, Sequelize.DataTypes);
  const CashBook = require('./CashBook')(sequelize, Sequelize.DataTypes);
  const ProductSaleHistory = require('./ProductSaleHistory')(sequelize, Sequelize.DataTypes);
  const ProductPurchaseHistory = require('./ProductPurchaseHistory')(sequelize, Sequelize.DataTypes);
  const HeldInvoice = require('./HeldInvoice')(sequelize, Sequelize.DataTypes);
  const Setting = require('./Setting')(sequelize, Sequelize.DataTypes);

  User.belongsTo(Role, { foreignKey: 'roleId' });
  Role.hasMany(User, { foreignKey: 'roleId' });

  Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'roleId' });
  Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permissionId' });

  Product.belongsTo(Category, { foreignKey: 'categoryId' });
  Category.hasMany(Product, { foreignKey: 'categoryId' });

  Product.belongsTo(Brand, { foreignKey: 'brandId' });
  Brand.hasMany(Product, { foreignKey: 'brandId' });

  Product.belongsTo(Unit, { foreignKey: 'unitId' });
  Unit.hasMany(Product, { foreignKey: 'unitId' });

  Sale.belongsTo(Customer, { foreignKey: 'customerId' });
  Customer.hasMany(Sale, { foreignKey: 'customerId' });

  Sale.belongsTo(User, { as: 'createdBy', foreignKey: 'userId' });
  User.hasMany(Sale, { foreignKey: 'userId' });

  Sale.hasMany(SaleItem, { foreignKey: 'saleId' });
  SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });

  SaleItem.belongsTo(Product, { foreignKey: 'productId' });
  Product.hasMany(SaleItem, { foreignKey: 'productId' });

  Purchase.belongsTo(Vendor, { foreignKey: 'vendorId' });
  Vendor.hasMany(Purchase, { foreignKey: 'vendorId' });

  Purchase.belongsTo(User, { as: 'createdBy', foreignKey: 'userId' });
  User.hasMany(Purchase, { foreignKey: 'userId' });

  Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId' });
  PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });

  PurchaseItem.belongsTo(Product, { foreignKey: 'productId' });

  CustomerLedger.belongsTo(Customer, { foreignKey: 'customerId' });
  VendorLedger.belongsTo(Vendor, { foreignKey: 'vendorId' });

  DayBook.belongsTo(User, { foreignKey: 'userId' });
  CashBook.belongsTo(User, { foreignKey: 'userId' });

  return {
    User, Role, Permission, Product, Category, Brand, Unit,
    Customer, Vendor, Sale, SaleItem, Purchase, PurchaseItem,
    Payment, Expense, Asset, StockHistory, CustomerLedger,
    VendorLedger, DayBook, CashBook, ProductSaleHistory,
    ProductPurchaseHistory, HeldInvoice, Setting
  };
};

module.exports = { initClientModels };
