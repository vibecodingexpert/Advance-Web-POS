require('dotenv').config();
const app = require('./src/config/app');
const { masterDb } = require('./src/config/database');
const { initMasterModels } = require('./src/models/master');
const { createDefaultSuperAdmin } = require('./src/services/seedService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await masterDb.authenticate();
    console.log('Master database connected successfully');

    await initMasterModels();
    console.log('Master models initialized');

    await createDefaultSuperAdmin();
    console.log('Default super admin verified');

    app.listen(PORT, () => {
      console.log(`POS Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
