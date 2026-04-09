import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

/**
 * Generates a professional branded PDF invoice for a client using HTML-to-PDF.
 */
export const generateInvoicePDF = (invoice, client, studioInfo = {}, currencySymbol = '$') => {
  const isAr = studioInfo.lang === 'ar';
  const primaryColor = studioInfo.color || '#6366f1';
  
  const amount = Number(invoice?.amount || 0);
  const paid = Number(invoice?.paid || 0);
  const balance = amount - paid;
  const dateStr = invoice?.created_at 
    ? format(new Date(invoice.created_at), isAr ? 'yyyy/MM/dd' : 'MMMM dd, yyyy')
    : format(new Date(), isAr ? 'yyyy/MM/dd' : 'MMMM dd, yyyy');

  const containerStyles = `
    width: 800px;
    height: 1120px; /* Safely under A4 mathematical height bounds */
    background: white;
    font-family: 'Inter', 'Arial', sans-serif;
    color: #111827;
    direction: ${isAr ? 'rtl' : 'ltr'};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // Professional Invoice HTML Template
  const htmlContent = `
    <div style="${containerStyles}">
      <div style="background: ${primaryColor}; padding: 50px; color: white; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; gap: 20px; align-items: center;">
          ${studioInfo.logo ? `<img src="${studioInfo.logo}" style="width: 90px; height: 90px; object-fit: contain; background: white; border-radius: 12px; padding: 5px;" />` : `<div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800;">S</div>`}
          <div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 800; ${isAr ? '' : 'letter-spacing: -0.025em;'}">${studioInfo.name || 'StudioBiz'}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">#${String(invoice?.id || '0000').toUpperCase()}</p>
          </div>
        </div>
        <div style="text-align: ${isAr ? 'left' : 'right'}">
          <h2 style="margin: 0; font-size: 36px; font-weight: 800; text-transform: uppercase; ${isAr ? '' : 'letter-spacing: 2px;'}">${isAr ? 'فاتورة' : 'INVOICE'}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${dateStr}</p>
        </div>
      </div>

      <div style="padding: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <p style="text-transform: uppercase; font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 10px; border-bottom: 2px solid #f3f4f6; padding-bottom: 5px; display: inline-block;">${isAr ? 'فاتورة إلى' : 'Bill To'}</p>
          <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">${client?.name || 'Valued Client'}</h3>
          <p style="margin: 5px 0 0 0; color: #4b5563;">${client?.phone || ''}</p>
        </div>
        <div style="text-align: ${isAr ? 'left' : 'right'}">
           <p style="text-transform: uppercase; font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 10px; border-bottom: 2px solid #f3f4f6; padding-bottom: 5px; display: inline-block;">${isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
           <h3 style="margin: 0; font-size: 18px; color: #111827;">${invoice?.due_date || 'N/A'}</h3>
        </div>
      </div>

      <div style="padding: 0 50px;">
        <table style="width: 100%; border-collapse: collapse; text-align: ${isAr ? 'right' : 'left'};">
          <thead>
            <tr style="border-bottom: 2px solid #f3f4f6;">
              <th style="padding: 15px 0; font-size: 13px; color: #6b7280; text-transform: uppercase;">${isAr ? 'الوصف' : 'Description'}</th>
              <th style="padding: 15px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; text-align: center;">${isAr ? 'الكمية' : 'Qty'}</th>
              <th style="padding: 15px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'السعر' : 'Price'}</th>
              <th style="padding: 15px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; text-align: ${isAr ? 'left' : 'right'};">${isAr ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #111827;">${invoice?.packages?.name || 'Photography Session'}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Professional photography services</p>
              </td>
              <td style="padding: 20px 0; text-align: center; color: #4b5563;">1</td>
              <td style="padding: 20px 0; text-align: ${isAr ? 'left' : 'right'}; font-weight: 600; color: #4b5563;">${currencySymbol} ${amount.toLocaleString()}</td>
              <td style="padding: 20px 0; text-align: ${isAr ? 'left' : 'right'}; font-weight: 700; color: #111827;">${currencySymbol} ${amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="padding: 50px; display: flex; justify-content: flex-end;">
        <div style="width: 320px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
            <span>${isAr ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
            <span style="font-weight: 600; color: #111827;">${currencySymbol} ${amount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: ${primaryColor};">
            <span style="font-weight: 700;">${isAr ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
            <span style="font-weight: 700;">${currencySymbol} ${paid.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 25px 0; color: #111827;">
            <span style="font-size: 20px; font-weight: 800; color: #111827;">${isAr ? 'المبلغ المتبقي' : 'Amount Due'}</span>
            <span style="font-size: 20px; font-weight: 800; color: #111827;">${currencySymbol} ${balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; background: #f9fafb; padding: 40px 50px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-weight: 600; font-size: 15px; color: #4b5563;">${isAr ? 'نشكركم على تعاملكم معنا!' : 'Thank you for your business!'}</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">Questions? Contact us at ${studioInfo.email || ''}</p>
      </div>
    </div>
  `;

  const opt = {
    margin: 0,
    filename: `Invoice_${client?.name?.replace(/\s+/g, '_') || '0000'}.pdf`,
    image: { type: 'png' },
    html2canvas: { scale: 4, useCORS: true, windowWidth: 800 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  return html2pdf().from(htmlContent).set(opt).save();
};
