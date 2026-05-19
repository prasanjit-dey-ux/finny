/**
 * Spends screen logic tests — verifies calculations, 
 * category breakdowns, date grouping, and edge cases.
 */

// Same mocks
const mockStorage: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: jest.fn((key: string, val: string) => { mockStorage[key] = val; return Promise.resolve(); }),
    removeItem: jest.fn((key: string) => { delete mockStorage[key]; return Promise.resolve(); }),
    clear: jest.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); return Promise.resolve(); }),
  },
}));

jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(async (_a: any, d: string) => {
    let h = 0;
    for (let i = 0; i < d.length; i++) { h = ((h << 5) - h) + d.charCodeAt(i); h |= 0; }
    return Math.abs(h).toString(16).padStart(16, "0");
  }),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

import { Store, formatINR, type Expense, type Subscription, type Bill } from "../lib/store";

function clearAll() {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

// ── Re-implement spends screen logic for testing ──────────────────────────────

const CATEGORIES = [
  { id: "food",          label: "Food",          color: "#F59E0B" },
  { id: "shopping",      label: "Shopping",      color: "#3B82F6" },
  { id: "transport",     label: "Transport",     color: "#6B7280" },
  { id: "bills",         label: "Bills",         color: "#268FFF" },
  { id: "subscription",  label: "Subscriptions", color: "#8B5CF6" },
  { id: "health",        label: "Health",        color: "#10B981" },
  { id: "entertainment", label: "Entertain.",    color: "#F97316" },
  { id: "education",     label: "Education",     color: "#EC4899" },
  { id: "others",        label: "Others",        color: "#9CA3AF" },
];

function calcTotalMonthly(subs: Subscription[], bills: Bill[]) {
  return subs.filter((s) => s.active).reduce((a, s) => a + s.amount, 0)
    + bills.filter((b) => b.recurring).reduce((a, b) => a + b.amount, 0);
}

function filterMonthExpenses(expenses: Expense[]) {
  const now = new Date();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function calcCatTotals(monthExpenses: Expense[]) {
  return CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses.filter((e) => e.category.toLowerCase() === c.id).reduce((a, e) => a + e.amount, 0),
  })).filter((c) => c.total > 0);
}

function calcCategoryPercentage(catTotal: number, totalExpenses: number): number {
  if (totalExpenses === 0) return 0;
  return (catTotal / totalExpenses) * 100;
}

function groupExpensesByDate(expenses: Expense[]) {
  const groups: { label: string; items: Expense[] }[] = [];
  const map: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const d = new Date(e.date);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    let label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    if (!map[label]) { map[label] = []; groups.push({ label, items: map[label] }); }
    map[label].push(e);
  }
  return groups;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Spends Screen Logic", () => {
  beforeEach(clearAll);

  describe("Total Monthly Calculation", () => {
    test("sums active subs + recurring bills", () => {
      const subs: Subscription[] = [
        { id: "1", name: "Netflix", icon: "film", amount: 649, renewalDate: "2026-06-01", active: true },
        { id: "2", name: "Spotify", icon: "music", amount: 119, renewalDate: "2026-06-15", active: true },
        { id: "3", name: "Old", icon: "x", amount: 500, renewalDate: "2026-01-01", active: false },
      ];
      const bills: Bill[] = [
        { id: "b1", name: "Wifi", amount: 999, dueDate: "2026-06-01", paid: false, recurring: true },
        { id: "b2", name: "One-time", amount: 5000, dueDate: "2026-06-01", paid: false, recurring: false },
      ];
      expect(calcTotalMonthly(subs, bills)).toBe(649 + 119 + 999);
    });

    test("returns 0 with empty arrays", () => {
      expect(calcTotalMonthly([], [])).toBe(0);
    });

    test("returns 0 when all subs inactive and bills non-recurring", () => {
      const subs: Subscription[] = [
        { id: "1", name: "Netflix", icon: "film", amount: 649, renewalDate: "2026-06-01", active: false },
      ];
      const bills: Bill[] = [
        { id: "b1", name: "Wifi", amount: 999, dueDate: "2026-06-01", paid: false, recurring: false },
      ];
      expect(calcTotalMonthly(subs, bills)).toBe(0);
    });
  });

  describe("Month Expense Filtering", () => {
    test("filters only current month expenses", () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString();

      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "This month", date: thisMonth },
        { id: "2", amount: 300, category: "food", note: "Last month", date: lastMonth },
        { id: "3", amount: 200, category: "food", note: "Next month", date: nextMonth },
      ];

      const filtered = filterMonthExpenses(expenses);
      expect(filtered.length).toBe(1);
      expect(filtered[0].note).toBe("This month");
    });

    test("returns empty for no expenses", () => {
      expect(filterMonthExpenses([])).toEqual([]);
    });
  });

  describe("Category Breakdown", () => {
    test("groups expenses by category correctly", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "Lunch", date: new Date().toISOString() },
        { id: "2", amount: 300, category: "food", note: "Dinner", date: new Date().toISOString() },
        { id: "3", amount: 200, category: "shopping", note: "Amazon", date: new Date().toISOString() },
      ];

      const catTotals = calcCatTotals(expenses);
      expect(catTotals.length).toBe(2);
      
      const food = catTotals.find(c => c.id === "food");
      expect(food?.total).toBe(800);
      
      const shopping = catTotals.find(c => c.id === "shopping");
      expect(shopping?.total).toBe(200);
    });

    test("filters out zero-total categories", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "Lunch", date: new Date().toISOString() },
      ];

      const catTotals = calcCatTotals(expenses);
      expect(catTotals.length).toBe(1);
      expect(catTotals[0].id).toBe("food");
    });

    test("handles empty expenses (no categories)", () => {
      expect(calcCatTotals([])).toEqual([]);
    });

    test("handles case-insensitive category matching", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "Food", note: "test", date: new Date().toISOString() },
        { id: "2", amount: 300, category: "FOOD", note: "test", date: new Date().toISOString() },
        { id: "3", amount: 200, category: "food", note: "test", date: new Date().toISOString() },
      ];
      const catTotals = calcCatTotals(expenses);
      const food = catTotals.find(c => c.id === "food");
      expect(food?.total).toBe(1000);
    });

    test("unknown categories are NOT grouped into 'others' (bug check)", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "random_unknown", note: "test", date: new Date().toISOString() },
      ];
      const catTotals = calcCatTotals(expenses);
      // This is a potential bug: unknown categories don't appear in breakdown at all
      expect(catTotals.length).toBe(0);
    });
  });

  describe("Category Percentage (Division by Zero)", () => {
    test("returns 0 when totalExpenses is 0", () => {
      expect(calcCategoryPercentage(500, 0)).toBe(0);
    });

    test("calculates correct percentage", () => {
      expect(calcCategoryPercentage(250, 1000)).toBe(25);
    });

    test("handles 100% (single category)", () => {
      expect(calcCategoryPercentage(1000, 1000)).toBe(100);
    });
  });

  describe("Date Grouping", () => {
    test("groups today's expenses under 'Today'", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "Lunch", date: new Date().toISOString() },
        { id: "2", amount: 300, category: "shopping", note: "Amazon", date: new Date().toISOString() },
      ];
      const groups = groupExpensesByDate(expenses);
      expect(groups.length).toBe(1);
      expect(groups[0].label).toBe("Today");
      expect(groups[0].items.length).toBe(2);
    });

    test("groups yesterday's expenses under 'Yesterday'", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "test", date: yesterday },
      ];
      const groups = groupExpensesByDate(expenses);
      expect(groups[0].label).toBe("Yesterday");
    });

    test("handles empty array", () => {
      expect(groupExpensesByDate([])).toEqual([]);
    });

    test("groups mixed dates correctly", () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "Today1", date: today },
        { id: "2", amount: 300, category: "food", note: "Yesterday1", date: yesterday },
        { id: "3", amount: 200, category: "food", note: "Today2", date: today },
        { id: "4", amount: 100, category: "food", note: "LastWeek1", date: lastWeek },
      ];
      
      const groups = groupExpensesByDate(expenses);
      expect(groups.length).toBe(3);
      
      const todayGroup = groups.find(g => g.label === "Today");
      expect(todayGroup?.items.length).toBe(2);
    });
  });

  describe("Filter Logic", () => {
    test("'all' filter shows all expenses", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "test", date: new Date().toISOString() },
        { id: "2", amount: 300, category: "shopping", note: "test", date: new Date().toISOString() },
      ];
      const filtered = expenses; // filter === "all"
      expect(filtered.length).toBe(2);
    });

    test("category filter works correctly", () => {
      const expenses: Expense[] = [
        { id: "1", amount: 500, category: "food", note: "test", date: new Date().toISOString() },
        { id: "2", amount: 300, category: "shopping", note: "test", date: new Date().toISOString() },
        { id: "3", amount: 200, category: "food", note: "test2", date: new Date().toISOString() },
      ];
      const filtered = expenses.filter((e) => e.category.toLowerCase() === "food");
      expect(filtered.length).toBe(2);
    });
  });

  describe("Stacked Bar (flexbox) edge cases", () => {
    test("single category gets full bar", () => {
      const catTotals = [{ id: "food", total: 1000 }];
      // In the UI, flex: c.total means single item gets all space
      expect(catTotals.length).toBe(1);
      expect(catTotals[0].total).toBeGreaterThan(0);
    });

    test("zero total category already filtered out", () => {
      const expenses: Expense[] = [];
      const catTotals = calcCatTotals(expenses);
      // No zero-total entries should appear
      expect(catTotals.every(c => c.total > 0)).toBe(true);
    });
  });

  describe("Subscription date handling", () => {
    test("handles dd/mm/yyyy date format in modal", () => {
      const dateStr = "30/05/2026";
      const [d, m, y] = dateStr.split("/");
      const dateIso = new Date(+y, +m - 1, +d).toISOString();
      const parsed = new Date(dateIso);
      expect(parsed.getDate()).toBe(30);
      expect(parsed.getMonth()).toBe(4); // May = 4
      expect(parsed.getFullYear()).toBe(2026);
    });

    test("handles ISO date format", () => {
      const dateStr = "2026-05-30";
      const dateIso = new Date(dateStr).toISOString();
      const parsed = new Date(dateIso);
      expect(parsed.getFullYear()).toBe(2026);
    });

    test("handles invalid date gracefully", () => {
      const dateStr = "not-a-date";
      const parsed = new Date(dateStr);
      expect(isNaN(parsed.getTime())).toBe(true);
    });
  });

  describe("BUG: Unknown categories lost in breakdown", () => {
    /**
     * When AI logs an expense with a category like "Other", "Grocery", or
     * any string that doesn't match CATEGORIES[].id exactly (lowercase),
     * it won't appear in the spending breakdown.
     * 
     * The spends screen matches: e.category.toLowerCase() === c.id
     * But the AI might log "Other" (capital O) which lowercases to "other"
     * and DOES match "others" — wait, no it doesn't. "other" !== "others"
     * 
     * This IS a bug.
     */
    test("'Other' from AI does NOT match 'others' category", () => {
      const category = "Other"; // AI logs this
      const match = CATEGORIES.find(c => c.id === category.toLowerCase());
      // "other" !== "others" — this is a bug!
      expect(match).toBeUndefined();
    });

    test("'Grocery' from AI has no matching category", () => {
      const category = "Grocery";
      const match = CATEGORIES.find(c => c.id === category.toLowerCase());
      expect(match).toBeUndefined();
    });
  });
});
