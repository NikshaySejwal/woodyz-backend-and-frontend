const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+() .-]{7,30}$/;
const MAX_QUANTITY = 1_000_000;

export const emptyManufacturingQuote = () => ({
  name: '',
  email: '',
  phone: '',
  company: '',
  productType: '',
  quantity: '',
  requiredDeliveryDate: '',
  materialPreference: '',
  processPreference: '',
  message: '',
});

export function validateManufacturingQuote(values, today = new Date().toISOString().slice(0, 10)) {
  const clean = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );
  const errors = {};

  if (!clean.name) errors.name = 'Enter your name.';
  else if (clean.name.length > 120) errors.name = 'Name must be 120 characters or fewer.';

  if (!clean.email) errors.email = 'Enter your email address.';
  else if (clean.email.length > 254 || !EMAIL_PATTERN.test(clean.email)) errors.email = 'Enter a valid email address.';

  if (!clean.phone) errors.phone = 'Enter your phone number.';
  else if (!PHONE_PATTERN.test(clean.phone)) errors.phone = 'Use 7–30 digits or common phone symbols.';

  if (!clean.productType) errors.productType = 'Choose a product type.';
  else if (clean.productType.length > 120) errors.productType = 'Product type must be 120 characters or fewer.';

  const quantity = clean.quantity === '' ? NaN : Number(clean.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    errors.quantity = 'Enter a whole number from 1 to 1,000,000.';
  }

  if (!clean.message) errors.message = 'Tell us what you need.';
  else if (clean.message.length < 10 || clean.message.length > 5000) {
    errors.message = 'Message must be between 10 and 5,000 characters.';
  }

  if ((clean.company || '').length > 160) errors.company = 'Company must be 160 characters or fewer.';
  if ((clean.materialPreference || '').length > 120) errors.materialPreference = 'Use 120 characters or fewer.';
  if ((clean.processPreference || '').length > 120) errors.processPreference = 'Use 120 characters or fewer.';
  if (clean.requiredDeliveryDate && clean.requiredDeliveryDate < today) {
    errors.requiredDeliveryDate = 'Choose today or a future date.';
  }

  return { clean, errors };
}

export function toManufacturingQuotePayload(values) {
  const { clean } = validateManufacturingQuote(values);
  return {
    name: clean.name,
    email: clean.email,
    phone: clean.phone,
    company: clean.company || null,
    productType: clean.productType,
    quantity: Number(clean.quantity),
    requiredDeliveryDate: clean.requiredDeliveryDate || null,
    materialPreference: clean.materialPreference || null,
    processPreference: clean.processPreference || null,
    message: clean.message,
  };
}
