const generateInvoiceNumber = (prefix = 'INV') => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
};

const generateReceiptNumber = (prefix = 'RCT') => {
  const now = new Date();
  const dateStr = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const timeStr = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  return `${prefix}-${dateStr}${timeStr}`;
};

const sanitizeDbName = (businessName) => {
  return 'client_' + businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') +
    '_' + Date.now().toString(36);
};

const calculateDue = (total, paidAmount) => {
  return Math.max(0, total - paidAmount);
};

const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

module.exports = {
  generateInvoiceNumber,
  generateReceiptNumber,
  sanitizeDbName,
  calculateDue,
  getFinancialYear
};
