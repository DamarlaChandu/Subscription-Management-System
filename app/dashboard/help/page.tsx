'use client';

import React, { useState } from 'react';
import { MessageCircle, Book, Phone, Mail, ChevronDown, ChevronUp, Send, Loader2, CheckCircle } from 'lucide-react';
import { PageHeader, Card } from '@/components/SharedUI';

const faqs = [
  {
    q: 'How do I upgrade my subscription plan?',
    a: 'Navigate to "Browse Plans" from the sidebar, select your preferred plan, and click "Get Started". Our team will process your upgrade within 24 hours.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Contact our support team via the form below or email us at support@subsaas.com. We\'ll process your cancellation request and handle any prorated refunds.',
  },
  {
    q: 'When will I be billed?',
    a: 'Billing occurs at the start of each billing cycle. You can find your billing dates in the "My Invoices" section. We send payment reminders 3 days before the due date.',
  },
  {
    q: 'How do I update my payment method?',
    a: 'Go to your Profile page and update your payment information. You can also contact support for assistance with payment method changes.',
  },
  {
    q: 'What happens if my payment fails?',
    a: 'We\'ll retry the payment 3 times over 7 days. If payment still fails, your subscription will be paused. You can reactivate it by updating your payment method.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer refunds within 14 days of purchase for new subscriptions. For existing subscriptions, prorated credits may be applied to your account. Contact support for details.',
  },
];

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending (in production, this would send an email/ticket)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
    setFormData({ subject: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Help & Support" description="Get answers and contact our team" />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Book, label: 'Documentation', desc: 'Guides & tutorials', color: 'from-primary-500 to-primary-600' },
          { icon: MessageCircle, label: 'Live Chat', desc: 'Mon-Fri 9am-6pm', color: 'from-emerald-500 to-emerald-600' },
          { icon: Phone, label: 'Call Us', desc: '+1 (555) 123-4567', color: 'from-amber-500 to-amber-600' },
        ].map(item => (
          <Card key={item.label} hover>
            <div className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ₹{item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ */}
        <Card>
          <div className="p-6">
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              💡 Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border rounded-lg overflow-hidden transition-all" style={{ borderColor: 'var(--border-primary)' }}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span>{faq.q}</span>
                    {expandedFaq === i ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-3 text-sm leading-relaxed animate-fade-in" style={{ color: 'var(--text-secondary)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Contact Form */}
        <Card>
          <div className="p-6">
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              ✉️ Contact Support
            </h3>

            {sent && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Message sent! We&apos;ll get back to you within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                <input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  placeholder="What do you need help with?" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required rows={5}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  placeholder="Describe your issue in detail..." />
              </div>
              <button type="submit" disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium disabled:opacity-50 shadow-lg shadow-primary-500/25">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Message
              </button>
            </form>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <Mail className="w-4 h-4" />
                <span>Or email us directly: <strong style={{ color: 'var(--text-secondary)' }}>support@subsaas.com</strong></span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
