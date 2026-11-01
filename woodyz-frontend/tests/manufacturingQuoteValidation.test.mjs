import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyManufacturingQuote, toManufacturingQuotePayload, validateManufacturingQuote } from '../lib/manufacturingQuoteValidation.mjs';

const validQuote = () => ({
  ...emptyManufacturingQuote(),
  name: '  Asha Patel  ',
  email: '  asha@example.com  ',
  phone: '  +91 98765 43210  ',
  productType: '  Awards  ',
  quantity: '24',
  message: '  Please quote branded school awards.  ',
});

test('accepts valid data, trims text, and converts quantity to a number', () => {
  const { clean, errors } = validateManufacturingQuote(validQuote(), '2026-10-21');
  assert.deepEqual(errors, {});
  assert.equal(clean.name, 'Asha Patel');
  assert.equal(clean.email, 'asha@example.com');
  const payload = toManufacturingQuotePayload(validQuote());
  assert.equal(payload.quantity, 24);
  assert.equal(payload.company, null);
});

test('requires the six required fields', () => {
  const { errors } = validateManufacturingQuote(emptyManufacturingQuote(), '2026-10-21');
  for (const field of ['name', 'email', 'phone', 'productType', 'quantity', 'message']) {
    assert.ok(errors[field], `${field} should be required`);
  }
});

test('rejects invalid email and phone values', () => {
  const quote = { ...validQuote(), email: 'not-an-email', phone: 'call me maybe' };
  const { errors } = validateManufacturingQuote(quote, '2026-10-21');
  assert.ok(errors.email);
  assert.ok(errors.phone);
});

test('rejects fractional, non-positive, and over-limit quantities', () => {
  for (const quantity of ['0', '-2', '1.5', '1000001']) {
    assert.ok(validateManufacturingQuote({ ...validQuote(), quantity }, '2026-10-21').errors.quantity);
  }
});

test('rejects messages outside backend length limits and past delivery dates', () => {
  assert.ok(validateManufacturingQuote({ ...validQuote(), message: 'short' }, '2026-10-21').errors.message);
  assert.ok(validateManufacturingQuote({ ...validQuote(), message: 'x'.repeat(5001) }, '2026-10-21').errors.message);
  assert.ok(validateManufacturingQuote({ ...validQuote(), requiredDeliveryDate: '2026-10-20' }, '2026-10-21').errors.requiredDeliveryDate);
});
