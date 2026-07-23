export const formatCurrency = (amount) => {
  return `PKR ${Number(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'badge-success',
    inactive: 'badge-info',
    suspended: 'badge-danger',
    expired: 'badge-warning',
    paid: 'badge-success',
    unpaid: 'badge-danger',
    partial: 'badge-warning',
  };
  return colors[status?.toLowerCase()] || 'badge-info';
};
