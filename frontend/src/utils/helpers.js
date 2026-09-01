export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateOrderTotal = (products = []) => {
  return products.reduce((total, product) => {
    return total + (product.quantity * product.rate);
  }, 0);
};

export const getStatusColor = (status) => {
  const colors = {
    'Order Received': 'bg-blue-100 text-blue-800',
    'Designing': 'bg-purple-100 text-purple-800',
    'Proof Approval': 'bg-yellow-100 text-yellow-800',
    'Printing': 'bg-indigo-100 text-indigo-800',
    'Finishing': 'bg-pink-100 text-pink-800',
    'Packing': 'bg-cyan-100 text-cyan-800',
    'Ready': 'bg-green-100 text-green-800',
    'Delivered': 'bg-emerald-100 text-emerald-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/** Legacy blank / missing approved counts as approved so old expenses stay on the books. */
export const isExpenseApproved = (expense) => {
  if (!expense) return false;
  if (expense.approved === false) return false;
  const s = String(expense.approved ?? expense.status ?? '').trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'pending' || s === 'rejected') return false;
  return true;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};