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
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, sessions: 0 });
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

      const groupedData = bookingData?.reduce((acc, b) => {
        const pkgName = b.packages?.name || 'Uncategorized';
        if (!acc[pkgName]) acc[pkgName] = { name: pkgName, value: 0, count: 0 };
        acc[pkgName].value += Number(b.total_price);
        acc[pkgName].count += 1;
        return acc;
      }, {}) || {};

      setData(Object.values(groupedData));

      const totalPaid = invoiceData?.reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0) || 0;
      const totalRevenue = invoiceData?.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) || 0;
      setStats({
        revenue: totalPaid,
        outstanding: totalRevenue - totalPaid,
        sessions: bookingData?.length || 0
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

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{t('reports_title')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('reports_subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('total_revenue_paid')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}><h2 style={{ fontSize: '2rem', fontWeight: 700 }}>${stats.revenue.toLocaleString()}</h2><div className="badge badge-success">{t('realtime_badge')}</div></div>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('outstanding_dues')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}><h2 style={{ fontSize: '2rem', fontWeight: 700 }}>${stats.outstanding.toLocaleString()}</h2></div>
        </div>
        <div className="card">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('total_sessions')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}><h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.sessions}</h2></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', minHeight: '400px' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('revenue_by_category')}</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={data} layout={lang === 'ar' ? 'horizontal' : 'horizontal'}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} reversed={lang === 'ar'} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} orientation={lang === 'ar' ? 'right' : 'left'} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', textAlign: lang === 'ar' ? 'right' : 'left' }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
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
