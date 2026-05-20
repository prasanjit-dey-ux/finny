/**
 * Notification Center — shows bills due, budget alerts, wish milestones
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X, Bell, WarningCircle, CalendarBlank, TrendUp,
  Heart, Lightning, CheckCircle,
} from "phosphor-react-native";
import { Store, formatINR, daysUntil, type Bill, type UserProfile, type Subscription, type Wish } from "../lib/store";
import { s, vs, fs } from "../lib/responsive";

interface Notification {
  id: string;
  type: "bill_due" | "budget_warning" | "budget_exceeded" | "wish_ready" | "subscription_renewal" | "savings_tip";
  title: string;
  body: string;
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
  priority: number; // lower = higher priority
}

function generateNotifications(
  profile: UserProfile | null,
  bills: Bill[],
  subscriptions: Subscription[],
  wishes: Wish[],
  expenses: { total: number },
): Notification[] {
  const notifs: Notification[] = [];

  if (!profile) return notifs;

  // Budget warnings
  const budget = profile.monthlyBudget > 0 ? profile.monthlyBudget : profile.monthlyIncome;
  if (budget > 0 && expenses.total > 0) {
    const pct = (expenses.total / budget) * 100;
    if (pct >= 100) {
      notifs.push({
        id: "budget_exceeded",
        type: "budget_exceeded",
        title: "Budget Exceeded!",
        body: `You've spent ${formatINR(expenses.total)} — that's ${pct.toFixed(0)}% of your ${formatINR(budget)} budget.`,
        icon: WarningCircle,
        iconColor: "#DC2626",
        iconBg: "#FEE2E2",
        priority: 1,
      });
    } else if (pct >= 80) {
      notifs.push({
        id: "budget_warning",
        type: "budget_warning",
        title: "Budget Almost Used Up",
        body: `${pct.toFixed(0)}% of your monthly budget is spent. Only ${formatINR(budget - expenses.total)} left.`,
        icon: WarningCircle,
        iconColor: "#D97706",
        iconBg: "#FEF3C7",
        priority: 2,
      });
    }
  }

  // Bills due soon
  const unpaidBills = bills.filter((b) => !b.paid);
  for (const bill of unpaidBills) {
    const days = daysUntil(bill.dueDate);
    if (days <= 7 && days >= 0) {
      notifs.push({
        id: `bill_${bill.id}`,
        type: "bill_due",
        title: `${bill.name} Due${days === 0 ? " Today!" : ` in ${days}d`}`,
        body: `${formatINR(bill.amount)} payment upcoming.`,
        icon: CalendarBlank,
        iconColor: days <= 2 ? "#DC2626" : "#D97706",
        iconBg: days <= 2 ? "#FEE2E2" : "#FEF3C7",
        priority: days <= 2 ? 3 : 5,
      });
    } else if (days < 0) {
      notifs.push({
        id: `bill_overdue_${bill.id}`,
        type: "bill_due",
        title: `${bill.name} Overdue!`,
        body: `${formatINR(bill.amount)} was due ${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} ago.`,
        icon: WarningCircle,
        iconColor: "#DC2626",
        iconBg: "#FEE2E2",
        priority: 1,
      });
    }
  }

  // Subscriptions renewing soon
  for (const sub of subscriptions.filter((s) => s.active)) {
    const days = daysUntil(sub.renewalDate);
    if (days >= 0 && days <= 3) {
      notifs.push({
        id: `sub_${sub.id}`,
        type: "subscription_renewal",
        title: `${sub.name} Renews${days === 0 ? " Today" : ` in ${days}d`}`,
        body: `${formatINR(sub.amount)} will be charged.`,
        icon: Lightning,
        iconColor: "#7C3AED",
        iconBg: "#EDE9FE",
        priority: 6,
      });
    }
  }

  // Wishes ready to buy
  const monthlySavings = Math.max(profile.monthlyIncome - profile.monthlyBudget, profile.savingsGoal || 0);
  for (const wish of wishes) {
    if (wish.saved >= wish.price) {
      notifs.push({
        id: `wish_ready_${wish.id}`,
        type: "wish_ready",
        title: `${wish.name} is Ready!`,
        body: `You've saved enough (${formatINR(wish.saved)}) to buy this!`,
        icon: Heart,
        iconColor: "#16A34A",
        iconBg: "#DCFCE7",
        priority: 4,
      });
    }
  }

  // Savings tip if no savings goal
  if (profile.savingsGoal <= 0 && profile.monthlyIncome > 0) {
    notifs.push({
      id: "savings_tip",
      type: "savings_tip",
      title: "Set a Savings Goal",
      body: `Try saving ${formatINR(Math.round(profile.monthlyIncome * 0.2))}/month — that's 20% of your income!`,
      icon: TrendUp,
      iconColor: "#2563EB",
      iconBg: "#DBEAFE",
      priority: 10,
    });
  }

  // Sort by priority
  notifs.sort((a, b) => a.priority - b.priority);

  return notifs;
}

export function NotificationCenter({
  visible,
  onClose,
  onSeen,
}: {
  visible: boolean;
  onClose: () => void;
  onSeen?: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      const [profile, bills, subs, wishes, allExpenses] = await Promise.all([
        Store.getProfile(),
        Store.getBills(),
        Store.getSubscriptions(),
        Store.getWishes(),
        Store.getExpenses(),
      ]);
      // Get this month's expenses
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthExpenses = allExpenses.filter((e) => new Date(e.date) >= monthStart);
      const total = monthExpenses.reduce((a, e) => a + e.amount, 0);

      const next = generateNotifications(profile, bills, subs, wishes, { total });
      setNotifications(next);
      // Mark as seen immediately when user opens the center
      await Store.markNotificationsSeen(next.map((n) => n.id));
      onSeen?.();
      setLoading(false);
    })();
  }, [visible, onSeen]);

  const renderItem = ({ item }: { item: Notification }) => {
    const Icon = item.icon;
    return (
      <View style={st.notifCard}>
        <View style={[st.notifIconWrap, { backgroundColor: item.iconBg }]}>
          <Icon size={s(18)} color={item.iconColor} weight="fill" />
        </View>
        <View style={st.notifText}>
          <Text style={st.notifTitle}>{item.title}</Text>
          <Text style={st.notifBody}>{item.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={st.bg}>
        <View style={st.sheet}>
          <View style={st.handle} />
          <View style={st.header}>
            <View style={st.headerLeft}>
              <Bell size={s(20)} color="#09090B" weight="fill" />
              <Text style={st.headerTitle}>Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={s(22)} color="#71717A" />
            </TouchableOpacity>
          </View>

          {notifications.length === 0 && !loading ? (
            <View style={st.emptyState}>
              <CheckCircle size={s(40)} color="#D4D4D8" weight="regular" />
              <Text style={st.emptyTitle}>All clear!</Text>
              <Text style={st.emptyBody}>No pending alerts right now.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(n) => n.id}
              renderItem={renderItem}
              contentContainerStyle={st.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

export function useNotificationCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const seen = new Set(await Store.getSeenNotificationIds());
    const [profile, bills, subs, wishes, allExpenses] = await Promise.all([
      Store.getProfile(),
      Store.getBills(),
      Store.getSubscriptions(),
      Store.getWishes(),
      Store.getExpenses(),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = allExpenses.filter((e) => new Date(e.date) >= monthStart);
    const total = monthExpenses.reduce((a, e) => a + e.amount, 0);
    const notifs = generateNotifications(profile, bills, subs, wishes, { total });
    setCount(notifs.filter((n) => !seen.has(n.id)).length);
  }, []);

  return { count, refresh };
}

const st = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    maxHeight: "80%",
    paddingBottom: vs(24),
  },
  handle: {
    width: s(40),
    height: vs(4),
    borderRadius: s(2),
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: vs(10),
    marginBottom: vs(12),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    marginBottom: vs(16),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(18),
    color: "#09090B",
  },
  list: {
    paddingHorizontal: s(20),
    paddingBottom: vs(16),
    gap: vs(10),
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(12),
    backgroundColor: "#F8F8FA",
    borderRadius: s(14),
    padding: s(14),
  },
  notifIconWrap: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: {
    flex: 1,
    gap: vs(2),
  },
  notifTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#18181B",
  },
  notifBody: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#71717A",
    lineHeight: fs(18),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(60),
    gap: vs(8),
  },
  emptyTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(16),
    color: "#71717A",
  },
  emptyBody: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#A1A1AA",
  },
});
