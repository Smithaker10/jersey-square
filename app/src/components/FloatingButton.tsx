import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { submitStylistInquiry } from '@/lib/api';

export function FloatingButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await submitStylistInquiry({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
      });
      setOpen(false);
      setName('');
      setEmail('');
      setMessage('');
      alert('Thanks! Our stylist will get back to you soon.');
    } catch {
      alert('Could not send your message. Please try WhatsApp instead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#1B2A4A] px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:brightness-110 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3 sm:text-sm"
        onClick={() => setOpen(true)}
      >
        <Sparkles size={14} className="sm:h-4 sm:w-4" />
        <span>ASK STYLIST</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-[#1a1a1a]">
              Ask JerseySquare Stylist
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Tell us what jersey you are looking for.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
              />
              <textarea
                required
                placeholder="Your message *"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B2A4A]"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-[#1B2A4A] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
