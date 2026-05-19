import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image,
  Animated, Dimensions, ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState, useRef, useEffect } from "react";
import {
  Plus, Trash, X, ShoppingCart, Lightning, TrendUp,
  Heart, ImageSquare, ArrowRight, Sparkle, CaretRight,
  Clock, Target, Warning, Link as LinkIcon, ArrowSquareOut,
  CurrencyCircleDollar,
} from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { Store, formatINR, type Wish, type UserProfile, type Expense } from "../../lib/store";
import { s, vs, fs, r, br } from "../../lib/responsive";
import { BlueButton } from "../../components/BlueButton";
import { showToast } from "../../components/FinnyToast";
import { Linking } from "react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const dustbinImg = require("../../assets/images/dustbin.png");
const CARD_GAP = s(12);
const CARD_W = (SCREEN_W - s(20) * 2 - CARD_GAP) / 2;

const wishlistEmpty = require("../../assets/images/wishlist-empty.png");

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMonthsToGoal(price: number, saved: number, monthlySavings: number): number {
  const remaining = price - saved;
  if (remaining <= 0) return 0;
  if (!monthlySavings || monthlySavings <= 0) return 999;
  return Math.ceil(remaining / monthlySavings);
}

function getTimeLabel(months: number): string {
  if (months <= 0) return "Ready!";
  if (months >= 999) return "Set savings";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${yrs}y`;
  return `${yrs}y ${rem}m`;
}

function getTimeBadgeColor(months: number): { bg: string; text: string } {
  if (months <= 0) return { bg: "#DCFCE7", text: "#16A34A" };
  if (months <= 3) return { bg: "#DBEAFE", text: "#2563EB" };
  if (months <= 6) return { bg: "#FEF3C7", text: "#D97706" };
  return { bg: "#FEE2E2", text: "#DC2626" };
}

type SuggestionType = "BUY_ORDER" | "SPENDING_CUT" | "REALITY_CHECK" | "BEHAVIOUR_NUDGE";

interface AISuggestion {
  type: SuggestionType;
  title: string;
  body: string;
  highlight: string;
}

const SUGGESTION_ICONS: Record<SuggestionType, { icon: typeof Lightning; color: string; bg: string }> = {
  BUY_ORDER: { icon: ShoppingCart, color: "#2563EB", bg: "#DBEAFE" },
  SPENDING_CUT: { icon: Lightning, color: "#D97706", bg: "#FEF3C7" },
  REALITY_CHECK: { icon: Target, color: "#DC2626", bg: "#FEE2E2" },
  BEHAVIOUR_NUDGE: { icon: Sparkle, color: "#7C3AED", bg: "#EDE9FE" },
};

// ── Wish Grid Card (with long-press drag) ────────────────────────────────────

function WishGridCard({
  wish,
  monthlySavings,
  onPress,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  wish: Wish;
  monthlySavings: number;
  onPress: () => void;
  onDragStart: (wishId: string, gx: number, gy: number) => void;
  onDragMove: (gx: number, gy: number) => void;
  onDragEnd: (gx: number, gy: number) => void;
}) {
  const months = getMonthsToGoal(wish.price, wish.saved, monthlySavings);
  const timeBadge = getTimeBadgeColor(months);
  const pct = wish.price > 0 ? Math.min((wish.saved / wish.price) * 100, 100) : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={() => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
        onDragStart(wish.id, 0, 0);
      }}
      delayLongPress={500}
      style={st.gridCard}
    >
      {/* Image */}
      <View style={st.gridImageWrap}>
        {wish.imageUri ? (
          <Image source={{ uri: wish.imageUri }} style={st.gridImage} resizeMode="cover" />
        ) : (
          <View style={st.gridImagePlaceholder}>
            <Heart size={s(24)} color="#D4D4D8" weight="regular" />
          </View>
        )}
        {/* Timeline badge overlaid on image */}
        <View style={[st.timeBadge, { backgroundColor: timeBadge.bg }]}>
          <Text style={[st.timeBadgeText, { color: timeBadge.text }]}>
            {getTimeLabel(months)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={st.gridInfo}>
        <Text style={st.gridName} numberOfLines={1}>{wish.name}</Text>
        <Text style={st.gridPrice}>{formatINR(wish.price)}</Text>

        {/* Mini progress */}
        <View style={st.gridProgressBg}>
          <View style={[st.gridProgressFill, { width: `${Math.max(pct, 3)}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function WishDetail({
  wish,
  profile,
  monthlySavings,
  expenses,
  onClose,
  onDelete,
  onPickImage,
}: {
  wish: Wish;
  profile: UserProfile | null;
  monthlySavings: number;
  expenses: Expense[];
  onClose: () => void;
  onDelete: () => void;
  onPickImage: () => void;
}) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const months = getMonthsToGoal(wish.price, wish.saved, monthlySavings);
  const pct = wish.price > 0 ? Math.min((wish.saved / wish.price) * 100, 100) : 0;
  const remaining = Math.max(wish.price - wish.saved, 0);
  const timeBadge = getTimeBadgeColor(months);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    fetchSuggestion();
  }, []);

  const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? "";

  const fetchSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const allWishes = await Store.getWishes();
      const res = await fetch(`${baseUrl}api/wish-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishes: allWishes.map(w => ({ name: w.name, price: w.price, saved: w.saved })),
          profile: profile ? {
            name: profile.name,
            monthlyIncome: profile.monthlyIncome,
            monthlyBudget: profile.monthlyBudget,
            savingsGoal: profile.savingsGoal,
            balance: profile.balance,
          } : null,
          expenses: expenses.slice(0, 30).map(e => ({ category: e.category, amount: e.amount })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data);
      }
    } catch (e) {
      console.warn("Suggestion fetch failed:", e);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const SugIcon = suggestion ? SUGGESTION_ICONS[suggestion.type]?.icon || Sparkle : Sparkle;
  const sugColors = suggestion ? SUGGESTION_ICONS[suggestion.type] || SUGGESTION_ICONS.BEHAVIOUR_NUDGE : SUGGESTION_ICONS.BEHAVIOUR_NUDGE;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={st.detailBg}>
        <Animated.View style={[st.detailSheet, { opacity: fadeAnim }]}>
          <View style={st.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(24) }}>
            {/* Close + Title */}
            <View style={st.detailHeader}>
              <Text style={st.detailTitle}>{wish.name}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={s(22)} color="#71717A" />
              </TouchableOpacity>
            </View>

            {/* Image */}
            {wish.imageUri ? (
              <TouchableOpacity activeOpacity={0.9} onPress={onPickImage} style={st.detailImageWrap}>
                <Image source={{ uri: wish.imageUri }} style={st.detailImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={st.detailImageEmpty} onPress={onPickImage} activeOpacity={0.7}>
                <ImageSquare size={s(32)} color="#A1A1AA" weight="regular" />
                <Text style={st.detailImageEmptyText}>Add a photo</Text>
              </TouchableOpacity>
            )}

            {/* Price + Timeline row */}
            <View style={st.priceRow}>
              <View>
                <Text style={st.detailPrice}>{formatINR(wish.price)}</Text>
                <Text style={st.detailSaved}>Saved {formatINR(wish.saved)}</Text>
              </View>
              <View style={[st.detailTimeBadge, { backgroundColor: timeBadge.bg }]}>
                <Clock size={s(14)} color={timeBadge.text} weight="bold" />
                <Text style={[st.detailTimeBadgeText, { color: timeBadge.text }]}>
                  {months <= 0 ? "You can buy this!" : `${getTimeLabel(months)} to go`}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={st.detailProgressSection}>
              <View style={st.detailProgressHeader}>
                <Text style={st.detailProgressLabel}>Progress</Text>
                <Text style={st.detailProgressPct}>{pct.toFixed(0)}%</Text>
              </View>
              <View style={st.detailProgressBg}>
                <LinearGradient
                  colors={pct >= 100 ? ["#22C55E", "#16A34A"] : ["#8DDBFF", "#268FFF"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[st.detailProgressFill, { width: `${Math.max(pct, 2)}%` }]}
                />
              </View>
              <View style={st.detailProgressStats}>
                <Text style={st.detailStatLabel}>Remaining</Text>
                <Text style={st.detailStatValue}>{formatINR(remaining)}</Text>
              </View>
              {monthlySavings > 0 && (
                <View style={st.detailProgressStats}>
                  <Text style={st.detailStatLabel}>Monthly savings rate</Text>
                  <Text style={st.detailStatValue}>{formatINR(monthlySavings)}/mo</Text>
                </View>
              )}
            </View>

            {/* Finny AI Suggestion */}
            <View style={st.suggestionSection}>
              <View style={st.suggestionHeader}>
                <Sparkle size={s(16)} color="#7C3AED" weight="fill" />
                <Text style={st.suggestionHeaderText}>Finny's Take</Text>
              </View>

              {loadingSuggestion ? (
                <View style={st.suggestionLoading}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text style={st.suggestionLoadingText}>Analyzing your finances...</Text>
                </View>
              ) : suggestion ? (
                <View style={[st.suggestionCard, { borderLeftColor: sugColors.color }]}>
                  <View style={st.suggestionTitleRow}>
                    <View style={[st.suggestionIconWrap, { backgroundColor: sugColors.bg }]}>
                      <SugIcon size={s(14)} color={sugColors.color} weight="bold" />
                    </View>
                    <Text style={st.suggestionTitle}>{suggestion.title}</Text>
                  </View>
                  <Text style={st.suggestionBody}>{suggestion.body}</Text>
                  {suggestion.highlight ? (
                    <View style={[st.suggestionHighlight, { backgroundColor: sugColors.bg }]}>
                      <Text style={[st.suggestionHighlightText, { color: sugColors.color }]}>
                        {suggestion.highlight}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={st.suggestionCard}>
                  <Text style={st.suggestionBody}>Add more data to get personalized suggestions from Finny.</Text>
                </View>
              )}
            </View>

            {/* Link section */}
            {wish.url ? (
              <TouchableOpacity
                style={st.linkBtn}
                onPress={() => Linking.openURL(wish.url!)}
                activeOpacity={0.7}
              >
                <ArrowSquareOut size={s(16)} color="#268FFF" weight="bold" />
                <Text style={st.linkBtnText} numberOfLines={1}>
                  {wish.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                </Text>
                <Text style={st.linkBtnLabel}>Visit</Text>
              </TouchableOpacity>
            ) : null}

            {/* Actions */}
            <TouchableOpacity style={st.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
              <Trash size={s(16)} color="#EF4444" weight="regular" />
              <Text style={st.deleteText}>Remove from Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Finny Banner (top suggestion) ────────────────────────────────────────────

function FinnyBanner({
  wishes,
  profile,
  expenses,
}: {
  wishes: Wish[];
  profile: UserProfile | null;
  expenses: Expense[];
}) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? "";

  useEffect(() => {
    if (wishes.length > 0) fetchSuggestion();
  }, [wishes.length]);

  const fetchSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/wish-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishes: wishes.map(w => ({ name: w.name, price: w.price, saved: w.saved })),
          profile: profile ? {
            name: profile.name,
            monthlyIncome: profile.monthlyIncome,
            monthlyBudget: profile.monthlyBudget,
            savingsGoal: profile.savingsGoal,
            balance: profile.balance,
          } : null,
          expenses: expenses.slice(0, 30).map(e => ({ category: e.category, amount: e.amount })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data);
      }
    } catch (e) {
      console.warn("Banner suggestion fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!suggestion && !loading) return null;

  const sugColors = suggestion ? (SUGGESTION_ICONS[suggestion.type] || SUGGESTION_ICONS.BEHAVIOUR_NUDGE) : SUGGESTION_ICONS.BEHAVIOUR_NUDGE;
  const SugIcon = suggestion ? (SUGGESTION_ICONS[suggestion.type]?.icon || Sparkle) : Sparkle;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded(!expanded)}
      style={st.banner}
    >
      <LinearGradient
        colors={["#FAF5FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={st.bannerGrad}
      >
        {loading ? (
          <View style={st.bannerLoading}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={st.bannerLoadingText}>Finny is thinking...</Text>
          </View>
        ) : suggestion ? (
          <>
            <View style={st.bannerTop}>
              <View style={st.bannerIconRow}>
                <View style={[st.bannerIconWrap, { backgroundColor: sugColors.bg }]}>
                  <SugIcon size={s(14)} color={sugColors.color} weight="bold" />
                </View>
                <Text style={st.bannerTitle}>{suggestion.title}</Text>
              </View>
              <CaretRight
                size={s(14)}
                color="#7C3AED"
                weight="bold"
                style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
              />
            </View>
            {expanded && (
              <View style={st.bannerExpanded}>
                <Text style={st.bannerBody}>{suggestion.body}</Text>
                {suggestion.highlight ? (
                  <View style={[st.bannerHighlight, { backgroundColor: sugColors.bg }]}>
                    <Text style={[st.bannerHighlightText, { color: sugColors.color }]}>
                      {suggestion.highlight}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function WishesScreen() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [form, setForm] = useState({ name: "", price: "", imageUri: "", url: "" });
  const [priceLoading, setPriceLoading] = useState(false);

  // ── Long-press delete state ──
  const [deleteConfirmWish, setDeleteConfirmWish] = useState<Wish | null>(null);

  const handleLongPressDelete = (wishId: string) => {
    const w = wishes.find(wi => wi.id === wishId);
    if (w) setDeleteConfirmWish(w);
  };

  const confirmQuickDelete = async () => {
    if (!deleteConfirmWish) return;
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    const wishName = deleteConfirmWish.name;
    await Store.deleteWish(deleteConfirmWish.id);
    if (selectedWish?.id === deleteConfirmWish.id) setSelectedWish(null);
    setDeleteConfirmWish(null);
    load();
    showToast("success", "Removed!", `${wishName} deleted from your cart.`);
  };

  const load = useCallback(async () => {
    const [w, p, e] = await Promise.all([
      Store.getWishes(),
      Store.getProfile(),
      Store.getExpenses(),
    ]);
    setWishes(w);
    setProfile(p);
    setExpenses(e);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const monthlySavings = profile
    ? Math.max(profile.monthlyIncome - profile.monthlyBudget, profile.savingsGoal || 0)
    : 0;

  const cartTotal = wishes.reduce((a, w) => a + w.price, 0);
  const cartSaved = wishes.reduce((a, w) => a + w.saved, 0);

  const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? "";

  const fetchPrice = async (url: string) => {
    if (!url.trim()) return;
    setPriceLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/price-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.price) {
          setForm((f) => ({ ...f, price: data.price.toString() }));
          if (data.name && !form.name) {
            setForm((f) => ({ ...f, name: data.name }));
          }
          showToast("success", "Price Found!", `${data.name ? data.name + " — " : ""}₹${data.price.toLocaleString("en-IN")}`);
        } else {
          showToast("warning", "Couldn't fetch price", "Try entering it manually.");
        }
      } else {
        showToast("error", "Price fetch failed", "Enter the price manually.");
      }
    } catch (e) {
      showToast("error", "Network error", "Couldn't reach the server.");
    } finally {
      setPriceLoading(false);
    }
  };

  const pickImage = async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) return result.assets[0].uri;
    } catch (e) { console.warn("Image picker error:", e); }
    return null;
  };

  const pickImageForForm = async () => {
    const uri = await pickImage();
    if (uri) setForm({ ...form, imageUri: uri });
  };

  const pickImageForWish = async (wishId: string) => {
    const uri = await pickImage();
    if (uri) {
      const all = await Store.getWishes();
      const updated = all.map((w) => w.id === wishId ? { ...w, imageUri: uri } : w);
      await Store.setWishes(updated);
      load();
      if (selectedWish && selectedWish.id === wishId) {
        setSelectedWish({ ...selectedWish, imageUri: uri });
      }
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.price.trim()) { Alert.alert("Fill all fields"); return; }
    const price = parseInt(form.price.replace(/,/g, ""));
    if (isNaN(price) || price <= 0) { Alert.alert("Invalid price"); return; }
    await Store.addWish({
      id: Date.now().toString(),
      name: form.name.trim(),
      price,
      saved: profile?.balance ? Math.min(profile.balance * 0.1, price) : 0,
      createdAt: new Date().toISOString(),
      imageUri: form.imageUri || undefined,
      url: form.url.trim() || undefined,
    });
    showToast("success", "Added to Cart!", `${form.name.trim()} — ${formatINR(price)}`);
    setForm({ name: "", price: "", imageUri: "", url: "" });
    setShowModal(false);
    load();
  };

  const deleteWish = (id: string) =>
    Alert.alert("Remove from cart?", "This wish will be removed.", [
      { text: "Cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          await Store.deleteWish(id);
          if (selectedWish?.id === id) setSelectedWish(null);
          load();
        }
      },
    ]);

  return (
    <View style={st.container}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={st.header}>
          <View>
            <Text style={st.headerTitle}>Wish Cart</Text>
            {wishes.length > 0 && (
              <Text style={st.headerSub}>
                {wishes.length} item{wishes.length !== 1 ? "s" : ""} · {formatINR(cartTotal)}
              </Text>
            )}
          </View>
          {wishes.length > 0 && (
            <TouchableOpacity
              style={st.addBtn}
              onPress={() => setShowModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={s(18)} color="#268FFF" weight="bold" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {wishes.length === 0 ? (
          /* Empty state */
          <View style={st.emptyState}>
            <Image source={wishlistEmpty} style={st.emptyIllustration} resizeMode="contain" />
            <View style={st.emptyTextWrap}>
              <Text style={st.emptyTitle}>Your Wish Cart is Empty</Text>
              <Text style={st.emptySubtitle}>
                Add things you want — Finny will tell you the smartest way to get them.
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowModal(true)}>
              <LinearGradient
                colors={["#7DD3FC", "#3B82F6"]}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                style={st.emptyBtn}
              >
                <Plus size={s(18)} color="#FFFFFF" weight="bold" />
                <Text style={st.emptyBtnText}>Add Your First Wish</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Finny AI Banner */}
            <FinnyBanner wishes={wishes} profile={profile} expenses={expenses} />

            {/* Cart summary mini bar */}
            <View style={st.summaryBar}>
              <View style={st.summaryItem}>
                <Text style={st.summaryLabel}>Cart Total</Text>
                <Text style={st.summaryValue}>{formatINR(cartTotal)}</Text>
              </View>
              <View style={st.summaryDivider} />
              <View style={st.summaryItem}>
                <Text style={st.summaryLabel}>Saved So Far</Text>
                <Text style={[st.summaryValue, { color: "#16A34A" }]}>{formatINR(cartSaved)}</Text>
              </View>
              <View style={st.summaryDivider} />
              <View style={st.summaryItem}>
                <Text style={st.summaryLabel}>Remaining</Text>
                <Text style={st.summaryValue}>{formatINR(cartTotal - cartSaved)}</Text>
              </View>
            </View>

            {/* 2-column grid */}
            <View style={st.grid}>
              {wishes.map((w) => (
                <WishGridCard
                  key={w.id}
                  wish={w}
                  monthlySavings={monthlySavings}
                  onPress={() => setSelectedWish(w)}
                  onDragStart={handleLongPressDelete}
                  onDragMove={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: vs(100) }} />
      </ScrollView>

      {/* Detail Modal */}
      {selectedWish && (
        <WishDetail
          wish={selectedWish}
          profile={profile}
          monthlySavings={monthlySavings}
          expenses={expenses}
          onClose={() => setSelectedWish(null)}
          onDelete={() => deleteWish(selectedWish.id)}
          onPickImage={() => pickImageForWish(selectedWish.id)}
        />
      )}

      {/* ── Quick Delete Confirmation ── */}
      {deleteConfirmWish && (
        <Modal visible animationType="fade" transparent>
          <View style={st.deleteModalBg}>
            <View style={st.deleteModalSheet}>
              <Image source={dustbinImg} style={st.deleteModalIcon} resizeMode="contain" />
              <Text style={st.deleteModalTitle}>Remove "{deleteConfirmWish.name}"?</Text>
              <Text style={st.deleteModalSub}>This wish will be removed from your cart.</Text>
              <View style={st.deleteModalBtns}>
                <TouchableOpacity
                  style={st.deleteModalCancel}
                  onPress={() => setDeleteConfirmWish(null)}
                  activeOpacity={0.7}
                >
                  <Text style={st.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={st.deleteModalConfirm}
                  onPress={confirmQuickDelete}
                  activeOpacity={0.7}
                >
                  <Text style={st.deleteModalConfirmText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── FAB (+) button ── */}
      {wishes.length > 0 && (
        <TouchableOpacity
          style={st.fab}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#7DD3FC", "#3B82F6"]}
            style={st.fabGrad}
          >
            <Plus size={s(22)} color="#FFFFFF" weight="bold" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={st.modalBg} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={st.modalSheet}>
            <View style={st.sheetHandle} />
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Add to Cart</Text>
              <TouchableOpacity
                onPress={() => { setShowModal(false); setForm({ name: "", price: "", imageUri: "", url: "" }); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={s(22)} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Image picker */}
            <TouchableOpacity style={st.imagePickerBtn} onPress={pickImageForForm} activeOpacity={0.7}>
              {form.imageUri ? (
                <Image source={{ uri: form.imageUri }} style={st.imagePickerPreview} resizeMode="cover" />
              ) : (
                <View style={st.imagePickerEmpty}>
                  <ImageSquare size={s(28)} color="#9CA3AF" weight="regular" />
                  <Text style={st.imagePickerText}>Add a photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={st.label}>What do you want?</Text>
            <TextInput
              style={st.modalInput}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. iPhone 16, MacBook, Goa Trip..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={st.label}>Product Link (optional)</Text>
            <View style={st.urlRow}>
              <TextInput
                style={[st.modalInput, st.urlInput]}
                value={form.url}
                onChangeText={(v) => setForm({ ...form, url: v })}
                placeholder="Paste Amazon, Flipkart, etc. link"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={[st.urlFetchBtn, priceLoading && { opacity: 0.5 }]}
                onPress={() => fetchPrice(form.url)}
                disabled={!form.url.trim() || priceLoading}
                activeOpacity={0.7}
              >
                {priceLoading ? (
                  <ActivityIndicator size="small" color="#268FFF" />
                ) : (
                  <CurrencyCircleDollar size={s(20)} color="#268FFF" weight="bold" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={st.label}>How much? (₹)</Text>
            <TextInput
              style={st.modalInput}
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              placeholder="e.g. 79000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            {form.name && form.price && profile && parseInt(form.price.replace(/,/g, "")) > 0 && monthlySavings > 0 && (
              <View style={st.previewBox}>
                <TrendUp size={s(14)} color="#1E40AF" weight="bold" />
                <Text style={st.previewText}>
                  At {formatINR(monthlySavings)}/mo savings, you can get this in ~
                  {getMonthsToGoal(parseInt((form.price || "0").replace(/,/g, "")), 0, monthlySavings)} months
                </Text>
              </View>
            )}

            <BlueButton label="Add to Cart" onPress={handleAdd} style={{ marginTop: vs(4) }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    paddingBottom: vs(10),
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(20),
    color: "#09090B",
  },
  headerSub: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#71717A",
    marginTop: vs(-2),
  },
  addBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: s(20), paddingTop: vs(4) },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: vs(80),
    paddingHorizontal: s(24),
  },
  emptyIllustration: {
    width: s(160),
    height: s(160),
    marginBottom: vs(24),
  },
  emptyTextWrap: {
    alignItems: "center",
    gap: vs(8),
    marginBottom: vs(24),
    width: "100%",
  },
  emptyTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(18),
    color: "#09090B",
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(14),
    color: "#71717A",
    textAlign: "center",
    lineHeight: fs(21),
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: s(50),
  },
  emptyBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(16),
    color: "#FFFFFF",
  },

  // ── Finny Banner ──
  banner: {
    marginBottom: vs(14),
    borderRadius: s(16),
    overflow: "hidden",
  },
  bannerGrad: {
    padding: s(14),
  },
  bannerLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
  },
  bannerLoadingText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#7C3AED",
  },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    flex: 1,
  },
  bannerIconWrap: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#18181B",
    flex: 1,
  },
  bannerExpanded: {
    marginTop: vs(10),
  },
  bannerBody: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#3F3F46",
    lineHeight: fs(19),
  },
  bannerHighlight: {
    marginTop: vs(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(8),
    alignSelf: "flex-start",
  },
  bannerHighlightText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(12),
  },

  // ── Summary bar ──
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#F8F8FA",
    borderRadius: s(14),
    padding: s(14),
    marginBottom: vs(16),
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: vs(28),
    backgroundColor: "#E4E4E7",
  },
  summaryLabel: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(11),
    color: "#71717A",
    marginBottom: vs(2),
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(13),
    color: "#09090B",
  },

  // ── Grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  gridCard: {
    width: CARD_W,
    backgroundColor: "#FAFAFA",
    borderRadius: s(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  gridImageWrap: {
    width: "100%",
    height: CARD_W * 0.75,
    backgroundColor: "#F4F4F5",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F5",
  },
  timeBadge: {
    position: "absolute",
    bottom: s(6),
    left: s(6),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(6),
  },
  timeBadgeText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(10),
  },
  gridInfo: {
    padding: s(10),
  },
  gridName: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(13),
    color: "#18181B",
    marginBottom: vs(2),
  },
  gridPrice: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(14),
    color: "#09090B",
    marginBottom: vs(8),
  },
  gridProgressBg: {
    height: vs(4),
    backgroundColor: "#E4E4E7",
    borderRadius: s(2),
    overflow: "hidden",
  },
  gridProgressFill: {
    height: vs(4),
    borderRadius: s(2),
    backgroundColor: "#268FFF",
  },

  // ── Detail Modal ──
  detailBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(20),
    maxHeight: "90%",
  },
  sheetHandle: {
    width: s(40),
    height: vs(4),
    borderRadius: s(2),
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: vs(12),
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(16),
  },
  detailTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(20),
    color: "#09090B",
    flex: 1,
    marginRight: s(12),
  },
  detailImageWrap: {
    width: "100%",
    height: vs(180),
    borderRadius: s(16),
    overflow: "hidden",
    marginBottom: vs(16),
    backgroundColor: "#F4F4F5",
  },
  detailImage: {
    width: "100%",
    height: "100%",
  },
  detailImageEmpty: {
    width: "100%",
    height: vs(120),
    borderRadius: s(16),
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    gap: vs(6),
    marginBottom: vs(16),
  },
  detailImageEmptyText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#9CA3AF",
  },

  // Price row
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: vs(16),
  },
  detailPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(24),
    color: "#09090B",
  },
  detailSaved: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#71717A",
    marginTop: vs(-2),
  },
  detailTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(5),
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: s(8),
  },
  detailTimeBadgeText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(12),
  },

  // Progress section
  detailProgressSection: {
    backgroundColor: "#F8F8FA",
    borderRadius: s(14),
    padding: s(14),
    marginBottom: vs(16),
  },
  detailProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  detailProgressLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(13),
    color: "#52525B",
  },
  detailProgressPct: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(14),
    color: "#268FFF",
  },
  detailProgressBg: {
    height: vs(8),
    backgroundColor: "#E4E4E7",
    borderRadius: s(4),
    overflow: "hidden",
    marginBottom: vs(12),
  },
  detailProgressFill: {
    height: vs(8),
    borderRadius: s(4),
  },
  detailProgressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(4),
  },
  detailStatLabel: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(12),
    color: "#71717A",
  },
  detailStatValue: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(13),
    color: "#18181B",
  },

  // Suggestion section
  suggestionSection: {
    marginBottom: vs(16),
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginBottom: vs(10),
  },
  suggestionHeaderText: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#7C3AED",
  },
  suggestionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    backgroundColor: "#FAF5FF",
    borderRadius: s(12),
    padding: s(14),
  },
  suggestionLoadingText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#7C3AED",
  },
  suggestionCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: s(14),
    padding: s(14),
    borderLeftWidth: 3,
    borderLeftColor: "#E4E4E7",
  },
  suggestionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginBottom: vs(8),
  },
  suggestionIconWrap: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#18181B",
    flex: 1,
  },
  suggestionBody: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#3F3F46",
    lineHeight: fs(19),
  },
  suggestionHighlight: {
    marginTop: vs(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(8),
    alignSelf: "flex-start",
  },
  suggestionHighlightText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(12),
  },

  // Link button
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    borderRadius: s(12),
    backgroundColor: "#EFF6FF",
    marginBottom: vs(12),
  },
  linkBtnText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#3B82F6",
    flex: 1,
  },
  linkBtnLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(12),
    color: "#268FFF",
  },

  // URL row in modal
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    marginBottom: vs(14),
  },
  urlInput: {
    flex: 1,
    marginBottom: 0,
  },
  urlFetchBtn: {
    width: s(48),
    height: s(48),
    borderRadius: s(14),
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  // ── Delete Confirmation Modal ──
  deleteModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: s(32),
  },
  deleteModalSheet: {
    backgroundColor: "#fff",
    borderRadius: s(20),
    padding: s(24),
    alignItems: "center",
    width: "100%",
    maxWidth: s(320),
  },
  deleteModalIcon: {
    width: s(48),
    height: s(48),
    marginBottom: vs(12),
  },
  deleteModalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(17),
    color: "#18181B",
    textAlign: "center",
    marginBottom: vs(6),
  },
  deleteModalSub: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#71717A",
    textAlign: "center",
    marginBottom: vs(20),
  },
  deleteModalBtns: {
    flexDirection: "row",
    gap: s(12),
    width: "100%",
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(12),
    backgroundColor: "#F4F4F5",
    alignItems: "center",
  },
  deleteModalCancelText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(14),
    color: "#3F3F46",
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(12),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },
  deleteModalConfirmText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(14),
    color: "#EF4444",
  },

  // ── FAB ──
  fab: {
    position: "absolute",
    right: s(20),
    bottom: vs(16),
    zIndex: 100,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGrad: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: "center",
    justifyContent: "center",
  },

  // Delete
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    paddingVertical: vs(12),
    borderRadius: s(12),
    backgroundColor: "#FEF2F2",
  },
  deleteText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(13),
    color: "#EF4444",
  },

  // ── Modal ──
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(20),
    paddingBottom: vs(36),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(16),
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(18),
    color: "#18181B",
  },
  imagePickerBtn: {
    width: "100%",
    height: s(120),
    borderRadius: s(16),
    overflow: "hidden",
    marginBottom: vs(16),
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
  },
  imagePickerPreview: {
    width: "100%",
    height: "100%",
    borderRadius: s(14),
  },
  imagePickerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: vs(6),
  },
  imagePickerText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#9CA3AF",
  },
  label: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(13),
    color: "#6B7280",
    marginBottom: vs(6),
  },
  modalInput: {
    fontFamily: "InstrumentSans_400Regular",
    backgroundColor: "#F4F4F5",
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    fontSize: fs(15),
    color: "#18181B",
    marginBottom: vs(14),
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(8),
    backgroundColor: "#DBEAFE",
    borderRadius: s(14),
    padding: s(14),
    marginBottom: vs(14),
  },
  previewText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#1E40AF",
    lineHeight: fs(18),
    flex: 1,
  },
});
