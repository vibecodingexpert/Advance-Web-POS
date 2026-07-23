const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  EMPLOYEE: 'employee'
};

const PAYMENT_TYPES = {
  CASH: 'cash',
  CREDIT: 'credit',
  PARTIAL: 'partial',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer'
};

const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial'
};

const SALE_STATUS = {
  COMPLETED: 'completed',
  HOLD: 'hold',
  RETURNED: 'returned',
  CANCELLED: 'cancelled'
};

const CLIENT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  INACTIVE: 'inactive'
};

const STOCK_TYPE = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  INITIAL: 'initial'
};

const PERMISSIONS = {
  CREATE_SALE: 'create_sale',
  EDIT_SALE: 'edit_sale',
  DELETE_SALE: 'delete_sale',
  VIEW_SALES: 'view_sales',
  CREATE_PURCHASE: 'create_purchase',
  EDIT_PURCHASE: 'edit_purchase',
  DELETE_PURCHASE: 'delete_purchase',
  VIEW_PURCHASES: 'view_purchases',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_BRANDS: 'manage_brands',
  MANAGE_UNITS: 'manage_units',
  MANAGE_CUSTOMERS: 'manage_customers',
  MANAGE_VENDORS: 'manage_vendors',
  MANAGE_USERS: 'manage_users',
  CHANGE_PRICE: 'change_price',
  VIEW_REPORTS: 'view_reports',
  MANAGE_EXPENSES: 'manage_expenses',
  MANAGE_ASSETS: 'manage_assets',
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_SETTINGS: 'manage_settings'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_SALE, PERMISSIONS.EDIT_SALE, PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_PURCHASE, PERMISSIONS.VIEW_PURCHASES,
    PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_VENDORS, PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_EXPENSES, PERMISSIONS.VIEW_INVENTORY
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.CREATE_SALE, PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_SALES, PERMISSIONS.VIEW_INVENTORY
  ]
};

module.exports = {
  ROLES,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  SALE_STATUS,
  CLIENT_STATUS,
  STOCK_TYPE,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
