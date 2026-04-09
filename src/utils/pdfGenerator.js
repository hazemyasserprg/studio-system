import jsPDF from 'jspdf';
import { format } from 'date-fns';

/**
 * Generates a professional branded PDF invoice using jsPDF (ESM compatible).
 */
export const generateInvoicePDF = (invoice, client, studioInfo = {}, currencySymbol = 'EGP') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const primaryColor = studioInfo.color || '#6366f1';
  const pageW = 210;
  const pageH = 297;

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 99, g: 102, b: 241 };
  };

  const rgb = hexToRgb(primaryColor);
  const amount = Number(invoice?.amount || 0);
  const paid = Number(invoice?.paid || 0);
  const balance = amount - paid;
  const dateStr = invoice?.created_at
    ? format(new Date(invoice.created_at), 'MMMM dd, yyyy')
    : format(new Date(), 'MMMM dd, yyyy');

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.rect(0, 0, pageW, 50, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(studioInfo.name || 'StudioBiz', 15, 22);

  doc.setFontSize(30);
  doc.text('INVOICE', pageW - 15, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 255);
  doc.text(`#${String(invoice?.id || '0000').toUpperCase()}`, 15, 32);
  doc.text(dateStr, pageW - 15, 32, { align: 'right' });

  if (studioInfo.email) {
    doc.text(studioInfo.email, 15, 40);
  }

  // ── Bill To section ──────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('BILL TO', 15, 62);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(client?.name || 'Valued Client', 15, 71);

  if (client?.phone) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(client.phone, 15, 78);
  }

  // Due date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('DUE DATE', pageW - 15, 62, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(invoice?.due_date || 'N/A', pageW - 15, 71, { align: 'right' });

  // Status badge
  const statusColor =
    invoice?.status === 'Paid'           ? [16, 185, 129] :
    invoice?.status === 'Partially Paid' ? [245, 158, 11] :
                                           [239, 68, 68];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageW - 55, 65, 40, 10, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(invoice?.status || 'Unpaid', pageW - 35, 72, { align: 'center' });

  // ── Divider ──────────────────────────────────────────────
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(15, 86, pageW - 15, 86);

  // ── Line items table header ──────────────────────────────
  doc.setFillColor(248, 249, 250);
  doc.rect(15, 90, pageW - 30, 10, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('DESCRIPTION', 20, 97);
  doc.text('QTY', 130, 97, { align: 'center' });
  doc.text('PRICE', 160, 97, { align: 'center' });
  doc.text('TOTAL', pageW - 20, 97, { align: 'right' });

  // ── Line item ─────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(invoice?.packages?.name || 'Photography Session', 20, 110);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Professional photography services', 20, 117);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('1', 130, 110, { align: 'center' });
  doc.text(`${currencySymbol} ${amount.toLocaleString()}`, 160, 110, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${currencySymbol} ${amount.toLocaleString()}`, pageW - 20, 110, { align: 'right' });

  doc.setDrawColor(240, 240, 240);
  doc.line(15, 124, pageW - 15, 124);

  // ── Summary block ─────────────────────────────────────────
  const summaryX = pageW - 85;
  const sY = 134;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text('Subtotal', summaryX, sY);
  doc.text(`${currencySymbol} ${amount.toLocaleString()}`, pageW - 20, sY, { align: 'right' });
  doc.setDrawColor(240, 240, 240);
  doc.line(summaryX, sY + 3, pageW - 15, sY + 3);

  doc.setFont('helvetica', 'bold'); doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text('Amount Paid', summaryX, sY + 12);
  doc.text(`${currencySymbol} ${paid.toLocaleString()}`, pageW - 20, sY + 12, { align: 'right' });
  doc.line(summaryX, sY + 15, pageW - 15, sY + 15);

  // Amount Due highlight
  doc.setFillColor(rgb.r, rgb.g, rgb.b);
  doc.roundedRect(summaryX - 3, sY + 20, pageW - summaryX + 3 - 12, 14, 3, 3, 'F');
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('Amount Due', summaryX + 2, sY + 29);
  doc.text(`${currencySymbol} ${balance.toLocaleString()}`, pageW - 22, sY + 29, { align: 'right' });

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(248, 249, 250);
  doc.rect(0, pageH - 30, pageW, 30, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.line(0, pageH - 30, pageW, pageH - 30);

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(75, 85, 99);
  doc.text('Thank you for your business!', pageW / 2, pageH - 18, { align: 'center' });

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
  doc.text(
    `${studioInfo.name || 'StudioBiz'}${studioInfo.email ? ` • ${studioInfo.email}` : ''}`,
    pageW / 2, pageH - 10, { align: 'center' }
  );

  const clientName = (client?.name || 'Invoice').replace(/\s+/g, '_');
  doc.save(`Invoice_${clientName}_${invoice?.id || ''}.pdf`);
};
