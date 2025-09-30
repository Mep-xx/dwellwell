// dwellwell-client/src/pages/Billing.tsx
import { Helmet } from 'react-helmet-async';
import React, { useMemo, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { generateInvoiceHtml } from '../utils/invoice';
import { Button } from '@/components/ui/button';

type InvoiceRow = {
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
  id: string;
};

export default function Billing() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const invoices: InvoiceRow[] = useMemo(
    () => [
      { date: 'Apr 5, 2025', amount: '$3.99', status: 'Paid', id: 'INV-20250405-001' },
      { date: 'Mar 5, 2025', amount: '$3.99', status: 'Paid', id: 'INV-20250305-001' },
      { date: 'Feb 5, 2025', amount: '$3.99', status: 'Failed', id: 'INV-20250205-001' },
    ],
    []
  );

  const downloadInvoice = async (row?: InvoiceRow) => {
    if (row && row.status !== 'Paid') return;
    setDownloading(row?.id ?? 'custom');
    try {
      const html = await generateInvoiceHtml({
        invoiceDate: row?.date ?? 'April 9, 2025',
        invoiceId: row?.id ?? 'INV-20250409-001',
        customerEmail: 'jess@example.com',
        paymentMethod: '**** **** **** 4242',
        description: 'DwellWell Premium Subscription (Monthly)',
        quantity: '1',
        amount: row?.amount ?? '$3.99',
        total: row?.amount ?? '$3.99',
      });

      const element = document.createElement('div');
      element.innerHTML = html;

      await html2pdf()
        .set({
          filename: `${row?.id ?? 'invoice-dwellwell'}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <Helmet>
        <title>Billing – DwellWell</title>
      </Helmet>

      <h1 className="text-3xl font-bold text-brand-primary">Billing</h1>

      {/* Current Plan */}
      <section className="bg-card border rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Your Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-primary font-bold">Free Plan</p>
            <p className="text-sm text-muted-foreground">Tracking 3 of 5 allowed items</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">Active</span>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-card border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Compare Plans</h2>
        <div className="grid grid-cols-3 gap-4 text-left text-sm">
          <div className="font-medium">Feature</div>
          <div className="font-medium text-center">Free</div>
          <div className="font-medium text-center">Premium</div>

          {[
            ['Tracked items', '5', 'Unlimited'],
            ['AI guidance', '❌', '✅'],
            ['Smart alerts', '❌', '✅'],
            ['Manual reminders', '✅', '✅'],
            ['Support', 'Community only', 'Priority email'],
          ].map(([feature, free, pro], i) => (
            <React.Fragment key={i}>
              <div>{feature}</div>
              <div className="text-center">{free}</div>
              <div className="text-center">{pro}</div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Upgrade Button */}
      <section className="text-center">
        <p className="text-muted-foreground mb-4">Need more? Unlock all features with Premium.</p>
        <Button
          size="lg"
          onClick={() => alert('Redirect to Stripe Checkout (not implemented)')}
          className="px-6"
        >
          Upgrade to Premium
        </Button>
      </section>

      {/* Billing History */}
      <section className="bg-card border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Billing History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-t border-gray-100">
            <thead>
              <tr className="text-muted-foreground font-medium">
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="py-2">{invoice.date}</td>
                  <td className="py-2">{invoice.amount}</td>
                  <td className="py-2">
                    <span
                      className={[
                        'px-2 py-1 rounded text-xs font-semibold',
                        invoice.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : invoice.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700',
                      ].join(' ')}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      className="text-brand-primary underline px-0"
                      onClick={() => downloadInvoice(invoice)}
                      disabled={invoice.status !== 'Paid' || downloading === invoice.id}
                    >
                      {downloading === invoice.id ? 'Preparing…' : 'Download'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom invoice demo button (optional) */}
        <div className="mt-4">
          <Button variant="secondary" onClick={() => downloadInvoice()} disabled={!!downloading}>
            {downloading ? 'Preparing…' : 'Download Sample Invoice'}
          </Button>
        </div>
      </section>
    </div>
  );
}
