/**
 * Finny local data store — AsyncStorage backed
 * All monetary values in INR (₹)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Simple event emitter for cross-tab data sync ─────────────────────────────

type Listener = () => void;
const _listeners: Set<Listener> = new Set();
let _version = 0;
export const DataEvents = {
  subscribe: (fn: Listener) => { _listeners.add(fn); return () => { _listeners.delete(fn); }; },
  emit: () => { _version++; _listeners.forEach((fn) => fn()); },
  get version() { return _version; },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  monthlyBudget: number;     // separate from income — how much user plans to spend
  balance: number;
  savingsGoal: number;
  bigGoal: string;           // "phone" | "travel" | "laptop" | "saving" | "other"
  topCategories: string[];   // up to 3 category ids
  topCategory: string;       // legacy — first of topCategories
  notifications: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  icon: string; // Phosphor icon name hint (e.g. "film", "music", "cloud")
  amount: number;
  renewalDate: string; // ISO date
  active: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date
  paid: boolean;
  recurring: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date
}

export interface Wish {
  id: string;
  name: string;
  price: number;
  saved: number;
  createdAt: string;
  imageUri?: string;       // local image URI from gallery
  notes?: string;          // user notes or AI-generated insights
  priority?: number;       // 1 = highest, used for buy order
  url?: string;            // product URL for price tracking
}

export interface IncomeSource {
  id: string;
  name: string;       // e.g. "Upwork", "Salary", "Freelance"
  amount: number;
  dueDate: string;    // ISO date — when the payment is expected
  recurring: boolean;
}

export interface AppData {
  profile: UserProfile;
  subscriptions: Subscription[];
  bills: Bill[];
  expenses: Expense[];
  wishes: Wish[];
  incomeSources: IncomeSource[];
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  profile: "finny:profile",
  subscriptions: "finny:subscriptions",
  bills: "finny:bills",
  expenses: "finny:expenses",
  wishes: "finny:wishes",
  incomeSources: "finny:incomeSources",
  credentials: "finny:credentials",  // { name, passwordHash }[]
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultProfile: UserProfile = {
  name: "Friend",
  monthlyIncome: 0,
  monthlyBudget: 0,
  balance: 0,
  savingsGoal: 0,
  bigGoal: "saving",
  topCategories: [],
  topCategory: "food",
  notifications: true,
};

const defaultSubscriptions: Subscription[] = [];

const defaultBills: Bill[] = [];

const defaultExpenses: Expense[] = [];

const defaultIncomeSources: IncomeSource[] = [];

const defaultWishes: Wish[] = [];

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const Store = {
  // Profile — merge with defaults so old profiles get new fields (e.g. monthlyBudget)
  getProfile: async () => {
    const stored = await get(KEYS.profile, defaultProfile);
    return { ...defaultProfile, ...stored };
  },
  setProfile: async (p: UserProfile) => { await set(KEYS.profile, p); DataEvents.emit(); },

  // Subscriptions
  getSubscriptions: () => get(KEYS.subscriptions, defaultSubscriptions),
  setSubscriptions: (s: Subscription[]) => set(KEYS.subscriptions, s),
  addSubscription: async (s: Subscription) => {
    const all = await Store.getSubscriptions();
    await Store.setSubscriptions([...all, s]);
    DataEvents.emit();
  },
  deleteSubscription: async (id: string) => {
    const all = await Store.getSubscriptions();
    await Store.setSubscriptions(all.filter((s) => s.id !== id));
    DataEvents.emit();
  },
  toggleSubscription: async (id: string) => {
    const all = await Store.getSubscriptions();
    await Store.setSubscriptions(all.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    DataEvents.emit();
  },

  // Bills
  getBills: () => get(KEYS.bills, defaultBills),
  setBills: (b: Bill[]) => set(KEYS.bills, b),
  addBill: async (b: Bill) => {
    const all = await Store.getBills();
    await Store.setBills([...all, b]);
    DataEvents.emit();
  },
  deleteBill: async (id: string) => {
    const all = await Store.getBills();
    await Store.setBills(all.filter((b) => b.id !== id));
    DataEvents.emit();
  },
  toggleBillPaid: async (id: string) => {
    const all = await Store.getBills();
    await Store.setBills(all.map((b) => b.id === id ? { ...b, paid: !b.paid } : b));
    DataEvents.emit();
  },

  // Expenses
  getExpenses: () => get(KEYS.expenses, defaultExpenses),
  addExpense: async (e: Expense) => {
    const all = await Store.getExpenses();
    await set(KEYS.expenses, [e, ...all]);
    DataEvents.emit();
  },

  // Income Sources
  getIncomeSources: () => get(KEYS.incomeSources, defaultIncomeSources),
  setIncomeSources: (s: IncomeSource[]) => set(KEYS.incomeSources, s),
  addIncomeSource: async (s: IncomeSource) => {
    const all = await Store.getIncomeSources();
    await Store.setIncomeSources([...all, s]);
    DataEvents.emit();
  },
  deleteIncomeSource: async (id: string) => {
    const all = await Store.getIncomeSources();
    await Store.setIncomeSources(all.filter((s) => s.id !== id));
    DataEvents.emit();
  },

  // Wishes
  getWishes: () => get(KEYS.wishes, defaultWishes),
  setWishes: (w: Wish[]) => set(KEYS.wishes, w),
  addWish: async (w: Wish) => {
    const all = await Store.getWishes();
    await Store.setWishes([...all, w]);
    DataEvents.emit();
  },
  deleteWish: async (id: string) => {
    const all = await Store.getWishes();
    await Store.setWishes(all.filter((w) => w.id !== id));
    DataEvents.emit();
  },

  // Clear all data (logout)
  clearAll: async () => {
    await AsyncStorage.clear();
  },

  // Summary for AI
  getSummary: async () => {
    const [profile, subscriptions, bills, expenses, wishes] = await Promise.all([
      Store.getProfile(),
      Store.getSubscriptions(),
      Store.getBills(),
      Store.getExpenses(),
      Store.getWishes(),
    ]);
    const totalSubSpend = subscriptions.filter((s) => s.active).reduce((a, s) => a + s.amount, 0);
    const unpaidBills = bills.filter((b) => !b.paid);
    const totalUnpaid = unpaidBills.reduce((a, b) => a + b.amount, 0);
    const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
    return {
      name: profile.name,
      monthlyIncome: profile.monthlyIncome,
      monthlyBudget: profile.monthlyBudget,
      balance: profile.balance,
      totalSubscriptions: totalSubSpend,
      unpaidBills: totalUnpaid,
      totalExpensesLogged: totalExpenses,
      wishes: wishes.map((w) => ({ name: w.name, price: w.price, saved: w.saved })),
    };
  },

  // ─── Category normalizer (mirrors spends.tsx) ─────────────────────────
  _normalizeCat(raw: string): string {
    const VALID = ["food","shopping","transport","bills","subscription","health","entertainment","education","others"];
    const ALIASES: Record<string, string> = {
      other:"others",misc:"others",miscellaneous:"others",
      grocery:"food",groceries:"food",dining:"food",restaurant:"food",
      travel:"transport",commute:"transport",cab:"transport",taxi:"transport",fuel:"transport",
      rent:"bills",utilities:"bills",utility:"bills",electricity:"bills",wifi:"bills",internet:"bills",phone:"bills",
      gym:"health",medical:"health",medicine:"health",
      movie:"entertainment",movies:"entertainment",gaming:"entertainment",games:"entertainment",music:"entertainment",
      streaming:"subscription",subscriptions:"subscription",
      course:"education",courses:"education",tuition:"education",books:"education",
      clothes:"shopping",clothing:"shopping",electronics:"shopping",
    };
    const lower = raw.toLowerCase().trim();
    if (VALID.includes(lower)) return lower;
    return ALIASES[lower] ?? "others";
  },

  // AI action executor
  executeAction: async (action: string, payload: Record<string, any>) => {
    switch (action) {
      case "log_expense": {
        await Store.addExpense({
          id: Date.now().toString(),
          amount: payload.amount,
          category: Store._normalizeCat(payload.category ?? "other"),
          note: payload.note ?? "",
          date: new Date().toISOString(),
        });
        const profile = await Store.getProfile();
        await Store.setProfile({ ...profile, balance: Math.max(0, profile.balance - payload.amount) });
        return `Logged ${payload.amount} for ${payload.category ?? "expense"}.`;
      }
      case "mark_bill_paid": {
        const bills = await Store.getBills();
        const bill = bills.find((b) => b.id === payload.bill_id || b.name.toLowerCase() === (payload.name ?? "").toLowerCase());
        if (bill) {
          await Store.toggleBillPaid(bill.id);
          return `Marked ${bill.name} (${bill.amount}) as paid.`;
        }
        return "Couldn't find that bill.";
      }
      case "update_balance": {
        const profile = await Store.getProfile();
        await Store.setProfile({ ...profile, balance: payload.amount });
        return `Balance updated to ${payload.amount.toLocaleString("en-IN")}.`;
      }
      case "add_wish": {
        await Store.addWish({
          id: Date.now().toString(),
          name: payload.name,
          price: payload.price,
          saved: 0,
          createdAt: new Date().toISOString(),
        });
        return `Added ${payload.name} (${payload.price.toLocaleString("en-IN")}) to your wishes!`;
      }
      case "set_budget": {
        const profile = await Store.getProfile();
        await Store.setProfile({ ...profile, monthlyBudget: payload.amount });
        return `Monthly budget set to \u20B9${payload.amount.toLocaleString("en-IN")}.`;
      }
      default:
        return null;
    }
  },
};

// ─── Auth (name + password, no email) ─────────────────────────────────────────

export interface Credential {
  name: string;
  passwordHash: string;
}

const SESSION_KEY = "finny:session"; // stores active user name

export const Auth = {
  _hash: async (password: string): Promise<string> => {
    const data = password + "finny_salt_2026";
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const buf = await window.crypto.subtle.digest("SHA-256", encoder.encode(data));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    try {
      const { digestStringAsync, CryptoDigestAlgorithm } = await import("expo-crypto");
      return await digestStringAsync(CryptoDigestAlgorithm.SHA256, data);
    } catch {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const chr = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return "simple_" + Math.abs(hash).toString(16);
    }
  },

  getCredentials: () => get<Credential[]>(KEYS.credentials, []),

  /** Create account with name + password */
  register: async (name: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const creds = await Auth.getCredentials();
    const nameLower = name.trim().toLowerCase();
    const exists = creds.find((c) => c.name.toLowerCase() === nameLower);
    if (exists) return { ok: false, error: "Name already taken. Try signing in." };
    if (password.trim().length < 4) return { ok: false, error: "Password must be at least 4 characters." };
    const hash = await Auth._hash(password.trim());
    await set(KEYS.credentials, [...creds, { name: name.trim(), passwordHash: hash }]);
    await AsyncStorage.setItem(SESSION_KEY, name.trim());
    return { ok: true };
  },

  /** Sign in with name + password */
  login: async (name: string, password: string): Promise<{ ok: boolean; error?: string; name?: string }> => {
    const creds = await Auth.getCredentials();
    const nameLower = name.trim().toLowerCase();
    const user = creds.find((c) => c.name.toLowerCase() === nameLower);
    if (!user) return { ok: false, error: "No account found. Create one first." };
    const hash = await Auth._hash(password.trim());
    if (hash !== user.passwordHash) return { ok: false, error: "Wrong password. Try again." };
    await AsyncStorage.setItem(SESSION_KEY, user.name);
    return { ok: true, name: user.name };
  },

  /** Get active session user name (null if not logged in) */
  getSession: async (): Promise<string | null> => {
    return AsyncStorage.getItem(SESSION_KEY);
  },

  /** Clear session on logout */
  logout: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatINR(amount: number): string {
  return "\u20B9" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}



export function daysUntil(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
