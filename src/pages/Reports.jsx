import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../utils/supabase/client';
import html2pdf from 'html2pdf.js';
import Toast from '../components/common/Toast';
import { useTranslation } from '../context/LanguageContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

const Reports = () => {
  const { lang, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, sessions: 0, expenses: 0, profit: 0 });
  const [toastMessage, setToastMessage] = useState('');

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: bookingData } = await supabase.from('bookings').select('*, packages(name)');
      const { data: invoiceData } = await supabase.from('invoices').select('*');
      const { data: expenseRecords } = await supabase.from('expenses').select('*');

      const groupedData = bookingData?.reduce((acc, b) => {
        const pkgName = b.packages?.name || 'Uncategorized';
        if (!acc[pkgName]) acc[pkgName] = { name: pkgName, value: 0, count: 0 };
        acc[pkgName].value += Number(b.total_price);
        acc[pkgName].count += 1;
        return acc;
      }, {}) || {};

      const groupedExpenses = expenseRecords?.reduce((acc, ex) => {
        const cat = t(`cat_${ex.category}`);
        if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
        acc[cat].value += Number(ex.amount);
        return acc;
      }, {}) || {};

      setData(Object.values(groupedData));
      setExpenseData(Object.values(groupedExpenses));

      const totalPaid = invoiceData?.reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0) || 0;
      const totalRevenue = invoiceData?.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) || 0;
      const totalExpenses = expenseRecords?.reduce((acc, ex) => acc + (Number(ex.amount) || 0), 0) || 0;

      setStats({
        revenue: totalPaid,
        outstanding: totalRevenue - totalPaid,
        sessions: bookingData?.length || 0,
        expenses: totalExpenses,
        profit: totalPaid - totalExpenses
      });
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = () => {
    const csvRows = [
      [t('package_type'), t('revenue_stats'), t('count')],
      ...data.map(row => [row.name, row.value, row.count])
    ];

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "studio_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(t('csv_export_success'));
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGeneratePDF = () => {
    setIsLoading(true);
    setToastMessage(t('pdf_generating'));
    
    try {
      const isAr = lang === 'ar';
      const studioInfo = {
        name: localStorage.getItem('studio_name') || 'StudioBiz',
        email: localStorage.getItem('studio_email') || 'contact@studiobiz.com',
        logo: localStorage.getItem('studio_logo') || null,
        color: localStorage.getItem('studio_color') || '#6366f1',
      };
      const primaryColor = studioInfo.color;
      const currencySymbol = t('currency');
      const dateStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const containerStyles = `
        width: 800px;
        height: 1120px;
        background: white;
        font-family: 'Inter', 'Arial', sans-serif;
        color: #111827;
        direction: ${isAr ? 'rtl' : 'ltr'};
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      const summaryRows = `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; color: #111827;">${t('total_revenue') || 'Total Revenue'}</td>
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${currencySymbol} ${stats.revenue.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; color: #111827;">${t('total_expenses') || 'Total Expenses'}</td>
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #ef4444;">${currencySymbol} ${stats.expenses.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; color: #111827;">${t('net_profit') || 'Net Profit'}</td>
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: ${stats.profit >= 0 ? '#10b981' : '#ef4444'};">${currencySymbol} ${stats.profit.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; color: #111827;">${t('outstanding_dues') || 'Outstanding Dues'}</td>
          <td style="padding: 15px; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #f59e0b;">${currencySymbol} ${stats.outstanding.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 15px; color: #111827;">${t('total_sessions') || 'Total Sessions'}</td>
          <td style="padding: 15px; font-weight: 600; color: #111827;">${stats.sessions}</td>
        </tr>
      `;

      const revenueRows = data.map(item => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; color: #111827; text-align: ${isAr ? 'right' : 'left'};">${item.name}</td>
          <td style="padding: 15px; font-weight: 600; color: #111827; text-align: ${isAr ? 'left' : 'right'};">${currencySymbol} ${item.value.toLocaleString()}</td>
          <td style="padding: 15px; text-align: center; color: #111827;">${item.count}</td>
        </tr>
      `).join('');

      const expenseRows = expenseData.map(item => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 15px; color: #111827; text-align: ${isAr ? 'right' : 'left'};">${item.name}</td>
          <td style="padding: 15px; font-weight: 600; color: #ef4444; text-align: ${isAr ? 'left' : 'right'};">${currencySymbol} ${item.value.toLocaleString()}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <div style="${containerStyles}">
          <div style="background: ${primaryColor}; padding: 50px; color: white; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 20px; align-items: center;">
              ${studioInfo.logo ? `<img src="${studioInfo.logo}" style="width: 90px; height: 90px; object-fit: contain; background: white; border-radius: 12px; padding: 5px;" />` : `<div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800;">S</div>`}
              <div>
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; ${isAr ? '' : 'letter-spacing: -0.025em;'}">${studioInfo.name || 'StudioBiz'}</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">${t('financial_reports') || 'Financial Reports'}</p>
              </div>
            </div>
            <div style="text-align: ${isAr ? 'left' : 'right'}">
              <h2 style="margin: 0; font-size: 36px; font-weight: 800; ${isAr ? '' : 'text-transform: uppercase;'}">${isAr ? 'تقرير' : 'REPORT'}</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${dateStr}</p>
            </div>
          </div>

          <div style="padding: 40px 50px;">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: ${primaryColor}; ${isAr ? '' : 'text-transform: uppercase;'}">${t('financial_summary') || 'Financial Summary'}</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <tbody style="background: white;">
                ${summaryRows}
              </tbody>
            </table>
          </div>

          <div style="padding: 0 50px 40px 50px; display: grid; grid-template-columns: 1fr; gap: 40px;">
            <div>
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #111827; ${isAr ? '' : 'text-transform: uppercase;'}">${t('revenue_by_category') || 'Revenue By Category'}</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px 15px; font-weight: 600; color: #111827; text-align: ${isAr ? 'right' : 'left'};">${t('package_type') || (isAr ? 'نوع الباقة' : 'Package')}</th>
                    <th style="padding: 12px 15px; font-weight: 600; color: #111827; text-align: ${isAr ? 'left' : 'right'};">${t('revenue_stats') || (isAr ? 'إحصائيات الإيرادات' : 'Revenue')}</th>
                    <th style="padding: 12px 15px; font-weight: 600; text-align: center; color: #111827;">${t('count') || (isAr ? 'العدد' : 'Count')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${revenueRows}
                </tbody>
              </table>
            </div>

            ${expenseData.length > 0 ? `
            <div>
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #111827; ${isAr ? '' : 'text-transform: uppercase;'}">${isAr ? 'المصروفات حسب الفئة' : 'Expenses By Category'}</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px 15px; font-weight: 600; color: #111827; text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'الفئة' : 'Category'}</th>
                    <th style="padding: 12px 15px; font-weight: 600; color: #111827; text-align: ${isAr ? 'left' : 'right'};">${t('amount') || (isAr ? 'المبلغ' : 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenseRows}
                </tbody>
              </table>
            </div>` : ''}
          </div>

          <div style="margin-top: auto; background: #f9fafb; padding: 40px 50px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 600; font-size: 15px; color: #4b5563;">${isAr ? 'تقرير مالي رسمي' : 'Official Financial Report'}</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">Generated securely by ${studioInfo.name || 'StudioBiz'}</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Studio_Report_${new Date().toLocaleDateString()}.pdf`,
        image: { type: 'png' },
        html2canvas: { scale: 4, useCORS: true, windowWidth: 800 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().from(htmlContent).set(opt).save().then(() => {
        setIsLoading(false);
        setToastMessage(t('pdf_export_success'));
      }).catch(err => {
        console.error(err);
        setIsLoading(false);
        setToastMessage(t('pdf_export_error'));
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setToastMessage(t('pdf_export_error'));
    }
    
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (isLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--accent)" /></div>;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit" 
      transition={{ duration: 0.4 }}
      className="reports-page"
    >
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      <header className="flex-between-responsive" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{t('reports_title')}</h1>
          <p className="text-mute">{t('reports_subtitle')}</p>
        </div>
        <div className="flex-wrap" style={{ gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>
            <FileSpreadsheet size={20} />
            <span>{t('export_csv')}</span>
          </button>
          <button onClick={handleGeneratePDF} className="btn btn-primary">
            <FileText size={20} />
            <span>{t('generate_pdf')}</span>
          </button>
        </div>
      </header>

      <div className="grid-responsive" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card">
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('total_revenue_paid')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('currency')} {stats.revenue.toLocaleString()}</h2><div className="badge badge-success" style={{ fontSize: '0.65rem' }}>{t('realtime_badge')}</div></div>
        </div>
        <div className="card">
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('total_expenses')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{t('currency')} {stats.expenses.toLocaleString()}</h2></div>
        </div>
        <div className="card" style={{ border: '2px solid var(--accent)' }}>
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 700 }}>{t('net_profit')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '2rem', fontWeight: 800, color: stats.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{t('currency')} {stats.profit.toLocaleString()}</h2></div>
        </div>
        <div className="card">
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('outstanding_dues')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('currency')} {stats.outstanding.toLocaleString()}</h2></div>
        </div>
      </div>

      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', minHeight: '400px' }}>
        <div className="card">
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>{t('revenue_by_category')}</h2>
          <div style={{ width: '100%', height: '300px', direction: 'ltr' }}>
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  reversed={lang === 'ar'} 
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  orientation={lang === 'ar' ? 'right' : 'left'} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-primary)', 
                    textAlign: lang === 'ar' ? 'right' : 'left' 
                  }} 
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>{t('expenses_title')}</h2>
          <div style={{ width: '100%', height: '300px', direction: 'ltr' }}>
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  reversed={lang === 'ar'} 
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  orientation={lang === 'ar' ? 'right' : 'left'} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-primary)', 
                    textAlign: lang === 'ar' ? 'right' : 'left' 
                  }} 
                />
                <Bar dataKey="value" fill="var(--danger)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('package_popularity')}</h2>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', textAlign: lang === 'ar' ? 'right' : 'left' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', marginTop: 'auto' }}>
            {data.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;
