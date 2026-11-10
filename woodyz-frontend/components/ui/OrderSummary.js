import { formatCurrency } from '../../lib/currency';

/**
 * Displays Subtotal / Shipping / Total summary block.
 * Used in both cart.js and checkout.js — extracted to avoid duplication.
 */
export default function OrderSummary({ total, shipping = 0, discount = 0, className = '' }) {
  const subtotal = total;
  const grandTotal = subtotal + shipping - discount;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between font-bold">
        <span className="text-charcoal/60">Subtotal</span>
        <span className="text-charcoal">{formatCurrency(subtotal)}</span>
      </div>

      {shipping > 0 && (
        <div className="flex justify-between font-bold">
          <span className="text-charcoal/60">Shipping</span>
          <span className="text-charcoal">{formatCurrency(shipping)}</span>
        </div>
      )}

      {discount > 0 && (
        <div className="flex justify-between font-bold text-sage">
          <span className="text-charcoal/60">Discount</span>
          <span className="text-sage">-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="pt-4 border-t-2 border-charcoal/5 flex justify-between items-end">
        <span className="font-display text-xl font-black">Total</span>
        <span className="font-display text-3xl font-black text-cedar">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
}
