import type { Budget, Category, Transaction } from './types';

/** Inclusive [start, end] ISO date bounds for a given (year, 0-indexed month). */
export function getMonthRange(year: number, month0: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month0 + 1)}-01`;
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const end = `${year}-${pad(month0 + 1)}-${pad(lastDay)}`;
  return { start, end };
}

export function monthTotals(transactions: Transaction[]): { income: number; expense: number } {
  const income = transactions.filter((t) => t.tipe === 'income').reduce((a, t) => a + t.jumlah, 0);
  const expense = transactions.filter((t) => t.tipe === 'expense').reduce((a, t) => a + t.jumlah, 0);
  return { income, expense };
}

export interface BudgetRow {
  categoryId: string;
  kategori: string;
  actual: number;
  target: number;
  over: boolean;
  pct: number;
  isRecurring: boolean;
}

/** One row per expense category that has either activity this month or a nonzero target — mirrors the prototype. */
export function budgetProgress(
  expenseCategories: Category[],
  budgets: Budget[],
  monthTransactions: Transaction[]
): BudgetRow[] {
  const targetByCategory = new Map(budgets.map((b) => [b.category_id, b.target_amount]));
  const rows: BudgetRow[] = [];

  for (const c of expenseCategories) {
    const actual = monthTransactions
      .filter((t) => t.tipe === 'expense' && t.category_id === c.id)
      .reduce((a, t) => a + t.jumlah, 0);
    const target = targetByCategory.get(c.id) || 0;
    if (!actual && !target) continue;
    const over = target > 0 && actual > target;
    const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0;
    rows.push({ categoryId: c.id, kategori: c.name, actual, target, over, pct, isRecurring: c.is_recurring });
  }

  return rows;
}

export function fundProjection(currentBalance: number, target: number, monthlyDeposit: number) {
  const left = Math.max(0, target - currentBalance);
  const pct = target > 0 ? Math.min(100, Math.round((currentBalance / target) * 100)) : 0;
  const monthsLeft = monthlyDeposit > 0 ? Math.ceil(left / monthlyDeposit) : 0;
  const eta = new Date();
  eta.setMonth(eta.getMonth() + monthsLeft);
  const etaLabel = left <= 0 ? 'Reached' : eta.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return { pct, left, monthsLeft: left <= 0 ? 0 : monthsLeft, etaLabel };
}
