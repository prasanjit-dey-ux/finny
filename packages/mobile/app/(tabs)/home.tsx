import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState, useEffect, useRef } from "react";
import {
  ArrowUp, ArrowDown, Bell, Eye, EyeSlash,
  WifiHigh, Lightning, DeviceMobile,
  X, Backspace, User, SignOut, Plus, CalendarBlank,
} from "phosphor-react-native";
import { Store, DataEvents, formatINR, daysUntil, shortDate, type UserProfile, type Bill, type Subscription, type Expense, type IncomeSource } from "../../lib/store";
import { s, vs, fs, r, br, sw } from "../../lib/responsive";
const logo = require("../../assets/images/logo.png");
import { BlueButton } from "../../components/BlueButton";
import { NotificationCenter, useNotificationCount } from "../../components/NotificationCenter";

const CATEGORIES = [
  { id: "food", label: "Food", color: "#F59E0B" },
  { id: "shopping", label: "Shopping", color: "#3B82F6" },
  { id: "subscription", label: "Subscription", color: "#8B5CF6" },
  { id: "bills", label: "Bills", color: "#268FFF" },
  { id: "transport", label: "Transport", color: "#6B7280" },
  { id: "education", label: "Education", color: "#EC4899" },
  { id: "health", label: "Health", color: "#10B981" },
  { id: "entertainment", label: "Entertainment", color: "#F97316" },
  { id: "others", label: "Others", color: "#9CA3AF" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Add Transaction Sheet ────────────────────────────────────────────────────

type TxType = "expense" | "income";

function AddTransactionSheet({
  visible,
  profile,
  onClose,
  onDone,
}: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");

  const sheetBudget = profile ? (profile.monthlyBudget > 0 ? profile.monthlyBudget : profile.monthlyIncome) : 0;
  const budgetUsed = sheetBudget > 0 ? Math.max(0, ((sheetBudget - (profile?.balance ?? 0)) / sheetBudget) * 100) : 0;
  const showBudgetAlert = type === "expense" && budgetUsed > 70;

  const press = (key: string) => {
    if (key === "⌫") { setAmount((p) => p.slice(0, -1)); return; }
    if (key === "." && amount.includes(".")) return;
    if (amount.length >= 9) return;
    setAmount((p) => p + key);
  };

  const handleAdd = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert("Enter an amount"); return; }
    if (type === "expense") {
      await Store.addExpense({
        id: Date.now().toString(),
        amount: num,
        category,
        note: note || CATEGORIES.find((c) => c.id === category)?.label || "Expense",
        date: new Date().toISOString(),
      });
      const p = await Store.getProfile();
      if (p) await Store.setProfile({ ...p, balance: Math.max(0, p.balance - num) });
    } else {
      const p = await Store.getProfile();
      if (p) await Store.setProfile({ ...p, balance: p.balance + num, monthlyIncome: p.monthlyIncome });
    }
    setAmount("");
    setNote("");
    onDone();
    onClose();
  };

  const numpad = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [".", "0", "⌫"]];
  const selectedCat = CATEGORIES.find((c) => c.id === category)!;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={st.sheetBg} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={st.sheet}>
          <View style={st.sheetHandle} />

          <View style={st.sheetHeader}>
            <Text style={st.sheetTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={s(22)} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={st.typeToggle}>
            {(["expense", "income"] as TxType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[st.typeBtn, type === t && st.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[st.typeText, type === t && st.typeTextActive]}>
                  {t === "expense" ? "Expense" : "Income"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showBudgetAlert && (
            <View style={st.budgetAlert}>
              <Text style={st.budgetAlertText}>You've used {budgetUsed.toFixed(0)}% of this month's budget</Text>
            </View>
          )}

          <View style={st.amountDisplay}>
            <Text style={st.amountLabel}>Amount</Text>
            <Text style={st.amountValue}>{"\u20B9"}{amount || "0"}</Text>
          </View>

          {type === "expense" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll} contentContainerStyle={st.catScrollInner}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[st.catChip, category === c.id && { backgroundColor: c.color + "22", borderColor: c.color }]}
                  onPress={() => setCategory(c.id)}
                >
                  <View style={[st.catDot, { backgroundColor: c.color }]} />
                  <Text style={[st.catLabel, category === c.id && { color: c.color, fontFamily: "InstrumentSans_600SemiBold" }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={st.numpad}>
            {numpad.map((row, ri) => (
              <View key={ri} style={st.numpadRow}>
                {row.map((k) => (
                  <TouchableOpacity key={k} style={st.numKey} onPress={() => press(k)} activeOpacity={0.7}>
                    {k === "⌫" ? (
                      <Backspace size={s(22)} color="#1A1A2E" />
                    ) : (
                      <Text style={st.numKeyText}>{k}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <BlueButton
            label={type === "expense" ? `Add Expense` : "Add Income"}
            onPress={handleAdd}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Payment Sheet ────────────────────────────────────────────────────────

function AddPaymentSheet({
  visible, onClose, onDone,
}: { visible: boolean; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [daysFromNow, setDaysFromNow] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert("Enter a name (e.g. Salary, Upwork)"); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert("Enter a valid amount"); return; }
    const days = parseInt(daysFromNow) || 0;
    const due = new Date(Date.now() + days * 86400000).toISOString();
    await Store.addIncomeSource({
      id: Date.now().toString(),
      name: name.trim(),
      amount: num,
      dueDate: due,
      recurring: false,
    });
    setName(""); setAmount(""); setDaysFromNow("");
    onDone(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={st.sheetBg} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={st.sheet}>
          <View style={st.sheetHandle} />
          <View style={st.sheetHeader}>
            <Text style={st.sheetTitle}>Add Payment</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={s(22)} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={st.fieldLabel}>Source name</Text>
          <TextInput
            style={st.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Salary, Upwork, Freelance"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={st.fieldLabel}>Amount ({"\u20B9"})</Text>
          <TextInput
            style={st.fieldInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          <Text style={st.fieldLabel}>Due in (days from today)</Text>
          <TextInput
            style={st.fieldInput}
            value={daysFromNow}
            onChangeText={setDaysFromNow}
            placeholder="e.g. 7"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          <BlueButton label="Add Payment" onPress={handleAdd} style={{ marginTop: vs(8) }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Add Bill Sheet ───────────────────────────────────────────────────────────

function AddBillSheet({
  visible, onClose, onDone,
}: { visible: boolean; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [daysFromNow, setDaysFromNow] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert("Enter a bill name (e.g. Wifi, Electricity)"); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert("Enter a valid amount"); return; }
    const days = parseInt(daysFromNow) || 0;
    const due = new Date(Date.now() + days * 86400000).toISOString();
    await Store.addBill({
      id: Date.now().toString(),
      name: name.trim(),
      amount: num,
      dueDate: due,
      paid: false,
      recurring: true,
    });
    setName(""); setAmount(""); setDaysFromNow("");
    onDone(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={st.sheetBg} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={st.sheet}>
          <View style={st.sheetHandle} />
          <View style={st.sheetHeader}>
            <Text style={st.sheetTitle}>Add Bill</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={s(22)} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={st.fieldLabel}>Bill name</Text>
          <TextInput
            style={st.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Wifi, Electricity, Mobile Recharge"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={st.fieldLabel}>Amount (₹)</Text>
          <TextInput
            style={st.fieldInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          <Text style={st.fieldLabel}>Due in (days from today)</Text>
          <TextInput
            style={st.fieldInput}
            value={daysFromNow}
            onChangeText={setDaysFromNow}
            placeholder="e.g. 7"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />

          <BlueButton label="Add Bill" onPress={handleAdd} style={{ marginTop: vs(8) }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Bill icon helper ─────────────────────────────────────────────────────────

function BillIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const iconSize = s(20);
  const color = "#fff";
  if (n.includes("wifi") || n.includes("internet")) return <WifiHigh size={iconSize} color={color} weight="fill" />;
  if (n.includes("electr") || n.includes("power")) return <Lightning size={iconSize} color={color} weight="fill" />;
  if (n.includes("mobile") || n.includes("recharge") || n.includes("phone")) return <DeviceMobile size={iconSize} color={color} weight="fill" />;
  return <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: fs(13), color: "#fff" }}>{name.slice(0, 2).toUpperCase()}</Text>;
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { count: notifCount, refresh: refreshNotifCount } = useNotificationCount();

  const loadRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const ver = ++loadRef.current;
    const [p, b, inc, e] = await Promise.all([Store.getProfile(), Store.getBills(), Store.getIncomeSources(), Store.getExpenses()]);
    if (ver === loadRef.current) {
      setProfile(p); setBills(b); setIncomeSources(inc); setExpenses(e);
    }
  }, []);

  // Debounced load for DataEvents (setProfile + addExpense both emit)
  const debouncedLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(), 50);
  }, [load]);

  useFocusEffect(useCallback(() => { load(); refreshNotifCount(); }, [load]));
  useEffect(() => {
    const unsub = DataEvents.subscribe(debouncedLoad);
    return () => { unsub(); if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [debouncedLoad]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!profile) return <View style={st.container} />;

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthSpend = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const budget = profile.monthlyBudget > 0 ? profile.monthlyBudget : profile.monthlyIncome;
  const budgetPct = budget > 0 ? Math.min(Math.max((monthSpend / budget) * 100, 0), 100) : 0;

  // Separate upcoming income and bills
  const upcomingIncome = incomeSources
    .filter((inc) => daysUntil(inc.dueDate) >= 0 && daysUntil(inc.dueDate) <= 30)
    .map((inc) => ({ name: inc.name, amount: inc.amount, days: daysUntil(inc.dueDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const upcomingBills = bills
    .filter((b) => !b.paid && daysUntil(b.dueDate) >= 0 && daysUntil(b.dueDate) <= 30)
    .map((b) => ({ name: b.name, amount: b.amount, days: daysUntil(b.dueDate) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <View style={st.container}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        {/* ── Header ── */}
        <View style={st.header}>
          <View style={st.headerLeft}>
            <Image source={logo} style={st.avatar} />
            <View>
              <Text style={st.greetingText}>{getGreeting()}</Text>
              <Text style={st.nameText}>{profile.name.includes("@") ? profile.name.split("@")[0] : profile.name.split(" ")[0]}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: s(8) }}>
            <TouchableOpacity style={st.bellBtn} onPress={() => setShowNotifications(true)}>
              <Bell size={s(20)} color="#000" weight="regular" />
              {notifCount > 0 && (
                <View style={st.bellBadge}>
                  <Text style={st.bellBadgeText}>{notifCount > 9 ? "9+" : notifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={st.bellBtn} onPress={() => setShowProfile(true)}>
              <User size={s(20)} color="#000" weight="regular" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#268FFF" />}
      >
        {/* ── Total Balance ── */}
        <View style={st.balanceSection}>
          <View style={st.balanceTopRow}>
            <View style={st.balanceLabelRow}>
              <Text style={st.balanceLabel}>Total Balance</Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {balanceVisible ? <Eye size={s(18)} color="#9CA3AF" /> : <EyeSlash size={s(18)} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>
          </View>
          <Text style={st.balanceAmount}>
            {balanceVisible ? (
              <>
                <Text style={st.balanceWhole}>{"\u20B9"}{Math.floor(profile.balance).toLocaleString("en-IN")}.</Text>
                <Text style={st.balanceCents}>{((profile.balance % 1) * 100).toFixed(0).padStart(2, "0")}</Text>
              </>
            ) : (
              <Text style={st.balanceWhole}>••••••</Text>
            )}
          </Text>
        </View>

        {/* ── Add Transaction Button ── */}
        <BlueButton label="Add Transaction" onPress={() => setShowAdd(true)} style={{ marginBottom: vs(16) }} />

        {/* ── Income / Expense cards ── */}
        <View style={st.statsRow}>
          <View style={st.statCard}>
            <View style={st.statIconWrap}>
              <ArrowUp size={s(20)} color="#fff" weight="bold" />
            </View>
            <Text style={st.statLabel}>Monthly Income</Text>
            <Text style={st.statAmount}>{"\u20B9"}{profile.monthlyIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={st.statCard}>
            <View style={[st.statIconWrap]}>
              <ArrowDown size={s(20)} color="#fff" weight="bold" />
            </View>
            <Text style={st.statLabel}>Monthly Expense</Text>
            <Text style={st.statAmount}>{"\u20B9"}{monthSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* ── Monthly Budget ── */}
        <View style={st.budgetCard}>
          <View style={st.budgetRow}>
            <Text style={st.budgetLabel}>Monthly Budget</Text>
            <Text style={st.budgetValues}>
              <Text style={st.budgetSpent}>{"\u20B9"}{monthSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
              <Text style={st.budgetTotal}>/{"\u20B9"}{budget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            </Text>
          </View>
          <View style={st.budgetTrack}>
            <LinearGradient
              colors={budgetPct > 80 ? ["#F87171", "#EF4444"] : ["#8DDBFF", "#268FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[st.budgetFill, { width: `${Math.max(budgetPct, 2)}%` }]}
            />
          </View>
        </View>

        {/* ── Upcoming Income ── */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Upcoming Income</Text>
          <TouchableOpacity style={st.addSectionBtn} onPress={() => setShowAddPayment(true)}>
            <Plus size={s(14)} color="#2563EB" weight="bold" />
            <Text style={st.viewAll}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={st.paymentsList}>
          {upcomingIncome.length > 0 ? upcomingIncome.map((item, i) => (
            <View key={i} style={st.paymentRow}>
              <View style={st.incomeIcon}>
                <ArrowDown size={s(18)} color="#fff" weight="bold" />
              </View>
              <View style={st.paymentInfo}>
                <Text style={st.paymentName}>{item.name}</Text>
                <Text style={st.paymentDays}>
                  {item.days === 0 ? "Due today" : item.days === 1 ? "Tomorrow" : `${item.days} days left`}
                </Text>
              </View>
              <Text style={st.paymentAmountIncome}>+{"\u20B9"}{item.amount.toLocaleString("en-IN")}</Text>
            </View>
          )) : (
            <Text style={st.emptyText}>No upcoming income</Text>
          )}
        </View>

        {/* ── Upcoming Bills ── */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Upcoming Bills</Text>
          <TouchableOpacity style={st.addSectionBtn} onPress={() => setShowAddBill(true)}>
            <Plus size={s(14)} color="#2563EB" weight="bold" />
            <Text style={st.viewAll}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={st.paymentsList}>
          {upcomingBills.length > 0 ? upcomingBills.map((item, i) => (
            <View key={i} style={st.paymentRow}>
              <View style={st.billIcon}>
                <BillIcon name={item.name} />
              </View>
              <View style={st.paymentInfo}>
                <Text style={st.paymentName}>{item.name}</Text>
                <Text style={st.paymentDays}>
                  {item.days === 0 ? "Due today" : item.days === 1 ? "Tomorrow" : `${item.days} days left`}
                </Text>
              </View>
              <Text style={st.paymentAmountBill}>-{"\u20B9"}{item.amount.toLocaleString("en-IN")}</Text>
            </View>
          )) : (
            <Text style={st.emptyText}>No upcoming bills</Text>
          )}
        </View>

        <View style={{ height: vs(24) }} />
      </ScrollView>

      <AddTransactionSheet
        visible={showAdd}
        profile={profile}
        onClose={() => setShowAdd(false)}
        onDone={load}
      />

      {/* ── Add Payment Sheet ── */}
      <AddPaymentSheet visible={showAddPayment} onClose={() => setShowAddPayment(false)} onDone={load} />

      {/* ── Add Bill Sheet ── */}
      <AddBillSheet visible={showAddBill} onClose={() => setShowAddBill(false)} onDone={load} />

      {/* ── Profile Modal ── */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <TouchableOpacity style={st.profileOverlay} activeOpacity={1} onPress={() => setShowProfile(false)}>
          <View style={st.profileCard}>
            <Image source={logo} style={st.profileAvatar} />
            <Text style={st.profileName}>{profile.name}</Text>
            <Text style={st.profileSub}>Balance: {"\u20B9"}{profile.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            <View style={st.profileDivider} />
            <TouchableOpacity
              style={st.logoutBtn}
              onPress={() => {
                Alert.alert("Logout", "Clear all data and go back to welcome screen?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                      await Store.clearAll();
                      setShowProfile(false);
                      while (router.canGoBack()) router.back();
                      router.replace("/welcome" as any);
                    },
                  },
                ]);
              }}
            >
              <SignOut size={s(18)} color="#EF4444" weight="bold" />
              <Text style={st.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <NotificationCenter
        visible={showNotifications}
        onClose={() => { setShowNotifications(false); refreshNotifCount(); }}
        onSeen={() => refreshNotifCount()}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP = s(10);

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    paddingBottom: vs(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: s(10) },
  avatar: { width: s(40), height: s(40), borderRadius: s(20) },
  greetingText: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: "#000", lineHeight: fs(18) },
  nameText: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: "#71717A", lineHeight: fs(18) },
  bellBtn: {
    width: s(40), height: s(40), borderRadius: s(20),
    backgroundColor: "#E5E5E5",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -vs(2),
    right: -s(2),
    backgroundColor: "#EF4444",
    borderRadius: s(10),
    minWidth: s(18),
    height: s(18),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(4),
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  bellBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(9),
    color: "#FFFFFF",
    lineHeight: fs(12),
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: s(20), paddingTop: vs(4) },

  // Balance
  balanceSection: { marginBottom: vs(16) },
  balanceTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabelRow: { flexDirection: "row", alignItems: "center", gap: s(10) },
  balanceLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: "#9CA3AF", lineHeight: fs(16) },

  balanceAmount: { marginTop: vs(8) },
  balanceWhole: { fontFamily: "Poppins_500Medium", fontSize: fs(34), color: "#000", letterSpacing: -0.5 },
  balanceCents: { fontFamily: "Poppins_500Medium", fontSize: fs(34), color: "#9CA3AF", letterSpacing: -0.5 },



  // Stats row
  statsRow: { flexDirection: "row", gap: CARD_GAP, marginBottom: vs(12) },
  statCard: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    borderRadius: s(16),
    padding: s(14),
    gap: vs(8),
    overflow: "hidden",
  },
  statIconWrap: {
    width: s(38), height: s(38), borderRadius: s(19),
    backgroundColor: "#18181B",
    alignItems: "center", justifyContent: "center",
    marginBottom: vs(6),
  },
  statLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: "#52525B" },
  statAmount: { fontFamily: "Poppins_500Medium", fontSize: fs(18), color: "#18181B", marginTop: vs(2) },

  // But wait — the design shows ArrowUp/Down in WHITE on dark bg
  // Let me fix in the component above: weight="bold" color="#fff"

  // Budget card
  budgetCard: {
    backgroundColor: "#F4F4F5",
    borderRadius: s(16),
    padding: s(14),
    marginBottom: vs(20),
  },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(10) },
  budgetLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: "#52525B" },
  budgetValues: { flexDirection: "row" as any },
  budgetSpent: { fontFamily: "Poppins_400Regular", fontSize: fs(14), color: "#18181B" },
  budgetTotal: { fontFamily: "Poppins_400Regular", fontSize: fs(14), color: "#9CA3AF" },
  budgetTrack: {
    height: vs(14),
    backgroundColor: "#D4D4D8",
    borderRadius: s(7),
    overflow: "hidden",
  },
  budgetFill: { height: vs(14), borderRadius: s(7) },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(14),
  },
  sectionTitle: { fontFamily: "Poppins_500Medium", fontSize: fs(15), color: "#000", letterSpacing: -0.3 },
  addSectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
  },
  viewAll: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: "#2563EB" },

  // Upcoming
  paymentsList: { marginBottom: vs(20), gap: vs(8) },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    padding: s(14),
    borderRadius: s(16),
    backgroundColor: "#F4F4F5",
  },

  // Income icon — dark circle
  incomeIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },
  // Bill icon — dark circle
  billIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentInfo: { flex: 1 },
  paymentName: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: "#18181B" },
  paymentDays: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(11), color: "#6B7280", marginTop: vs(2) },
  paymentAmountIncome: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), color: "#18181B" },
  paymentAmountBill: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), color: "#18181B" },

  emptyText: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(13), color: "#9CA3AF", textAlign: "center", paddingVertical: vs(8) },

  // ── Sheet styles ──
  sheetBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    paddingHorizontal: s(20),
    paddingBottom: vs(32),
  },
  sheetHandle: { width: s(40), height: vs(4), borderRadius: s(2), backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: vs(12), marginBottom: vs(16) },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: vs(16) },
  sheetTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(17), color: "#1A1A2E" },
  typeToggle: { flexDirection: "row", backgroundColor: "#F0F4F8", borderRadius: br.md, padding: s(3), marginBottom: vs(14) },
  typeBtn: { flex: 1, paddingVertical: vs(8), alignItems: "center", borderRadius: br.sm },
  typeBtnActive: { backgroundColor: "#1A1A2E" },
  typeText: { fontFamily: "InstrumentSans_600SemiBold", fontSize: fs(14), color: "#6B7280" },
  typeTextActive: { color: "#fff" },
  budgetAlert: { backgroundColor: "#FEF3C7", borderRadius: br.md, padding: r.sm, marginBottom: vs(10) },
  budgetAlertText: { fontFamily: "InstrumentSans_500Medium", fontSize: fs(12), color: "#92400E" },
  amountDisplay: { alignItems: "center", marginBottom: vs(14) },
  amountLabel: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(12), color: "#6B7280", marginBottom: vs(4) },
  amountValue: { fontFamily: "Poppins_700Bold", fontSize: fs(40), color: "#1A1A2E", letterSpacing: -1 },
  catScroll: { marginBottom: vs(14) },
  catScrollInner: { gap: s(6), paddingRight: r.md },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: s(5),
    paddingHorizontal: s(12), paddingVertical: vs(7),
    backgroundColor: "#F0F4F8", borderRadius: br.pill,
    borderWidth: 1, borderColor: "transparent",
  },
  catDot: { width: s(8), height: s(8), borderRadius: s(4) },
  catLabel: { fontFamily: "InstrumentSans_500Medium", fontSize: fs(12), color: "#6B7280" },
  numpad: { gap: vs(6), marginBottom: vs(14) },
  numpadRow: { flexDirection: "row", gap: s(8) },
  numKey: {
    flex: 1, height: vs(46),
    backgroundColor: "#F0F4F8", borderRadius: br.md,
    alignItems: "center", justifyContent: "center",
  },
  numKeyText: { fontFamily: "Poppins_500Medium", fontSize: fs(20), color: "#1A1A2E" },

  // ── Field styles for Add Payment / Add Bill sheets ──
  fieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(13),
    color: "#52525B",
    marginBottom: vs(6),
    marginTop: vs(12),
  },
  fieldInput: {
    backgroundColor: "#F4F4F5",
    borderRadius: s(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    fontSize: fs(15),
    fontFamily: "InstrumentSans_400Regular",
    color: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  // ── Profile Modal ──
  profileOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    width: s(280),
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(24),
    alignItems: "center",
  },
  profileAvatar: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    marginBottom: vs(12),
  },
  profileName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(18),
    color: "#18181B",
    marginBottom: vs(4),
  },
  profileSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(13),
    color: "#71717A",
    marginBottom: vs(16),
  },
  profileDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
    marginBottom: vs(16),
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
    borderRadius: s(12),
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#EF4444",
  },
});
