import React, { useState } from 'react';
import api from '../lib/api';
import FormField from './ui/FormField';

export default function SupportBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/support/', { subject, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {/* Form Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96">
          <div className="relative">
            <div className="absolute -inset-2 bg-sage rounded-[40px] border-4 border-charcoal rotate-1 -z-10 shadow-[8px_8px_0px_0px_#3A322B]"></div>
            <div className="bg-white border-4 border-charcoal rounded-[32px] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-black">Help Desk</h3>
                <button aria-label="Close help desk" onClick={() => setIsOpen(false)} className="text-2xl hover:text-cedar transition-colors">
                  <iconify-icon icon="ph:x-bold"></iconify-icon>
                </button>
              </div>

              {success ? (
                <div className="py-8 text-center animate-bounce">
                  <iconify-icon icon="ph:paper-plane-tilt-bold" class="text-6xl text-sage mb-4"></iconify-icon>
                  <p className="font-black text-charcoal">Message Flown Away!</p>
                  <p className="text-xs font-bold text-charcoal/40 mt-2">We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    label="Subject"
                    id="support-subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="!px-4 !py-3 !rounded-xl !border-2 !text-sm"
                    placeholder="e.g. Order Help"
                  />
                  <FormField
                    label="Message"
                    id="support-message"
                    type="textarea"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="!px-4 !py-3 !rounded-xl !border-2 !text-sm h-32"
                    placeholder="How can we help?"
                  />
                  <button
                    disabled={submitting}
                    className="w-full btn-pop bg-cedar text-white border-4 border-charcoal py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bubble Button */}
      <button
        aria-label={isOpen ? 'Close help desk' : 'Contact support'}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full border-4 border-charcoal shadow-[6px_6px_0px_0px_#3A322B] flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-charcoal text-white' : 'bg-maple text-charcoal'}`}
      >
        <iconify-icon icon={isOpen ? "ph:x-bold" : "ph:chat-circle-dots-bold"} class="text-3xl"></iconify-icon>
      </button>
    </div>
  );
}
