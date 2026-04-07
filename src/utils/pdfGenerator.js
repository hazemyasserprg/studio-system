import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a professional branded PDF invoice for a client.
 * 
 * @param {Object} invoice - The invoice data from Supabase
 * @param {Object} client - The client data associated with the invoice
 * @param {Object} studioInfo - Optional studio branding info (name, logo, etc)
 */
export const generateInvoicePDF = (invoice, client, studioInfo = {}) => {
  try {
    const doc = new jsPDF();
    const primaryColor = studioInfo.color || [99, 102, 241]; // var(--accent) in RGB
    
    // 1. Header & Branding
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    if (studioInfo.logo) {
      try {
        // Detect format from data URL
        const format = studioInfo.logo.split(';')[0].split('/')[1]?.toUpperCase() || 'PNG';
        // Render logo with FAST compression to avoid UI lag
        doc.addImage(studioInfo.logo, format, 20, 10, 25, 20, undefined, 'FAST');
        // Shift name slightly if logo exists
        doc.text(studioInfo.name || 'StudioBiz', 50, 25);
      } catch (e) {
        doc.text(studioInfo.name || 'StudioBiz', 20, 25);
      }
    } else {
      doc.text(studioInfo.name || 'StudioBiz', 20, 25);
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 190, 25, { align: 'right' });
    
    const invoiceId = String(invoice?.id || '0000').toUpperCase();
    doc.text(`#${invoiceId}`, 190, 32, { align: 'right' });
  
    // 2. Client & Invoice Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 60);
    
    doc.setFont('helvetica', 'normal');
    const clientName = client?.name || 'Valued Client';
    doc.text(clientName, 20, 68);
    doc.text(client?.phone || '', 20, 74);
    
    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 140, 60);
    doc.setFont('helvetica', 'normal');
    
    const dateStr = invoice?.created_at 
      ? format(new Date(invoice.created_at), 'MMMM dd, yyyy')
      : format(new Date(), 'MMMM dd, yyyy');
    doc.text(dateStr, 140, 68);
  
    // 3. Table of Items
    const amount = Number(invoice?.amount || 0);
    const tableData = [
      [
        invoice?.packages?.name || 'Photography Session',
        `$${amount.toLocaleString()}`,
        '1',
        `$${amount.toLocaleString()}`
      ]
    ];
  
    autoTable(doc, {
      startY: 90,
      head: [['Item Description', 'Price', 'Quantity', 'Total']],
      body: tableData,
      headStyles: { fillColor: primaryColor, textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });
  
    // 4. Totals
    const finalY = (doc.lastAutoTable?.finalY || 100) + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 140, finalY);
    doc.text(`$${amount.toLocaleString()}`, 190, finalY, { align: 'right' });
    
    const paid = Number(invoice?.paid || 0);
    doc.text('Paid Amount:', 140, finalY + 8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`$${paid.toLocaleString()}`, 190, finalY + 8, { align: 'right' });
  
    doc.setTextColor(50, 50, 50);
    const balance = amount - paid;
    doc.text('Balance Due:', 140, finalY + 16);
    doc.text(`$${balance.toLocaleString()}`, 190, finalY + 16, { align: 'right' });
  
    // 5. Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
    // Save the PDF
    const fileName = `Invoice_${clientName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Could not generate PDF. Please check console for details.');
  }
};
