const bcrypt = require('bcryptjs');
const { masterDb, getClientDb } = require('../config/database');
const { getMasterModels } = require('../models/master');
const { initClientModels } = require('../models/client');
const { ROLES, ROLE_PERMISSIONS, PERMISSIONS } = require('../utils/constants');

const createDefaultSuperAdmin = async () => {
  const { SuperAdmin } = getMasterModels();

  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@pos.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345';

  const existing = await SuperAdmin.findOne({ where: { email } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 12);
    await SuperAdmin.create({
      name: 'Super Admin',
      email,
      password: hashedPassword,
      phone: '0000000000',
      status: 'active'
    });
    console.log('Default super admin created');
  }
};

const createDefaultRoles = async (sequelize) => {
  const { Role, Permission } = await initClientModels(sequelize);

  const permissions = Object.entries(PERMISSIONS).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    slug: value,
    description: `Can ${key.replace(/_/g, ' ')}`,
    module: key.split('_')[0].charAt(0).toUpperCase() + key.split('_')[0].slice(1)
  }));

  await Permission.bulkCreate(permissions, { ignoreDuplicates: true });

  const allPermissions = await Permission.findAll();
  const permissionMap = {};
  allPermissions.forEach(p => { permissionMap[p.slug] = p.id; });

  const roles = [
    { name: 'Admin', slug: ROLES.ADMIN, description: 'Full access to all features' },
    { name: 'Manager', slug: ROLES.MANAGER, description: 'Can manage operations but limited settings' },
    { name: 'Cashier', slug: ROLES.CASHIER, description: 'Can create sales and manage customers' },
    { name: 'Employee', slug: ROLES.EMPLOYEE, description: 'View only access' }
  ];

  for (const roleData of roles) {
    const [role] = await Role.findOrCreate({
      where: { slug: roleData.slug },
      defaults: roleData
    });

    if (ROLE_PERMISSIONS[roleData.slug]) {
      const permIds = ROLE_PERMISSIONS[roleData.slug]
        .map(slug => permissionMap[slug])
        .filter(id => id);
      await role.setPermissions(permIds);
    }
  }

  console.log('Default roles and permissions created');
};

module.exports = { createDefaultSuperAdmin, createDefaultRoles };
