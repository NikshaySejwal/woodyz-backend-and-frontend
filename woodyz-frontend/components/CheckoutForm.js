import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { formatCurrency } from '../lib/currency';

export default function CheckoutForm({ totalAmount, onPaymentSuccess, disabled = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const handlingReturn = useRef(false);

  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  }, [onPaymentSuccess]);

  useEffect(() => {
    const clientSecret = router.query.payment_intent_client_secret;
    if (!stripe || disabled || !router.isReady || typeof clientSecret !== 'string' || handlingReturn.current) {
      return;
    }

    handlingReturn.current = true;
    stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent, error }) => {
      if (error) {
        setMessage(error.message);
        handlingReturn.current = false;
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        setMessage('Payment was not completed. Please review your payment details and try again.');
        handlingReturn.current = false;
        return;
      }

      const completedKey = `woodyz-order-recorded:${paymentIntent.id}`;
      if (window.sessionStorage.getItem(completedKey)) return;
      const recorded = await onPaymentSuccessRef.current(paymentIntent.id);
      if (recorded === false) handlingReturn.current = false;
      else window.sessionStorage.setItem(completedKey, 'true');
    }).catch((error) => {
      console.error('Unable to verify returned payment', error);
      setMessage('Unable to verify payment status. Please contact support before retrying.');
      handlingReturn.current = false;
    });
  }, [stripe, disabled, router.isReady, router.query.payment_intent_client_secret]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || disabled) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout',
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      if (paymentIntent?.id) {
        await onPaymentSuccess(paymentIntent.id);
      } else {
        setMessage('Payment confirmation could not be verified. Please contact support before retrying.');
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="mb-6" />
      
      {message && (
        <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold text-sm">
          {message}
        </div>
      )}

      <button
        disabled={isLoading || !stripe || !elements || disabled}
        className={`w-full btn-pop bg-cedar text-white border-4 border-charcoal px-8 py-5 rounded-[24px] font-black text-xl uppercase tracking-widest ${isLoading ? 'opacity-50' : ''}`}
      >
        {isLoading ? 'Processing...' : disabled ? 'Complete Shipping Details' : `Pay ${formatCurrency(totalAmount)}`}
      </button>
    </form>
  );
}
