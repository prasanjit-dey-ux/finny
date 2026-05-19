/**
 * Finny Store & Auth — comprehensive tests
 * Run: cd packages/mobile && npx jest __tests__/store.test.ts
 */

// Mock AsyncStorage
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

// Mock expo-crypto (simulates native env where window.crypto.subtle is NOT available)
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(async (_algo: any, data: string) => {
    // Simple deterministic hash for testing
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

import { Store, Auth, formatINR, daysUntil, shortDate } from "../lib/store";

// ─── Helper ───────────────────────────────────────────────────────────────────

function clearAll() {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Store", () => {
  beforeEach(clearAll);

  describe("Profile", () => {
    test("returns default profile when none set", async () => {
      const p = await Store.getProfile();
      expect(p.name).toBe("Friend");
      expect(p.monthlyIncome).toBe(0);
      expect(p.balance).toBe(0);
      expect(p.savingsGoal).toBe(0);
      expect(p.bigGoal).toBe("saving");
      expect(p.topCategories).toEqual([]);
      expect(p.notifications).toBe(true);
    });

    test("sets and gets profile", async () => {
      await Store.setProfile({
        name: "Test",
        monthlyIncome: 50000, monthlyBudget: 0,
        balance: 45000,
        savingsGoal: 10000,
        bigGoal: "travel",
        topCategories: ["food", "shopping"],
        topCategory: "food",
        notifications: true,
      });
      const p = await Store.getProfile();
      expect(p.name).toBe("Test");
      expect(p.monthlyIncome).toBe(50000);
      expect(p.balance).toBe(45000);
    });
  });

  describe("Expenses", () => {
    test("adds expense and prepends to list", async () => {
      await Store.addExpense({ id: "1", amount: 500, category: "food", note: "Lunch", date: new Date().toISOString() });
      await Store.addExpense({ id: "2", amount: 200, category: "transport", note: "Uber", date: new Date().toISOString() });
      const all = await Store.getExpenses();
      expect(all.length).toBe(2);
      expect(all[0].id).toBe("2"); // prepended
      expect(all[1].id).toBe("1");
    });

    test("returns empty array when no expenses", async () => {
      const all = await Store.getExpenses();
      expect(all).toEqual([]);
    });
  });

  describe("Subscriptions", () => {
    test("CRUD operations", async () => {
      await Store.addSubscription({ id: "s1", name: "Netflix", icon: "film", amount: 649, renewalDate: "2026-06-01T00:00:00.000Z", active: true });
      await Store.addSubscription({ id: "s2", name: "Spotify", icon: "music", amount: 119, renewalDate: "2026-06-15T00:00:00.000Z", active: true });
      
      let subs = await Store.getSubscriptions();
      expect(subs.length).toBe(2);
      
      await Store.toggleSubscription("s1");
      subs = await Store.getSubscriptions();
      expect(subs.find(s => s.id === "s1")?.active).toBe(false);
      
      await Store.deleteSubscription("s1");
      subs = await Store.getSubscriptions();
      expect(subs.length).toBe(1);
      expect(subs[0].id).toBe("s2");
    });
  });

  describe("Bills", () => {
    test("CRUD operations", async () => {
      await Store.addBill({ id: "b1", name: "Wifi", amount: 999, dueDate: "2026-06-01T00:00:00.000Z", paid: false, recurring: true });
      
      let bills = await Store.getBills();
      expect(bills.length).toBe(1);
      expect(bills[0].paid).toBe(false);
      
      await Store.toggleBillPaid("b1");
      bills = await Store.getBills();
      expect(bills[0].paid).toBe(true);
      
      await Store.deleteBill("b1");
      bills = await Store.getBills();
      expect(bills.length).toBe(0);
    });
  });

  describe("Wishes", () => {
    test("CRUD operations", async () => {
      await Store.addWish({ id: "w1", name: "iPhone", price: 79900, saved: 20000, createdAt: new Date().toISOString() });
      
      let wishes = await Store.getWishes();
      expect(wishes.length).toBe(1);
      expect(wishes[0].name).toBe("iPhone");
      
      await Store.deleteWish("w1");
      wishes = await Store.getWishes();
      expect(wishes.length).toBe(0);
    });
  });

  describe("Income Sources", () => {
    test("CRUD operations", async () => {
      await Store.addIncomeSource({ id: "i1", name: "Salary", amount: 50000, dueDate: "2026-06-01T00:00:00.000Z", recurring: true });
      
      let inc = await Store.getIncomeSources();
      expect(inc.length).toBe(1);
      
      await Store.deleteIncomeSource("i1");
      inc = await Store.getIncomeSources();
      expect(inc.length).toBe(0);
    });
  });

  describe("AI Actions (executeAction)", () => {
    test("log_expense reduces balance", async () => {
      await Store.setProfile({
        name: "Test", monthlyIncome: 50000, monthlyBudget: 0, balance: 50000,
        savingsGoal: 10000, bigGoal: "saving", topCategories: [],
        topCategory: "food", notifications: true,
      });
      
      const result = await Store.executeAction("log_expense", { amount: 500, category: "food", note: "Pizza" });
      expect(result).toContain("500");
      
      const p = await Store.getProfile();
      expect(p.balance).toBe(49500);
      
      const expenses = await Store.getExpenses();
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(500);
    });

    test("update_balance sets new balance", async () => {
      await Store.setProfile({
        name: "Test", monthlyIncome: 50000, monthlyBudget: 0, balance: 50000,
        savingsGoal: 10000, bigGoal: "saving", topCategories: [],
        topCategory: "food", notifications: true,
      });
      
      await Store.executeAction("update_balance", { amount: 30000 });
      const p = await Store.getProfile();
      expect(p.balance).toBe(30000);
    });

    test("add_wish creates a wish", async () => {
      await Store.executeAction("add_wish", { name: "iPad", price: 45000 });
      const wishes = await Store.getWishes();
      expect(wishes.length).toBe(1);
      expect(wishes[0].name).toBe("iPad");
      expect(wishes[0].saved).toBe(0);
    });

    test("unknown action returns null", async () => {
      const result = await Store.executeAction("unknown_action", {});
      expect(result).toBeNull();
    });
  });

  describe("getSummary", () => {
    test("returns correct summary", async () => {
      await Store.setProfile({
        name: "Test", monthlyIncome: 50000, monthlyBudget: 0, balance: 45000,
        savingsGoal: 10000, bigGoal: "travel", topCategories: ["food"],
        topCategory: "food", notifications: true,
      });
      await Store.addSubscription({ id: "s1", name: "Netflix", icon: "film", amount: 649, renewalDate: "2026-06-01", active: true });
      await Store.addBill({ id: "b1", name: "Wifi", amount: 999, dueDate: "2026-06-01", paid: false, recurring: true });
      await Store.addExpense({ id: "e1", amount: 500, category: "food", note: "Lunch", date: new Date().toISOString() });
      
      const summary = await Store.getSummary();
      expect(summary.name).toBe("Test");
      expect(summary.monthlyIncome).toBe(50000);
      expect(summary.balance).toBe(45000);
      expect(summary.totalSubscriptions).toBe(649);
      expect(summary.unpaidBills).toBe(999);
      expect(summary.totalExpensesLogged).toBe(500);
    });
  });

  describe("clearAll", () => {
    test("clears all data", async () => {
      await Store.setProfile({
        name: "Test", monthlyIncome: 50000, monthlyBudget: 0, balance: 50000,
        savingsGoal: 10000, bigGoal: "saving", topCategories: [],
        topCategory: "food", notifications: true,
      });
      await Store.addExpense({ id: "1", amount: 500, category: "food", note: "test", date: new Date().toISOString() });
      
      await Store.clearAll();
      
      const p = await Store.getProfile();
      expect(p.name).toBe("Friend"); // back to default
      const e = await Store.getExpenses();
      expect(e).toEqual([]);
    });
  });
});

describe("Auth", () => {
  beforeEach(clearAll);

  test("register creates new account", async () => {
    const res = await Auth.register("Test User", "test@test.com", "password123");
    expect(res.ok).toBe(true);
    
    const creds = await Auth.getCredentials();
    expect(creds.length).toBe(1);
    expect(creds[0].name).toBe("Test User");
    expect(creds[0].email).toBe("test@test.com");
    expect(creds[0].passwordHash).toBeTruthy();
    expect(creds[0].passwordHash).not.toBe("password123"); // hashed, not plaintext
  });

  test("register rejects duplicate email", async () => {
    await Auth.register("User 1", "test@test.com", "pass1");
    const res = await Auth.register("User 2", "test@test.com", "pass2");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("already exists");
  });

  test("register is case-insensitive for email", async () => {
    await Auth.register("User 1", "Test@Test.com", "pass1");
    const res = await Auth.register("User 2", "test@test.com", "pass2");
    expect(res.ok).toBe(false);
  });

  test("login succeeds with correct credentials", async () => {
    await Auth.register("Test User", "test@test.com", "password123");
    const res = await Auth.login("test@test.com", "password123");
    expect(res.ok).toBe(true);
    expect(res.name).toBe("Test User");
  });

  test("login fails with wrong password", async () => {
    await Auth.register("Test User", "test@test.com", "password123");
    const res = await Auth.login("test@test.com", "wrongpassword");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Wrong password");
  });

  test("login fails for non-existent email", async () => {
    const res = await Auth.login("nobody@test.com", "password123");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("No account found");
  });

  test("login is case-insensitive for email", async () => {
    await Auth.register("Test User", "test@test.com", "password123");
    const res = await Auth.login("TEST@TEST.COM", "password123");
    expect(res.ok).toBe(true);
  });

  test("hash is deterministic (same input = same output)", async () => {
    const hash1 = await Auth._hash("testpassword");
    const hash2 = await Auth._hash("testpassword");
    expect(hash1).toBe(hash2);
  });

  test("hash differs for different inputs", async () => {
    const hash1 = await Auth._hash("password1");
    const hash2 = await Auth._hash("password2");
    expect(hash1).not.toBe(hash2);
  });

  test("multiple accounts can coexist", async () => {
    await Auth.register("User A", "a@test.com", "passA");
    await Auth.register("User B", "b@test.com", "passB");
    
    const creds = await Auth.getCredentials();
    expect(creds.length).toBe(2);
    
    const resA = await Auth.login("a@test.com", "passA");
    expect(resA.ok).toBe(true);
    expect(resA.name).toBe("User A");
    
    const resB = await Auth.login("b@test.com", "passB");
    expect(resB.ok).toBe(true);
    expect(resB.name).toBe("User B");
    
    // Cross-login should fail
    const cross = await Auth.login("a@test.com", "passB");
    expect(cross.ok).toBe(false);
  });
});

describe("Helpers", () => {
  describe("formatINR", () => {
    test("formats basic amounts", () => {
      expect(formatINR(0)).toBe("₹0.00");
      expect(formatINR(1000)).toMatch(/₹1,000\.00/);
      expect(formatINR(100000)).toMatch(/₹1,00,000\.00/);
    });

    test("formats decimal amounts", () => {
      expect(formatINR(999.99)).toMatch(/₹999\.99/);
    });

    test("handles negative amounts", () => {
      const result = formatINR(-500);
      expect(result).toContain("500");
    });

    test("handles very large amounts (Indian formatting)", () => {
      const result = formatINR(10000000);
      expect(result).toContain("₹");
      // Indian format: 1,00,00,000
      expect(result).toMatch(/1,00,00,000/);
    });
  });

  describe("daysUntil", () => {
    test("returns positive for future dates", () => {
      const future = new Date(Date.now() + 5 * 86400000).toISOString();
      const days = daysUntil(future);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    test("returns negative for past dates", () => {
      const past = new Date(Date.now() - 3 * 86400000).toISOString();
      const days = daysUntil(past);
      expect(days).toBeLessThan(0);
    });

    test("returns 0 or 1 for today", () => {
      const today = new Date().toISOString();
      const days = daysUntil(today);
      expect(days).toBeGreaterThanOrEqual(0);
      expect(days).toBeLessThanOrEqual(1);
    });
  });

  describe("shortDate", () => {
    test("formats date correctly", () => {
      const result = shortDate("2026-06-15T00:00:00.000Z");
      expect(result).toContain("Jun");
      expect(result).toContain("15");
    });
  });
});

describe("Edge Cases & Division-by-Zero Guards", () => {
  beforeEach(clearAll);

  test("zero monthly income does not crash formatINR", () => {
    expect(() => formatINR(0)).not.toThrow();
  });

  test("expense with 0 amount", async () => {
    await Store.setProfile({
      name: "Test", monthlyIncome: 50000, monthlyBudget: 0, balance: 50000,
      savingsGoal: 0, bigGoal: "saving", topCategories: [],
      topCategory: "food", notifications: true,
    });
    
    // This tests that the executeAction doesn't crash with edge values
    const result = await Store.executeAction("log_expense", { amount: 0 });
    // Amount 0 should still work (no crash)
    expect(result).toBeTruthy();
  });

  test("balance never goes below 0 in manual expense", async () => {
    await Store.setProfile({
      name: "Test", monthlyIncome: 1000, monthlyBudget: 0, balance: 500,
      savingsGoal: 0, bigGoal: "saving", topCategories: [],
      topCategory: "food", notifications: true,
    });
    
    await Store.executeAction("log_expense", { amount: 1000 });
    const p = await Store.getProfile();
    // Balance is now floored at 0 (bug fix: no negative balance)
    expect(p.balance).toBe(0);
  });

  test("summary works with empty data", async () => {
    const summary = await Store.getSummary();
    expect(summary.monthlyIncome).toBe(0);
    expect(summary.balance).toBe(0);
    expect(summary.totalSubscriptions).toBe(0);
    expect(summary.unpaidBills).toBe(0);
    expect(summary.totalExpensesLogged).toBe(0);
    expect(summary.wishes).toEqual([]);
  });

  test("corrupted storage returns defaults gracefully", async () => {
    // Simulate corrupted data
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    await AsyncStorage.setItem("finny:profile", "not-valid-json{{{");
    
    // Should return default, not crash
    const p = await Store.getProfile();
    expect(p.name).toBe("Friend");
  });
});
