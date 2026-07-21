export const DEFAULT_EXPENSE_CATEGORIES = [
  'Hutang', 'Langganan', 'Ibu', 'Makan Kantor', 'Makan Warkop',
  'Nongkrong Sosial', 'Transport', 'Internet/Pulsa', 'Dana Darurat', 'Buffer Tak Terduga',
] as const;

export const DEFAULT_INCOME_CATEGORIES = ['Gaji', 'Bonus', 'Freelance', 'Lainnya'] as const;

export const EMERGENCY_FUND_CATEGORY = 'Dana Darurat';

export const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'input', label: 'Input' },
  { id: 'history', label: 'History' },
  { id: 'fund', label: 'Fund' },
  { id: 'settings', label: 'Settings' },
] as const;
