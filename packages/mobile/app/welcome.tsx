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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import {
  Microphone,
  PaperPlaneRight,
  ArrowLeft,
  Stop as StopIcon,
} from "phosphor-react-native";
import { Store, Auth } from "../lib/store";
import { s, vs, fs, r, br } from "../lib/responsive";
import { BlueButton } from "../components/BlueButton";
import { DarkButton } from "../components/DarkButton";
import { BlueOrb } from "../components/Orbs";

const logoSvg = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="48" height="48" fill="url(#paint0_linear_281_8450)"/>
<g clip-path="url(#clip0_281_8450)">
<path d="M21.5683 20.0317C23.5797 19.9332 24.4461 21.5195 24.3547 23.4684C24.3376 23.8314 24.3532 24.2601 24.3532 24.6298L24.3521 28.085C23.7975 28.1038 23.2037 28.092 22.6472 28.0909L22.6485 24.7794C22.6487 24.0614 22.727 23.0064 22.4542 22.3587C22.0705 21.4474 20.8342 21.4016 20.1866 22.0332C20.1717 22.0488 20.1569 22.0645 20.1421 22.0803C19.4553 22.8181 19.627 24.0185 19.5994 24.9738C19.5953 25.1144 19.5996 25.2614 19.5997 25.4025L19.6009 28.0871C19.0369 28.0923 18.4728 28.0932 17.9088 28.0899C17.9212 25.4745 17.9151 22.8592 17.8906 20.244C18.4256 20.2558 18.983 20.25 19.5198 20.2524L19.5235 21.3052C20.1242 20.4955 20.5542 20.1173 21.5683 20.0317Z" fill="#111111"/>
<path d="M29.2919 20.0336C30.6311 19.945 31.7406 20.7989 31.9679 22.2258C32.0989 23.0483 32.061 23.825 32.0608 24.654L32.059 28.0901C31.4906 28.096 30.9221 28.0979 30.3537 28.096L30.3539 24.7556C30.3539 24.0461 30.4218 23.0742 30.1861 22.4205C29.8335 21.4428 28.5487 21.3904 27.885 22.0449C27.8697 22.0607 27.8544 22.0767 27.8392 22.0929C27.3143 22.6598 27.3075 23.5193 27.3059 24.2696C27.3051 24.6929 27.3062 25.116 27.3066 25.5391L27.3068 28.0889C26.761 28.1056 26.1692 28.0941 25.6199 28.0934L25.6206 23.3841C25.6267 22.3389 25.6217 21.2936 25.6055 20.2485L27.2319 20.2538L27.2361 21.2978C27.3408 21.1701 27.4403 21.0226 27.5463 20.892C27.9902 20.3453 28.6309 20.0848 29.2919 20.0336Z" fill="#111111"/>
<path d="M32.4219 20.2478C33.011 20.2599 33.6004 20.2625 34.1896 20.2554C34.302 20.5378 34.428 20.9535 34.5264 21.2495L35.1337 23.0739L35.6105 24.5032C35.7398 24.88 35.9024 25.3085 36.0014 25.6905C36.5294 23.8931 37.244 22.0539 37.7737 20.2461C38.1462 20.2874 39.1346 20.256 39.5408 20.2535C39.2626 21.0834 38.9464 21.9252 38.6445 22.7469C38.256 23.8036 37.8837 24.8894 37.4891 25.9405C37.2549 26.5528 37.0481 27.1973 36.8158 27.8114C36.4828 28.6914 36.1605 29.9786 35.5135 30.6348C34.841 31.3171 33.8945 31.2363 33.0417 31.195C33.0617 30.7036 33.05 30.1428 33.0505 29.6467C34.6925 29.8775 34.6379 29.1825 35.1537 27.8131C35.0056 27.472 34.8272 26.9296 34.6953 26.561L33.9887 24.6037C33.4795 23.1826 32.8967 21.669 32.4219 20.2478Z" fill="#111111"/>
<path d="M12.2438 16.9834C12.5745 16.93 13.1557 17.0036 13.4912 17.0571C13.5025 17.5437 13.4926 18.0833 13.4926 18.5735C13.0181 18.4803 12.3721 18.3714 11.997 18.7807C11.6767 19.1302 11.7207 19.7954 11.7282 20.2505C12.2779 20.2644 12.8688 20.2539 13.422 20.2543L13.4211 21.7164C12.8642 21.7269 12.2901 21.7205 11.7319 21.7211C11.7048 22.4463 11.7208 23.2471 11.7216 23.9789L11.7236 27.9412C11.7251 28.0067 11.7275 28.0037 11.7056 28.064C11.5428 28.1112 10.2754 28.0809 10.0186 28.0807L10.0136 21.7229C9.63601 21.7078 9.18292 21.721 8.79942 21.7212L8.79688 20.2502L10.0108 20.2504C10.06 19.3645 9.92518 18.6073 10.5064 17.834C10.9619 17.2278 11.5535 17.0639 12.2438 16.9834Z" fill="#111111"/>
<path d="M14.8304 20.2461C15.3344 20.2685 15.9583 20.2516 16.4715 20.2528C16.4888 21.06 16.4754 21.9274 16.4765 22.7383L16.4808 27.6606L16.4757 28.0724C15.9029 28.0806 15.3302 28.0825 14.7574 28.0783L14.7602 21.7898C14.7609 21.5677 14.7373 20.384 14.7771 20.2631L14.8304 20.2461Z" fill="#111111"/>
<path d="M15.3932 16.9434C15.9606 16.8124 16.5192 17.2009 16.6384 17.8096C16.7577 18.4182 16.3922 19.0147 15.8235 19.1394C15.2591 19.2631 14.7074 18.8749 14.589 18.2707C14.4706 17.6666 14.8299 17.0734 15.3932 16.9434Z" fill="#111111"/>
</g>
<defs>
<linearGradient id="paint0_linear_281_8450" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
<stop stop-color="#E6F3FF"/>
<stop offset="1" stop-color="#63B0F2"/>
</linearGradient>
<clipPath id="clip0_281_8450">
<rect width="32" height="15.5429" fill="white" transform="translate(8 16)"/>
</clipPath>
</defs>
</svg>
`;

const userOrbSvg = `
<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_303_3443)">
<rect width="16.0262" height="16.0262" rx="8.0131" fill="#7AC13C"/>
<g filter="url(#filter1_f_303_3443)">
<ellipse cx="5.50901" cy="9.08914" rx="5.50901" ry="5.08524" fill="#C6F959"/>
<ellipse cx="5.50901" cy="9.08914" rx="5.50901" ry="5.08524" fill="white"/>
<ellipse cx="7.51291" cy="10.9368" rx="5.50901" ry="5.08524" fill="#F7FFE0"/>
</g>
</g>
<defs>
<filter id="filter1_f_303_3443" x="-4.00655" y="-0.00264359" width="21.0365" height="20.0326" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="2.00327" result="effect1_foregroundBlur_303_3443"/>
</filter>
<clipPath id="clip0_303_3443">
<rect width="16.0262" height="16.0262" rx="8.0131" fill="white"/>
</clipPath>
</defs>
</svg>
`;

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
            <View style={authStyles.logoWrap}>
              <SvgXml xml={logoSvg} width={s(64)} height={s(64)} />
            </View>
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
            <View style={authStyles.logoWrap}>
              <SvgXml xml={logoSvg} width={s(64)} height={s(64)} />
            </View>
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
  logoWrap: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    overflow: "hidden",
  },
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
      {isFinny ? <BlueOrb size={s(16)} /> : null}
      <View style={[chatStyles.bubble, isFinny ? chatStyles.bubbleFinny : chatStyles.bubbleUser]}>
        <Text
          style={[chatStyles.bubbleText, isFinny ? chatStyles.bubbleTextFinny : chatStyles.bubbleTextUser]}
        >
          {msg.text}
        </Text>
      </View>
      {!isFinny ? <SvgXml xml={userOrbSvg} width={s(16)} height={s(16)} /> : null}
    </Animated.View>
  );
}

function ChatOnboarding({ userName }: { userName: string }) {
  const insets = useSafeAreaInsets();
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
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? "";

  // Pulse animation for recording indicator
  useEffect(() => {
    if (recording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [recording, pulseAnim]);

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

  const transcribeBlob = useCallback(async (blob: Blob, filename: string) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, filename);
      const res = await fetch(`${baseUrl}api/transcribe`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.text?.trim()) {
          setInput((prev) => (prev ? prev + " " : "") + data.text.trim());
        }
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setTranscribing(false);
    }
  }, [baseUrl]);

  const startRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (blob.size < 1000) return;
          await transcribeBlob(blob, "recording.webm");
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setRecording(true);
      } catch (err) {
        console.error("Mic permission denied:", err);
      }
    } else {
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) { console.error("Mic permission denied"); return; }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording: rec } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        nativeRecordingRef.current = rec;
        setRecording(true);
      } catch (err) {
        console.error("Native recording error:", err);
      }
    }
  }, [transcribeBlob]);

  const stopRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        setRecording(false);
      }
    } else {
      const rec = nativeRecordingRef.current;
      if (!rec) return;
      setRecording(false);
      try {
        await rec.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const uri = rec.getURI();
        nativeRecordingRef.current = null;
        if (!uri) return;
        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" } as any);
          const res = await fetch(`${baseUrl}api/transcribe`, { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.text?.trim()) {
              setInput((prev) => (prev ? prev + " " : "") + data.text.trim());
            }
          }
        } catch (err) {
          console.error("Native transcription error:", err);
        } finally {
          setTranscribing(false);
        }
      } catch (err) {
        console.error("Native stop recording error:", err);
      }
    }
  }, [baseUrl]);

  const toggleRecording = useCallback(() => {
    if (recording) stopRecording();
    else startRecording();
  }, [recording, startRecording, stopRecording]);

  const renderInputBar = () => (
    <View style={chatStyles.inputBar}>
      <View style={[chatStyles.inputPill, recording && chatStyles.inputPillRecording]}>
        {recording ? (
          <View style={chatStyles.recordingRow}>
            <Animated.View style={[chatStyles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={chatStyles.recordingText}>Listening...</Text>
          </View>
        ) : transcribing ? (
          <View style={chatStyles.recordingRow}>
            <ActivityIndicator size="small" color="#268FFF" />
            <Text style={chatStyles.recordingText}>Transcribing...</Text>
          </View>
        ) : (
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
            multiline
            keyboardType={step < 3 ? "numeric" : "default"}
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        )}
        <TouchableOpacity
          style={[chatStyles.micBtn, recording && chatStyles.micBtnActive]}
          activeOpacity={0.7}
          onPress={toggleRecording}
          disabled={transcribing}
        >
          {recording ? (
            <StopIcon size={s(18)} color="#FFFFFF" weight="fill" />
          ) : (
            <Microphone size={s(20)} color={transcribing ? "#D1D5DB" : "#71717A"} weight="regular" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSend}
        disabled={!input.trim() || recording}
        activeOpacity={0.85}
      >
        <View style={[chatStyles.sendCircle, (!input.trim() || recording) && chatStyles.sendCircleOff]}>
          <PaperPlaneRight size={s(18)} color="#FFFFFF" weight="fill" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior="padding"
      keyboardVerticalOffset={0}
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
        <View style={{ backgroundColor: "#FFFFFF", paddingBottom: insets.bottom }}>
          {renderInputBar()}
        </View>
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
  messagesContent: { paddingHorizontal: s(16), paddingTop: s(12), paddingBottom: vs(8) },

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
    paddingHorizontal: s(14),
    paddingTop: vs(8),
    paddingBottom: Platform.OS === "web" ? vs(14) : vs(8),
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
    paddingVertical: vs(10),
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

  // Shared chat input styles for onboarding voice chat
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(4),
    paddingBottom: Platform.OS === "ios" ? vs(8) : vs(4),
    paddingHorizontal: s(16),
    gap: s(8),
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderRadius: s(50),
    paddingHorizontal: s(16),
    paddingVertical: Platform.OS === "ios" ? vs(8) : vs(2),
    minHeight: s(48),
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  inputPillRecording: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  micBtn: {
    padding: s(6),
    marginLeft: s(8),
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
    borderRadius: s(20),
    width: s(32),
    height: s(32),
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    marginLeft: s(8),
  },
  recordingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingVertical: vs(4),
  },
  recordingDot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: "#EF4444",
  },
  recordingText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: fs(14),
    color: "#6B7280",
  },
  sendCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: "#09090B",
    alignItems: "center",
    justifyContent: "center",
  },
  sendCircleOff: {
    opacity: 0.4,
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
