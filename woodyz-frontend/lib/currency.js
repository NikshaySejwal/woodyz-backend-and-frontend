const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export const formatCurrency = (amount) => inrFormatter.format(amount);
