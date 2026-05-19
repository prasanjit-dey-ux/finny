import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect, useRef } from "react";
import {
  Plus, Trash, CheckCircle, CircleIcon, X,
  Hamburger, ShoppingBag, Car, House, Television,
  Heartbeat, GameController, GraduationCap, Package,
  CreditCard, Receipt,
} from "phosphor-react-native";
import { Store, DataEvents, formatINR, daysUntil, shortDate, type Subscription, type Bill, type Expense } from "../../lib/store";
import { s, vs, fs, r, br } from "../../lib/responsive";
import { BlueButton } from "../../components/BlueButton";

// ── Brand logo mapping for known subscriptions ──────────────────────────────
const BRAND_DOMAINS: Record<string, string> = {
  netflix: "netflix.com",
  amazon: "amazon.com",
  "amazon prime": "amazon.com",
  "prime video": "amazon.com",
  spotify: "spotify.com",
  youtube: "youtube.com",
  "youtube premium": "youtube.com",
  "youtube music": "youtube.com",
  disney: "disneyplus.com",
  "disney+": "disneyplus.com",
  "disney plus": "disneyplus.com",
  hotstar: "hotstar.com",
  jiocinema: "jiocinema.com",
  "jio cinema": "jiocinema.com",
  apple: "apple.com",
  "apple music": "apple.com",
  "apple tv": "apple.com",
  "apple tv+": "apple.com",
  hbo: "hbomax.com",
  "hbo max": "hbomax.com",
  hulu: "hulu.com",
  notion: "notion.so",
  figma: "figma.com",
  slack: "slack.com",
  zoom: "zoom.us",
  github: "github.com",
  chatgpt: "openai.com",
  openai: "openai.com",
  "chat gpt": "openai.com",
  canva: "canva.com",
  dropbox: "dropbox.com",
  "google one": "one.google.com",
  icloud: "icloud.com",
  "icloud+": "icloud.com",
  linkedin: "linkedin.com",
  "linkedin premium": "linkedin.com",
  "xbox": "xbox.com",
  "xbox game pass": "xbox.com",
  playstation: "playstation.com",
  "ps plus": "playstation.com",
  "nintendo": "nintendo.com",
  twitch: "twitch.tv",
  "amazon music": "music.amazon.com",
  audible: "audible.com",
  kindle: "amazon.com",
  "kindle unlimited": "amazon.com",
  crunchyroll: "crunchyroll.com",
  swiggy: "swiggy.com",
  "swiggy one": "swiggy.com",
  zomato: "zomato.com",
  "zomato gold": "zomato.com",
};

function getBrandLogoUrl(name: string): string | null {
  const lower = name.toLowerCase().trim();
  // Exact match
  if (BRAND_DOMAINS[lower]) return `https://www.google.com/s2/favicons?domain=${BRAND_DOMAINS[lower]}&sz=64`;
  // Partial match
  for (const [key, domain] of Object.entries(BRAND_DOMAINS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
  }
  return null;
}

type MainTab = "overview" | "subscriptions" | "bills";
type TxFilter = "all" | "food" | "shopping" | "transport" | "bills" | "subscription" | "health" | "entertainment" | "education" | "others";

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

/** Normalize AI / user category strings to our canonical CATEGORIES ids */
const CATEGORY_ALIASES: Record<string, string> = {
  other: "others",
  misc: "others",
  miscellaneous: "others",
  grocery: "food",
  groceries: "food",
  dining: "food",
  restaurant: "food",
  travel: "transport",
  commute: "transport",
  cab: "transport",
  taxi: "transport",
  fuel: "transport",
  rent: "bills",
  utilities: "bills",
  utility: "bills",
  electricity: "bills",
  wifi: "bills",
  internet: "bills",
  phone: "bills",
  gym: "health",
  medical: "health",
  medicine: "health",
  movie: "entertainment",
  movies: "entertainment",
  gaming: "entertainment",
  games: "entertainment",
  music: "entertainment",
  streaming: "subscription",
  subscriptions: "subscription",
  course: "education",
  courses: "education",
  tuition: "education",
  books: "education",
  clothes: "shopping",
  clothing: "shopping",
  electronics: "shopping",
};

function normalizeCat(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Direct match
  if (CATEGORIES.some((c) => c.id === lower)) return lower;
  // Alias match
  if (CATEGORY_ALIASES[lower]) return CATEGORY_ALIASES[lower];
  // Fallback
  return "others";
}

function CategoryIcon({ id, size = 18, color = "#fff" }: { id: string; size?: number; color?: string }) {
  const sz = s(size);
  switch (id) {
    case "food": return <Hamburger size={sz} color={color} weight="fill" />;
    case "shopping": return <ShoppingBag size={sz} color={color} weight="fill" />;
    case "transport": return <Car size={sz} color={color} weight="fill" />;
    case "bills": return <House size={sz} color={color} weight="fill" />;
    case "subscription": return <Television size={sz} color={color} weight="fill" />;
    case "health": return <Heartbeat size={sz} color={color} weight="fill" />;
    case "entertainment": return <GameController size={sz} color={color} weight="fill" />;
    case "education": return <GraduationCap size={sz} color={color} weight="fill" />;
    default: return <Package size={sz} color={color} weight="fill" />;
  }
}

/** Brand logo or fallback icon for subscriptions */
function SubIcon({ name }: { name: string }) {
  const logoUrl = getBrandLogoUrl(name);
  if (logoUrl) {
    return (
      <View style={styles.subIconWrap}>
        <Image source={{ uri: logoUrl }} style={styles.subLogo} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={styles.subIconFallback}>
      <Television size={s(20)} color="#fff" weight="fill" />
    </View>
  );
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

export default function SpendsScreen() {
  const [tab, setTab] = useState<MainTab>("overview");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<TxFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", date: "", recurring: true });
  const [modalType, setModalType] = useState<"subscriptions" | "bills">("subscriptions");

  const loadRef = useRef(0);
  const load = useCallback(async () => {
    const ver = ++loadRef.current;
    const [sv, b, e] = await Promise.all([Store.getSubscriptions(), Store.getBills(), Store.getExpenses()]);
    // Only update state if this is still the latest load call (avoids race conditions)
    if (ver === loadRef.current) {
      setSubs(sv); setBills(b); setExpenses(e);
    }
  }, []);

  // Reload on tab focus
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Reload when data changes from other screens (home, AI chat)
  useEffect(() => {
    const unsub = DataEvents.subscribe(() => { load(); });
    return unsub;
  }, [load]);

  // Web fallback: listen for storage events (cross-tab sync) + poll on visibility change
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onStorage = () => { load(); };
    const onVisibility = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const totalMonthly = subs.filter((s) => s.active).reduce((a, s) => a + s.amount, 0)
    + bills.filter((b) => b.recurring).reduce((a, b) => a + b.amount, 0);

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalExpenses = monthExpenses.reduce((a, e) => a + e.amount, 0);

  // Category breakdown
  const catTotals = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses.filter((e) => normalizeCat(e.category) === c.id).reduce((a, e) => a + e.amount, 0),
  })).filter((c) => c.total > 0);

  const filteredExpenses = filter === "all"
    ? expenses
    : expenses.filter((e) => normalizeCat(e.category) === filter);

  const grouped = groupExpensesByDate(filteredExpenses);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.amount.trim() || !form.date.trim()) { Alert.alert("Fill all fields"); return; }
    const amount = parseInt(form.amount);
    if (isNaN(amount) || amount <= 0) { Alert.alert("Invalid amount"); return; }
    let dateIso = "";
    if (form.date.includes("/")) {
      const [d, m, y] = form.date.split("/");
      dateIso = new Date(+y, +m - 1, +d).toISOString();
    } else { dateIso = new Date(form.date).toISOString(); }

    if (modalType === "subscriptions") {
      await Store.addSubscription({ id: Date.now().toString(), name: form.name.trim(), icon: "default", amount, renewalDate: dateIso, active: true });
    } else {
      await Store.addBill({ id: Date.now().toString(), name: form.name.trim(), amount, dueDate: dateIso, paid: false, recurring: form.recurring });
    }
    setShowModal(false);
    setForm({ name: "", amount: "", date: "", recurring: true });
    load();
  };

  const deleteSub = (id: string) =>
    Alert.alert("Delete?", "Remove this subscription?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await Store.deleteSubscription(id); load(); } },
    ]);

  const deleteBill = (id: string) =>
    Alert.alert("Delete?", "Remove this bill?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await Store.deleteBill(id); load(); } },
    ]);

  const openModal = (type: "subscriptions" | "bills") => { setModalType(type); setShowModal(true); };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Spends</Text>
          <Text style={styles.headerSub}>This month: {formatINR(totalExpenses + totalMonthly)}</Text>

          {/* Main tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mainTabRow}>
            {(["overview", "subscriptions", "bills"] as MainTab[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.mainTab, tab === t && styles.mainTabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.mainTabText, tab === t && styles.mainTabTextActive]}>
                  {t === "overview" ? "Overview" : t === "subscriptions" ? "Subscriptions" : "Bills"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            {/* Category breakdown */}
            {catTotals.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Spending Breakdown</Text>
                {/* Stacked bar */}
                <View style={styles.stackedBar}>
                  {catTotals.map((c, i) => (
                    <View
                      key={c.id}
                      style={[
                        styles.stackedSegment,
                        { backgroundColor: c.color, flex: c.total },
                        i === 0 && { borderTopLeftRadius: s(4), borderBottomLeftRadius: s(4) },
                        i === catTotals.length - 1 && { borderTopRightRadius: s(4), borderBottomRightRadius: s(4) },
                      ]}
                    />
                  ))}
                </View>
                {/* Legend */}
                <View style={styles.legendRow}>
                  {catTotals.map((c) => (
                    <View key={c.id} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                      <Text style={styles.legendLabel}>{c.label}</Text>
                      <Text style={styles.legendAmount}>{formatINR(c.total)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
              {([{ id: "all", label: "All" }, ...CATEGORIES] as { id: string; label: string }[]).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, filter === f.id && styles.filterPillActive]}
                  onPress={() => setFilter(f.id as TxFilter)}
                >
                  {f.id !== "all" && (
                    <View style={[styles.filterDot, { backgroundColor: CATEGORIES.find(c => c.id === f.id)?.color || "#9CA3AF" }]} />
                  )}
                  <Text style={[styles.filterPillText, filter === f.id && styles.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grouped expense list */}
            {grouped.length === 0 ? (
              <View style={{ alignItems: "center", paddingHorizontal: s(20), marginTop: vs(30) }}>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={[styles.emptyText, { marginTop: vs(6), fontSize: fs(12), color: "#B0B0B0" }]}>
                  Track your daily spending here. Add expenses from the Home tab or tell Finny what you spent.
                </Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.label}>
                  <Text style={styles.dateGroupLabel}>{group.label}</Text>
                  {group.items.map((e) => {
                    const cat = CATEGORIES.find((c) => c.id === normalizeCat(e.category)) || CATEGORIES[CATEGORIES.length - 1];
                    return (
                      <View key={e.id} style={styles.txRow}>
                        <View style={styles.txIcon}>
                          <CategoryIcon id={cat.id} size={18} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txNote}>{e.note || cat.label}</Text>
                          <Text style={styles.txCat}>{cat.label}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.txAmount}>-{formatINR(e.amount)}</Text>
                          <View style={[styles.txCatDot, { backgroundColor: cat.color }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}

        {/* SUBSCRIPTIONS */}
        {tab === "subscriptions" && (
          <>
            {subs.length === 0 && <Text style={styles.emptyText}>No subscriptions yet.</Text>}
            {subs.map((sub) => {
              const days = daysUntil(sub.renewalDate);
              const expired = days < 0;
              return (
                <View key={sub.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <SubIcon name={sub.name} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{sub.name}</Text>
                      <Text style={styles.cardSub}>
                        {expired ? `Expired ${shortDate(sub.renewalDate)}` : `Renews ${shortDate(sub.renewalDate)}`}
                        {!expired && days <= 7 ? ` - ${days}d left` : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: vs(6) }}>
                      <Text style={styles.cardAmount}>{formatINR(sub.amount)}/mo</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, sub.active && !expired ? styles.badgeActive : styles.badgeExpired]}>
                          <Text style={[styles.badgeText, sub.active && !expired ? styles.badgeTextActive : styles.badgeTextExpired]}>
                            {sub.active && !expired ? "Active" : "Expired"}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteSub(sub.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Trash size={s(14)} color="#F87171" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={styles.addCard} onPress={() => openModal("subscriptions")}>
              <Plus size={s(18)} color="#268FFF" />
              <Text style={styles.addCardText}>Add Subscription</Text>
            </TouchableOpacity>
          </>
        )}

        {/* BILLS */}
        {tab === "bills" && (
          <>
            {bills.length === 0 && <Text style={styles.emptyText}>No bills yet.</Text>}
            {bills.map((b) => {
              const days = daysUntil(b.dueDate);
              const overdue = !b.paid && days < 0;
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <TouchableOpacity onPress={async () => { await Store.toggleBillPaid(b.id); load(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {b.paid
                        ? <CheckCircle size={s(26)} color="#22C55E" weight="fill" />
                        : <CircleIcon size={s(26)} color={overdue ? "#F87171" : "#94A3B8"} />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardName, b.paid && styles.cardNamePaid]}>{b.name}</Text>
                      <Text style={[styles.cardSub, overdue && { color: "#F87171" }]}>
                        {b.paid ? "Paid" : overdue ? `Overdue ${Math.abs(days)}d` : `Due ${shortDate(b.dueDate)}`}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: vs(4) }}>
                      <Text style={styles.cardAmount}>{formatINR(b.amount)}</Text>
                      <TouchableOpacity onPress={() => deleteBill(b.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash size={s(14)} color="#F87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={styles.addCard} onPress={() => openModal("bills")}>
              <Plus size={s(18)} color="#268FFF" />
              <Text style={styles.addCardText}>Add Bill</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: vs(80) }} />
      </ScrollView>

      {/* FAB */}
      {tab !== "overview" && (
        <TouchableOpacity style={styles.fab} onPress={() => openModal(tab)} activeOpacity={0.85}>
          <LinearGradient colors={["#8DDBFF", "#268FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
            <Plus size={s(24)} color="#fff" weight="bold" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {modalType === "subscriptions" ? "Subscription" : "Bill"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={s(22)} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder={modalType === "subscriptions" ? "e.g. Netflix" : "e.g. Electricity"} placeholderTextColor="#94A3B8" />

            <Text style={styles.label}>Amount ({"\u20B9"})</Text>
            <TextInput style={styles.input} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })}
              placeholder="e.g. 15" placeholderTextColor="#94A3B8" keyboardType="numeric" />

            <Text style={styles.label}>{modalType === "subscriptions" ? "Renewal Date" : "Due Date"} (dd/mm/yyyy)</Text>
            <TextInput style={styles.input} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })}
              placeholder="e.g. 30/05/2026" placeholderTextColor="#94A3B8" keyboardType="numbers-and-punctuation" />

            {modalType === "bills" && (
              <TouchableOpacity style={styles.recurringRow} onPress={() => setForm({ ...form, recurring: !form.recurring })}>
                {form.recurring ? <CheckCircle size={s(22)} color="#268FFF" weight="fill" /> : <CircleIcon size={s(22)} color="#94A3B8" />}
                <Text style={styles.recurringLabel}>Recurring monthly</Text>
              </TouchableOpacity>
            )}

            <BlueButton label="Add" onPress={handleAdd} style={{ marginTop: vs(4) }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    paddingBottom: vs(4),
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(22),
    color: "#18181B",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#9CA3AF",
    marginTop: vs(2),
    marginBottom: vs(12),
  },

  mainTabRow: { gap: s(6), paddingBottom: vs(10) },
  mainTab: {
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    borderRadius: br.pill,
    backgroundColor: "#F4F4F5",
  },
  mainTabActive: { backgroundColor: "#18181B" },
  mainTabText: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(13), color: "#6B7280" },
  mainTabTextActive: { color: "#FFFFFF" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: s(20), paddingTop: vs(8) },

  card: {
    backgroundColor: "#F4F4F5",
    borderRadius: s(16),
    padding: s(14),
    marginBottom: vs(10),
  },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), color: "#18181B", marginBottom: vs(12) },
  cardRow: { flexDirection: "row", alignItems: "center", gap: s(12) },
  // Brand logo subscription icon
  subIconWrap: {
    width: s(44),
    height: s(44),
    borderRadius: s(12),
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  subLogo: {
    width: s(28),
    height: s(28),
    borderRadius: s(4),
  },
  subIconFallback: {
    width: s(44),
    height: s(44),
    borderRadius: s(12),
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(14), color: "#18181B" },
  cardNamePaid: { color: "#94A3B8", textDecorationLine: "line-through" },
  cardSub: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(11), color: "#94A3B8", marginTop: vs(2) },
  cardAmount: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), color: "#18181B" },

  badgeRow: { flexDirection: "row", alignItems: "center", gap: s(8) },
  badge: { paddingHorizontal: s(7), paddingVertical: vs(2), borderRadius: s(6) },
  badgeActive: { backgroundColor: "#DCFCE7" },
  badgeExpired: { backgroundColor: "#FEE2E2" },
  badgeText: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(10) },
  badgeTextActive: { color: "#16A34A" },
  badgeTextExpired: { color: "#DC2626" },

  // Stacked bar
  stackedBar: { flexDirection: "row", height: vs(24), borderRadius: s(8), overflow: "hidden", marginBottom: vs(14), gap: s(2) },
  stackedSegment: { height: "100%" },
  legendRow: { gap: vs(8) },
  legendItem: { flexDirection: "row", alignItems: "center", gap: s(8) },
  legendDot: { width: s(8), height: s(8), borderRadius: s(4) },
  legendLabel: { fontFamily: "InstrumentSans_500Medium", fontSize: fs(12), color: "#6B7280", flex: 1 },
  legendAmount: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: "#18181B" },

  // Filter pills
  filterScroll: { marginBottom: vs(12) },
  filterRow: { gap: s(6), paddingRight: s(20) },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    backgroundColor: "#F4F4F5",
    borderRadius: br.pill,
  },
  filterPillActive: { backgroundColor: "#18181B" },
  filterDot: { width: s(6), height: s(6), borderRadius: s(3) },
  filterPillText: { fontFamily: "InstrumentSans_500Medium", fontSize: fs(12), color: "#6B7280" },
  filterPillTextActive: { color: "#fff", fontFamily: "InstrumentSans_600SemiBold" },

  // Date group + transaction rows
  dateGroupLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13), color: "#18181B", marginBottom: vs(8), marginTop: vs(6) },
  txRow: {
    flexDirection: "row", alignItems: "center", gap: s(12),
    backgroundColor: "#F4F4F5", borderRadius: s(14),
    paddingHorizontal: s(12), paddingVertical: vs(10),
    marginBottom: vs(6),
  },
  txIcon: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  txNote: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(13), color: "#18181B" },
  txCat: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(11), color: "#94A3B8", marginTop: vs(1) },
  txAmount: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13), color: "#18181B" },
  txCatDot: { width: s(6), height: s(6), borderRadius: s(3), marginTop: vs(4) },

  emptyText: { fontFamily: "InstrumentSans_400Regular", textAlign: "center", color: "#94A3B8", marginTop: vs(40), fontSize: fs(14) },

  addCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: s(8), padding: s(14),
    borderRadius: s(16), borderWidth: 1, borderColor: "#E5E5E5", borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
    marginTop: vs(6),
  },
  addCardText: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(14), color: "#268FFF" },

  fab: {
    position: "absolute", bottom: vs(24), right: s(20),
    borderRadius: s(28),
    shadowColor: "#268FFF", shadowOffset: { width: 0, height: s(4) }, shadowOpacity: 0.35, shadowRadius: s(10), elevation: 8,
  },
  fabGrad: { width: s(54), height: s(54), borderRadius: s(27), alignItems: "center", justifyContent: "center" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: s(20), borderTopRightRadius: s(20), padding: s(20), paddingBottom: vs(36) },
  sheetHandle: { width: s(40), height: vs(4), borderRadius: s(2), backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: vs(16) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(16) },
  modalTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(17), color: "#18181B" },
  label: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(12), color: "#6B7280", marginBottom: vs(6) },
  input: {
    fontFamily: "InstrumentSans_400Regular",
    backgroundColor: "#F4F4F5",
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    fontSize: fs(14),
    color: "#18181B",
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  recurringRow: { flexDirection: "row", alignItems: "center", gap: s(10), marginBottom: vs(14) },
  recurringLabel: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(14), color: "#18181B" },
});
