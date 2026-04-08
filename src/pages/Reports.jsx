import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../utils/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(t('reports_title'), 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`${lang === 'ar' ? 'تاريخ الإنشاء' : 'Generated on'}: ${new Date().toLocaleDateString()}`, 14, 30);

      // Financial Summary
      doc.setTextColor(0);
      doc.text(t('financial_summary').toUpperCase(), 14, 45);

      autoTable(doc, {
        startY: 48,
        head: [[t('metric'), t('value')]],
        body: [
          [t('total_revenue_paid'), `$${stats.revenue.toLocaleString()}`],
          [t('total_expenses'), `$${stats.expenses.toLocaleString()}`],
          [t('net_profit'), `$${stats.profit.toLocaleString()}`],
          [t('outstanding_dues'), `$${stats.outstanding.toLocaleString()}`],
          [t('total_sessions'), stats.sessions.toString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      });

      // Detailed Breakdown
      doc.text(t('revenue_by_category').toUpperCase(), 14, (doc).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc).lastAutoTable.finalY + 18,
        head: [[t('package_type'), t('revenue_stats'), t('count')]],
        body: data.map(r => [r.name, `$${r.value.toLocaleString()}`, r.count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      doc.save('Studio_Report.pdf');
      setToastMessage(t('pdf_export_success'));
    } catch (err) {
      console.error("PDF Generation Error:", err);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>${stats.revenue.toLocaleString()}</h2><div className="badge badge-success" style={{ fontSize: '0.65rem' }}>{t('realtime_badge')}</div></div>
        </div>
        <div className="card">
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('total_expenses')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>${stats.expenses.toLocaleString()}</h2></div>
        </div>
        <div className="card" style={{ border: '2px solid var(--accent)' }}>
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 700 }}>{t('net_profit')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '2rem', fontWeight: 800, color: stats.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>${stats.profit.toLocaleString()}</h2></div>
        </div>
        <div className="card">
          <p className="text-mute" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{t('outstanding_dues')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>${stats.outstanding.toLocaleString()}</h2></div>
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
