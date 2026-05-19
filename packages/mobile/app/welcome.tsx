import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  PaperPlaneRight,
  ArrowLeft,
} from "phosphor-react-native";
import { Store, Auth } from "../lib/store";
import { s, vs, fs, r, br } from "../lib/responsive";
import { BlueButton } from "../components/BlueButton";
import { DarkButton } from "../components/DarkButton";
import { BlueOrb, GreenOrb } from "../components/Orbs";

const { width, height } = Dimensions.get("window");

type Screen = "home" | "create" | "signin" | "chat";

// ── Category & Goal options ──────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { id: "phone", label: "Buy a Phone" },
  { id: "travel", label: "Travel" },
  { id: "laptop", label: "Buy a Laptop" },
  { id: "saving", label: "Just Saving" },
  { id: "other", label: "Other" },
];

const CATEGORY_OPTIONS = [
  { id: "food", label: "Food & Dining" },
  { id: "shopping", label: "Shopping" },
  { id: "transport", label: "Transport" },
  { id: "entertainment", label: "Entertainment" },
  { id: "health", label: "Health" },
  { id: "bills", label: "Bills & Utilities" },
  { id: "education", label: "Education" },
  { id: "others", label: "Others" },
];

// ── Create Account Screen ────────────────────────────────────────────────────

function CreateAccountScreen({
  onBack,
  onSuccess,
  onSwitchToSignIn,
}: {
  onBack: () => void;
  onSuccess: (name: string) => void;
  onSwitchToSignIn: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimName = name.trim();
    if (!trimName || trimName.length < 2) {
      setError("Enter your name (at least 2 characters)");
      return;
    }
    if (password.trim().length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    const result = await Auth.register(trimName, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Something went wrong");
      return;
    }
    onSuccess(trimName);
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={authStyles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={authStyles.backBtn}>
            <ArrowLeft size={s(22)} color="#18181B" weight="bold" />
          </TouchableOpacity>
          <Text style={authStyles.headerTitle}>Create Account</Text>
          <View style={{ width: s(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={authStyles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.avatarWrap}>
            <BlueOrb size={s(64)} />
          </View>

          <Text style={authStyles.formTitle}>Welcome to Finny</Text>
          <Text style={authStyles.formSub}>Create your account to get started</Text>

          <View style={authStyles.inputWrap}>
            <Text style={authStyles.inputLabel}>Name</Text>
            <TextInput
              style={authStyles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={authStyles.inputWrap}>
            <Text style={authStyles.inputLabel}>Password</Text>
            <TextInput
              style={authStyles.input}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              placeholder="At least 4 characters"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={authStyles.error}>{error}</Text> : null}

          <View style={{ marginTop: vs(8) }}>
            <BlueButton label={loading ? "Creating..." : "Create Account"} onPress={handleSubmit} />
          </View>

          <TouchableOpacity onPress={onSwitchToSignIn} activeOpacity={0.7} style={authStyles.switchWrap}>
            <Text style={authStyles.switchText}>Already have an account? <Text style={authStyles.switchLink}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Sign In Screen ───────────────────────────────────────────────────────────

function SignInScreen({
  onBack,
  onSuccess,
  onSwitchToCreate,
}: {
  onBack: () => void;
  onSuccess: (name: string) => void;
  onSwitchToCreate: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    const result = await Auth.login(name, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Something went wrong");
      return;
    }
    onSuccess(result.name || name.trim());
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={authStyles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={authStyles.backBtn}>
            <ArrowLeft size={s(22)} color="#18181B" weight="bold" />
          </TouchableOpacity>
          <Text style={authStyles.headerTitle}>Sign In</Text>
          <View style={{ width: s(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={authStyles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.avatarWrap}>
            <BlueOrb size={s(64)} />
          </View>

          <Text style={authStyles.formTitle}>Welcome back</Text>
          <Text style={authStyles.formSub}>Sign in to your Finny account</Text>

          <View style={authStyles.inputWrap}>
            <Text style={authStyles.inputLabel}>Name</Text>
            <TextInput
              style={authStyles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              returnKeyType="next"
            />
          </View>

          <View style={authStyles.inputWrap}>
            <Text style={authStyles.inputLabel}>Password</Text>
            <TextInput
              style={authStyles.input}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              placeholder="Your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={authStyles.error}>{error}</Text> : null}

          <View style={{ marginTop: vs(8) }}>
            <BlueButton label={loading ? "Signing in..." : "Sign In"} onPress={handleSubmit} />
          </View>

          <TouchableOpacity onPress={onSwitchToCreate} activeOpacity={0.7} style={authStyles.switchWrap}>
            <Text style={authStyles.switchText}>Don't have an account? <Text style={authStyles.switchLink}>Create One</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  backBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(17),
    color: "#18181B",
  },
  form: {
    paddingHorizontal: s(24),
    paddingTop: vs(36),
    paddingBottom: vs(40),
  },
  avatarWrap: { alignItems: "center", marginBottom: vs(20) },
  formTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(22),
    color: "#18181B",
    textAlign: "center",
    marginBottom: vs(6),
  },
  formSub: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(14),
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: vs(28),
  },
  inputWrap: { marginBottom: vs(16) },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(13),
    color: "#52525B",
    marginBottom: vs(6),
    marginLeft: s(4),
  },
  input: {
    fontFamily: "InstrumentSans_400Regular",
    backgroundColor: "#F4F4F5",
    borderRadius: br.md,
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    fontSize: fs(15),
    color: "#18181B",
  },
  error: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#EF4444",
    textAlign: "center",
    marginTop: vs(4),
    marginBottom: vs(4),
  },
  switchWrap: {
    marginTop: vs(20),
    alignItems: "center",
  },
  switchText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(14),
    color: "#9CA3AF",
  },
  switchLink: {
    fontFamily: "InstrumentSans_600SemiBold",
    color: "#268FFF",
  },
});

// ── Chat Onboarding ──────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  role: "finny" | "user";
  text: string;
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const isFinny = msg.role === "finny";

  return (
    <Animated.View
      style={[
        chatStyles.bubbleRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        isFinny ? chatStyles.bubbleRowLeft : chatStyles.bubbleRowRight,
      ]}
    >
      {isFinny && <BlueOrb size={s(28)} />}
      <View style={[chatStyles.bubble, isFinny ? chatStyles.bubbleFinny : chatStyles.bubbleUser]}>
        <Text
          style={[chatStyles.bubbleText, isFinny ? chatStyles.bubbleTextFinny : chatStyles.bubbleTextUser]}
        >
          {msg.text}
        </Text>
      </View>
    </Animated.View>
  );
}

function ChatOnboarding({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", role: "finny", text: `Hey ${userName}! I'm Finny, your personal finance buddy. Let's set things up real quick.` },
    { id: "2", role: "finny", text: "What's your monthly income? (e.g. 5000)" },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0); // 0=income, 1=budget, 2=savings goal, 3=big goal, 4=top categories
  const [income, setIncome] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [bigGoal, setBigGoal] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const addMsg = (role: "finny" | "user", text: string) => {
    const msg: ChatMsg = { id: Date.now().toString() + Math.random(), role, text };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  // Detect if user is asking a question rather than answering
  const isQuestion = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
      lower.includes("?") ||
      /^(what|how|why|can|should|is|do|does|will|could|would|where|when|who|which|tell me|explain)/i.test(lower.trim())
    );
  };

  const FINNY_TIPS: Record<string, string> = {
    budget: "A good rule of thumb: try the 50/30/20 split — 50% needs, 30% wants, 20% savings.",
    save: "Even saving ₹500/month adds up to ₹6,000/year. Start small and stay consistent!",
    invest: "Before investing, build an emergency fund covering 3-6 months of expenses first.",
    spend: "Track every spend for a week — you'll be surprised where the money goes!",
    goal: "Break big goals into monthly milestones. A ₹1,00,000 goal is just ₹8,334/month for a year.",
    default: "Great question! The key to financial health is knowing where your money goes. Let's get you set up first, then I can help more!",
  };

  const getFinnyTip = (question: string): string => {
    const lower = question.toLowerCase();
    if (lower.includes("budget") || lower.includes("spend")) return FINNY_TIPS.budget;
    if (lower.includes("save") || lower.includes("saving")) return FINNY_TIPS.save;
    if (lower.includes("invest")) return FINNY_TIPS.invest;
    if (lower.includes("track") || lower.includes("expense")) return FINNY_TIPS.spend;
    if (lower.includes("goal")) return FINNY_TIPS.goal;
    return FINNY_TIPS.default;
  };

  const RE_PROMPTS: Record<number, string> = {
    0: "Now, what's your monthly income? (e.g. 50000)",
    1: "So, what's your monthly spending budget? (e.g. 40000)",
    2: "And how much do you want to save each month? (e.g. 10000)",
    3: "Pick a big goal from above, or type your own!",
    4: "Tap up to 3 categories where you spend the most, then hit Done!",
  };

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    setInput("");

    // If user asks a question at any step, answer it then re-prompt
    if (isQuestion(val)) {
      addMsg("user", val);
      scrollToEnd();
      setTimeout(() => {
        addMsg("finny", getFinnyTip(val));
        scrollToEnd();
        setTimeout(() => {
          if (RE_PROMPTS[step]) {
            addMsg("finny", RE_PROMPTS[step]);
            scrollToEnd();
          }
        }, 600);
      }, 500);
      return;
    }

    if (step === 0) {
      addMsg("user", val);
      scrollToEnd();

      const num = parseInt(val.replace(/[$,\u20B9]/g, ""));
      if (isNaN(num) || num <= 0) {
        setTimeout(() => {
          addMsg("finny", "Just type a number for your monthly income. E.g. 5000");
          scrollToEnd();
        }, 500);
        return;
      }

      setIncome(num);
      setTimeout(() => {
        addMsg("finny", `\u20B9${num.toLocaleString("en-IN")}/month. Got it!`);
        scrollToEnd();
        setTimeout(() => {
          addMsg("finny", "How much do you want to budget for spending each month? This is the max you plan to spend. (e.g. 4000)");
          scrollToEnd();
          setStep(1);
        }, 600);
      }, 500);
    } else if (step === 1) {
      addMsg("user", val);
      scrollToEnd();

      const num = parseInt(val.replace(/[$,\u20B9]/g, ""));
      if (isNaN(num) || num <= 0) {
        setTimeout(() => {
          addMsg("finny", "Just type a number for your monthly budget. E.g. 4000");
          scrollToEnd();
        }, 500);
        return;
      }

      setMonthlyBudget(num);
      setTimeout(() => {
        addMsg("finny", `\u20B9${num.toLocaleString("en-IN")}/month budget. Smart!`);
        scrollToEnd();
        setTimeout(() => {
          addMsg("finny", "How much do you want to save each month? (e.g. 1000)");
          scrollToEnd();
          setStep(2);
        }, 600);
      }, 500);
    } else if (step === 2) {
      addMsg("user", val);
      scrollToEnd();

      const num = parseInt(val.replace(/[$,\u20B9]/g, ""));
      if (isNaN(num) || num < 0) {
        setTimeout(() => {
          addMsg("finny", "Just type a number for your savings goal. E.g. 1000");
          scrollToEnd();
        }, 500);
        return;
      }

      setSavingsGoal(num);
      setTimeout(() => {
        addMsg("finny", `\u20B9${num.toLocaleString("en-IN")}/month savings target. Nice!`);
        scrollToEnd();
        setTimeout(() => {
          addMsg("finny", "Do you have any big goal right now? Tap one below.");
          scrollToEnd();
          setStep(3);
        }, 600);
      }, 500);
    } else if (step === 3) {
      // Typing a goal name
      handleGoalSelect(val);
    } else if (step === 4) {
      // Typing a category
      const matched = CATEGORY_OPTIONS.find(
        (c) => c.label.toLowerCase().includes(val.toLowerCase())
      );
      if (matched && !selectedCats.includes(matched.id)) {
        toggleCategory(matched.id);
      }
    }
  };

  const handleGoalSelect = (goalId: string) => {
    const matched = GOAL_OPTIONS.find(
      (g) => g.id === goalId || g.label.toLowerCase().includes(goalId.toLowerCase())
    );
    const goal = matched || GOAL_OPTIONS[GOAL_OPTIONS.length - 1];

    setBigGoal(goal.id);
    addMsg("user", goal.label);
    scrollToEnd();

    setTimeout(() => {
      addMsg("finny", `${goal.label}. Love that!`);
      scrollToEnd();
      setTimeout(() => {
        addMsg("finny", "Last one. Where do you spend the most? Pick up to 3.");
        scrollToEnd();
        setStep(4);
      }, 600);
    }, 500);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCats((prev) => {
      if (prev.includes(catId)) return prev.filter((c) => c !== catId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, catId];
    });
  };

  const handleCategoryDone = async () => {
    if (selectedCats.length === 0) return;

    const labels = selectedCats
      .map((id) => CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? id)
      .join(", ");

    addMsg("user", labels);
    scrollToEnd();

    setTimeout(async () => {
      addMsg("finny", `Great choices! You're all set, ${userName}. Let me build your dashboard.`);
      scrollToEnd();

      await Store.setProfile({
        name: userName,
        monthlyIncome: income,
        monthlyBudget: monthlyBudget,
        balance: income,
        savingsGoal,
        bigGoal: bigGoal || "saving",
        topCategories: selectedCats,
        topCategory: selectedCats[0] || "food",
        notifications: true,
      });

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1200);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
        {/* Header */}
        <View style={chatStyles.header}>
          <BlueOrb size={s(36)} />
          <View>
            <Text style={chatStyles.headerName}>Finny</Text>
            <Text style={chatStyles.headerStatus}>Setting up your account</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={chatStyles.messagesList}
          contentContainerStyle={chatStyles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {/* Goal chips for step 3 */}
          {step === 3 && !bigGoal && (
            <View style={chatStyles.chipGrid}>
              {GOAL_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={chatStyles.chip}
                  onPress={() => handleGoalSelect(g.id)}
                  activeOpacity={0.7}
                >
                  <Text style={chatStyles.chipText}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category chips for step 4 */}
          {step === 4 && (
            <View>
              <View style={chatStyles.chipGrid}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const selected = selectedCats.includes(cat.id);
                  const disabled = !selected && selectedCats.length >= 3;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        chatStyles.chip,
                        selected && chatStyles.chipSelected,
                        disabled && chatStyles.chipDisabled,
                      ]}
                      onPress={() => toggleCategory(cat.id)}
                      activeOpacity={0.7}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          chatStyles.chipText,
                          selected && chatStyles.chipTextSelected,
                          disabled && chatStyles.chipTextDisabled,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedCats.length > 0 && (
                <View style={chatStyles.doneWrap}>
                  <TouchableOpacity
                    style={chatStyles.doneBtn}
                    onPress={handleCategoryDone}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#8DDBFF", "#268FFF"]}
                      style={chatStyles.doneGrad}
                    >
                      <Text style={chatStyles.doneBtnText}>
                        Done ({selectedCats.length}/3)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input - pinned at bottom, moves with keyboard */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#FFFFFF" }}>
          <View style={chatStyles.inputRow}>
            <TextInput
              style={chatStyles.input}
              value={input}
              onChangeText={setInput}
              placeholder={
                step === 0
                  ? "Monthly income (e.g. 50000)"
                  : step === 1
                  ? "Monthly budget (e.g. 40000)"
                  : step === 2
                  ? "Monthly savings goal (e.g. 10000)"
                  : step === 3 && !bigGoal
                  ? "Tap a goal or ask Finny anything..."
                  : step === 4
                  ? "Ask Finny anything..."
                  : "Type here..."
              }
              placeholderTextColor="#9CA3AF"
              keyboardType={step < 3 ? "numeric" : "default"}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[chatStyles.sendBtn, !input.trim() && chatStyles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={input.trim() ? ["#8DDBFF", "#268FFF"] : ["#E5E5E5", "#D4D4D4"]}
                style={chatStyles.sendGrad}
              >
                <PaperPlaneRight
                  size={s(18)}
                  color={input.trim() ? "#fff" : "#9CA3AF"}
                  weight="fill"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const chatStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  headerAvatar: { width: s(36), height: s(36), borderRadius: s(18) },
  headerName: { fontFamily: "Poppins_600SemiBold", fontSize: fs(16), color: "#18181B" },
  headerStatus: { fontFamily: "InstrumentSans_400Regular", fontSize: fs(12), color: "#9CA3AF" },

  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: s(16), paddingTop: s(12), paddingBottom: vs(16) },

  bubbleRow: { marginBottom: vs(12), flexDirection: "row", alignItems: "flex-end", gap: s(8) },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },

  avatar: { width: s(28), height: s(28), borderRadius: s(14) },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(18),
  },
  bubbleFinny: {
    backgroundColor: "#EFF6FF",
    borderBottomLeftRadius: s(4),
  },
  bubbleUser: {
    backgroundColor: "#18181B",
    borderBottomRightRadius: s(4),
  },
  bubbleText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  bubbleTextFinny: { color: "#18181B" },
  bubbleTextUser: { color: "#FFFFFF" },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(8),
    marginTop: vs(8),
    paddingLeft: s(36),
  },
  chip: {
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    backgroundColor: "#EFF6FF",
    borderRadius: br.pill,
  },
  chipSelected: {
    backgroundColor: "#3DA4FC",
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(13),
    color: "#3DA4FC",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  chipTextDisabled: {
    color: "#9CA3AF",
  },

  doneWrap: {
    paddingLeft: s(36),
    marginTop: vs(12),
  },
  doneBtn: {
    borderRadius: br.pill,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  doneGrad: {
    paddingHorizontal: s(24),
    paddingVertical: vs(10),
    borderRadius: br.pill,
  },
  doneBtnText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: fs(14),
    color: "#FFFFFF",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    paddingHorizontal: s(16),
    paddingTop: vs(10),
    paddingBottom: Platform.OS === "web" ? vs(16) : vs(12),
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontFamily: "InstrumentSans_400Regular",
    backgroundColor: "#F4F4F5",
    borderRadius: s(20),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    fontSize: fs(14),
    color: "#18181B",
  },
  sendBtn: {},
  sendBtnDisabled: { opacity: 0.6 },
  sendGrad: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Main Welcome Screen ──────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const [screen, setScreen] = useState<Screen>("home");
  const [chatUserName, setChatUserName] = useState("");

  if (screen === "create") {
    return (
      <CreateAccountScreen
        onBack={() => setScreen("home")}
        onSuccess={(name) => {
          setChatUserName(name);
          setScreen("chat");
        }}
        onSwitchToSignIn={() => setScreen("signin")}
      />
    );
  }

  if (screen === "signin") {
    return (
      <SignInScreen
        onBack={() => setScreen("home")}
        onSuccess={async (name) => {
          // Returning user — check if they already have a profile set up
          const profile = await Store.getProfile();
          if (profile && profile.name !== "Friend" && profile.monthlyIncome > 0) {
            router.replace("/(tabs)/home");
          } else {
            setChatUserName(name);
            setScreen("chat");
          }
        }}
        onSwitchToCreate={() => setScreen("create")}
      />
    );
  }

  if (screen === "chat") {
    return <ChatOnboarding userName={chatUserName} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageArea}>
        <Image
          source={require("../assets/welcome.png")}
          style={styles.welcomeImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "#ffffff"]}
          style={styles.imageFade}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.bottomSafe} edges={["bottom"]}>
        <View style={styles.bottomArea}>
          <Text style={styles.welcomeTitle}>{"Welcome to\nFinny"}</Text>
          <Text style={styles.welcomeSub}>Your smarter way to save and grow</Text>

          <View style={styles.buttonsArea}>
            <BlueButton
              label="Get Started"
              onPress={() => setScreen("create")}
            />
            <DarkButton
              label="Sign In"
              onPress={() => setScreen("signin")}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Welcome Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  imageArea: { width, height: height * 0.55 },
  welcomeImage: { width: "100%", height: "100%" },
  imageFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  bottomSafe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "flex-end",
  },
  bottomArea: {
    alignItems: "center",
    paddingHorizontal: s(24),
    paddingBottom: vs(12),
  },
  welcomeTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(36),
    lineHeight: fs(46),
    letterSpacing: -1,
    color: "#0A0A0A",
    textAlign: "center",
    marginBottom: vs(8),
    maxWidth: "90%",
  },
  welcomeSub: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(16),
    color: "#8A8A8A",
    textAlign: "center",
    marginBottom: vs(28),
  },
  buttonsArea: { width: "100%", gap: vs(12) },
});
