export const MOCK_CLIENTS = [
  { id: 1, name: 'Sarah Johnson', phone: '+1 (555) 012-3456', status: 'Booked', date: '2026-10-15', package: 'Wedding Gold' },
  { id: 2, name: 'Mark Thompson', phone: '+1 (555) 789-0123', status: 'Lead', date: '2026-10-16', package: 'Portrait Session' },
  { id: 3, name: 'Emily Davis', phone: '+1 (555) 456-7890', status: 'Completed', date: '2026-10-18', package: 'Commercial Shoot' },
  { id: 4, name: 'Michael Brown', phone: '+1 (555) 234-5678', status: 'Cancelled', date: '2026-11-20', package: 'Event Silver' },
  { id: 5, name: 'Jessica Miller', phone: '+1 (555) 901-2345', status: 'Booked', date: '2026-12-05', package: 'Family Session' },
];

export const MOCK_PACKAGES = [
  { id: 1, name: 'Wedding Gold', price: 2500, sessions: 2, albums: 1, prints: 50 },
  { id: 2, name: 'Portrait Session', price: 350, sessions: 1, albums: 0, prints: 5 },
  { id: 3, name: 'Commercial Shoot', price: 1200, sessions: 1, albums: 0, prints: 0 },
  { id: 4, name: 'Family Session', price: 450, sessions: 1, albums: 1, prints: 10 },
  { id: 5, name: 'Event Silver', price: 800, sessions: 1, albums: 0, prints: 20 },
];

export const MOCK_INVOICES = [
  { id: 'INV-001', client: 'Sarah Johnson', amount: 2500, paid: 1500, status: 'Partially Paid', date: '2026-10-10' },
  { id: 'INV-002', client: 'Mark Thompson', amount: 350, paid: 0, status: 'Unpaid', date: '2026-10-15' },
  { id: 'INV-003', client: 'Emily Davis', amount: 1200, paid: 1200, status: 'Paid', date: '2026-10-18' },
  { id: 'INV-004', client: 'Jessica Miller', amount: 450, paid: 450, status: 'Paid', date: '2026-12-01' },
];
