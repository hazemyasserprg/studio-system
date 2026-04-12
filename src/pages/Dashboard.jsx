import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CalendarClock, Wallet, TrendingUp, Clock, Plus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/dashboard/StatCard';
import Skeleton from '../components/common/Skeleton';
import { supabase } from '../utils/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useTranslation } from '../context/LanguageContext';

const Dashboard = () => {
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });
      const { data: bookingsData } = await supabase.from('bookings').select('*, clients(name), packages(name)');
      const { data: invoicesData } = await supabase.from('invoices').select('*');
      const { data: expensesData } = await supabase.from('expenses').select('*');
      const totalExpenses = expensesData?.reduce((acc, ex) => acc + (Number(ex.amount) || 0), 0) || 0;

      const totalBilled = invoicesData?.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) || 0;
      const totalPaid = invoicesData?.reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0) || 0;
      const pendingInvoicesAmount = totalBilled - totalPaid;
      const netProfit = totalBilled - totalExpenses; // Use billed revenue for business profit calculation

      setStats([
        { title: t('total_clients'), value: clientCount?.toString() || '0', icon: Users, color: '#6366f1', onClick: () => navigate('/clients') },
        { title: t('total_bookings'), value: bookingsData?.length?.toString() || '0', icon: CalendarClock, color: '#10b981', onClick: () => navigate('/bookings') },
        { title: t('pending_invoices'), value: `${t('currency')} ${pendingInvoicesAmount.toLocaleString()}`, icon: Wallet, color: '#f59e0b', onClick: () => navigate('/invoices') },
        { title: t('total_revenue'), value: `${t('currency')} ${totalBilled.toLocaleString()}`, icon: TrendingUp, color: '#ec4899', onClick: () => navigate('/reports') },
        { title: t('total_expenses'), value: `${t('currency')} ${totalExpenses.toLocaleString()}`, icon: Wallet, color: '#ef4444', onClick: () => navigate('/expenses') },
        { title: t('net_profit'), value: `${t('currency')} ${netProfit.toLocaleString()}`, icon: TrendingUp, color: '#8b5cf6', onClick: () => navigate('/reports') },
      ]);

      setUpcomingEvents(bookingsData?.slice(0, 3).map(b => ({
        client: b.clients?.name || 'Unknown',
        package: b.packages?.name || 'Standard',
        date: new Date(b.event_date).toLocaleDateString(),
        time: 'TBD',
        status: b.status
      })) || []);

      const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
      const realChartData = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthlyRevenue = invoicesData?.filter(inv => {
          const invDate = new Date(inv.created_at);
          return isWithinInterval(invDate, { start: monthStart, end: monthEnd });
        }).reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0) || 0;
        return { name: format(month, 'MMM'), revenue: monthlyRevenue };
      });

      setChartData(realChartData);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('dashboard-auto-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} height="120px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="dashboard-page"
    >
      <header className="flex-between-responsive" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{t('overview')}</h1>
          <p className="text-mute">{t('overview_subtitle')}</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => navigate('/bookings', { state: { openModal: true } })}>
          <Plus size={20} />
          <span>{t('new_booking')}</span>
        </button>
      </header>
      
      <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
        {stats.map((stat, index) => <StatCard key={index} {...stat} />)}
      </div>
      
      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1.5fr))' }}>
        <div className="card">
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>{t('revenue_stats')}</h2>
          <div style={{ width: '100%', height: '300px', direction: 'ltr' }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 className="h2" style={{ fontSize: '1.125rem' }}>{t('upcoming_events')}</h2>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: '0.75rem' }}
              onClick={() => navigate('/bookings')}
            >
              {t('view_all')}
            </button>
          </div>
          <div className="flex-column" style={{ gap: '1rem' }}>
            {upcomingEvents.map((event, index) => (
              <div key={index} style={{ paddingBottom: '1rem', borderBottom: index !== upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                  <p style={{ fontWeight: 600 }}>{event.client}</p>
                  <span className={`badge ${event.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{event.status}</span>
                </div>
                <p className="text-mute" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>{event.package}</p>
                <div className="flex-wrap" style={{ gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarClock size={14} /><span>{event.date}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /><span>{event.time}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
