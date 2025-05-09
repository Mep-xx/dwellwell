import { Helmet } from 'react-helmet-async';
import React from 'react';
import html2pdf from 'html2pdf.js';
import { generateInvoiceHtml } from '../utils/invoice';

export default function Billing() {
  const downloadInvoice = async () => {
    const html = await generateInvoiceHtml({
      invoiceDate: 'April 9, 2025',
      invoiceId: 'INV-20250409-001',
      customerEmail: 'jess@example.com',
      paymentMethod: '**** **** **** 4242',
      description: 'DwellWell Premium Subscription (Monthly)',
      quantity: '1',
      amount: '$3.99',
      total: '$3.99',
    });

    const element = document.createElement('div');
    element.innerHTML = html;

    html2pdf()
      .set({
        filename: 'invoice-dwellwell.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <Helmet>
        <title>Billing – DwellWell</title>
      </Helmet>

      <h1 className="text-3xl font-bold text-brand-primary">Billing</h1>

      {/* Current Plan */}
      <section className="bg-white border shadow rounded-xl p-6 space-y-2">
        <h2 className="text-xl font-semibold">Your Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-primary font-bold">Free Plan</p>
            <p className="text-sm text-gray-600">Tracking 3 of 5 allowed items</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">Active</span>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white border shadow rounded-xl p-6">
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
        <p className="text-gray-700 mb-4">
          Need more? Unlock all features with Premium.
        </p>
        <button
          onClick={() => alert('Redirect to Stripe Checkout (not implemented)')}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl text-lg hover:bg-blue-600 transition"
        >
          Upgrade to Premium
        </button>
      </section>

      {/* Billing History */}
      <section className="bg-white border shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Billing History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-t border-gray-100">
            <thead>
              <tr className="text-gray-600 font-medium">
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  date: 'Apr 5, 2025',
                  amount: '$3.99',
                  status: 'Paid',
                  url: '#',
                },
                {
                  date: 'Mar 5, 2025',
                  amount: '$3.99',
                  status: 'Paid',
                  url: '#',
                },
                {
                  date: 'Feb 5, 2025',
                  amount: '$3.99',
                  status: 'Failed',
                  url: '#',
                },
              ].map((invoice, i) => (
                <tr key={i}>
                  <td className="py-2">{invoice.date}</td>
                  <td className="py-2">{invoice.amount}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${invoice.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={downloadInvoice}
                      className={`text-sm underline ${invoice.status === 'Failed'
                          ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                          : 'text-brand-primary'
                        }`}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
