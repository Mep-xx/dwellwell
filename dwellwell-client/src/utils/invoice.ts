export type InvoiceData = {
    invoiceDate: string;
    invoiceId: string;
    customerEmail: string;
    paymentMethod: string;
    description: string;
    quantity: string;
    amount: string;
    total: string;
  };
  
  export async function generateInvoiceHtml(data: InvoiceData): Promise<string> {
    const res = await fetch('/templates/invoiceTemplate.html');
    let template = await res.text();
  
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    });
  
    return template;
  }
  