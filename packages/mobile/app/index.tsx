import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { s, vs, fs } from "../lib/responsive";
import { BlueButton } from "../components/BlueButton";
import { Store } from "../lib/store";

const { width, height } = Dimensions.get("window");

const SPLASH_LETTERS = ["f", "i", "n", "n", "y"];

// ── Onboarding slides ────────────────────────────────────────────────────────

const SLIDES = [
  {
    image: require("../assets/onboarding1.png"),
    title: "Know Where Your\nMoney Goes",
    subtitle: "Track income, expenses, and savings.\nAll in one place.",
    btn: "Next",
  },
  {
    image: require("../assets/onboarding2.png"),
    title: "Turn Wishes Into\nPlans",
    subtitle: "Add a goal. We'll tell you when you\ncan afford it.",
    btn: "Next",
  },
  {
    image: require("../assets/onboarding3.png"),
    title: "Ask Your AI\nAdvisor",
    subtitle: "Get instant answers about your\nspending, savings, and goals.",
    btn: "Get Started",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// Animated Splash Screen
// ═════════════════════════════════════════════════════════════════════════════

function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const letterAnims = useRef(
    SPLASH_LETTERS.map(() => new Animated.Value(0))
  ).current;

  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Each letter fades in one after another
    const letterSequence = letterAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    );

    Animated.sequence([
      Animated.delay(400),
      // Stagger: each letter appears after the previous
      Animated.stagger(140, letterSequence),
      // Hold for a moment
      Animated.delay(1500),
      // Fade everything out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
    });
  }, []);

  return (
    <Animated.View style={[splashSt.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={["#E6F3FF", "#63B0F2"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={splashSt.wordRow}>
        {SPLASH_LETTERS.map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              splashSt.letterText,
              { opacity: letterAnims[i] },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
    </Animated.View>
  );
}

const splashSt = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  letterText: {
    color: "#000",
    fontFamily: "Inter_600SemiBold",
    fontSize: s(48),
    lineHeight: s(56),
    letterSpacing: -s(1.44),
    fontWeight: "600",
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// Main Screen
// ═════════════════════════════════════════════════════════════════════════════

export default function OnboardingScreen() {
  const [phase, setPhase] = useState<"splash" | "checking" | "onboarding">("splash");
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<Animated.Value>(new Animated.Value(0)).current;
  const flatRef = useRef<any>(null);
  const navigating = useRef(false);

  // Fade-in animations per slide
  const fadeAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(SLIDES.map(() => new Animated.Value(30))).current;

  const handleSplashDone = () => {
    setPhase("checking");
  };

  // Check profile after splash is done
  useEffect(() => {
    if (phase !== "checking") return;

    (async () => {
      try {
        const profile = await Store.getProfile();
        if (profile && profile.name !== "Friend" && profile.monthlyIncome > 0) {
          router.replace("/(tabs)/home");
          return;
        }
      } catch {}
      setPhase("onboarding");
      // Animate first slide in
      animateSlide(0);
    })();
  }, [phase]);

  const animateSlide = (index: number) => {
    fadeAnims[index].setValue(0);
    slideAnims[index].setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnims[index], {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnims[index], {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goNext = () => {
    if (navigating.current) return;
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      currentRef.current = next;
      setCurrent(next);
      animateSlide(next);
    } else {
      navigating.current = true;
      router.replace("/welcome");
    }
  };

  const currentRef = useRef(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (navigating.current) return;
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (idx !== undefined && idx !== currentRef.current) {
        currentRef.current = idx;
        setCurrent(idx);
        animateSlide(idx);
      }
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // During splash or checking, show splash overlay
  if (phase === "splash") {
    return (
      <View style={styles.container}>
        <AnimatedSplash onDone={handleSplashDone} />
      </View>
    );
  }

  if (phase === "checking") {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient
          colors={["#E6F3FF", "#63B0F2"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={styles.page}>
      {/* Image — fills top area */}
      <View style={styles.imageArea}>
        <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "#ffffff"]}
          style={styles.imageFade}
          pointerEvents="none"
        />
      </View>

      {/* Title & subtitle only — button/dots are fixed outside FlatList */}
      <View style={styles.textArea}>
        <Animated.Text
          style={[
            styles.heading,
            {
              opacity: fadeAnims[index],
              transform: [{ translateY: slideAnims[index] }],
            },
          ]}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.paragraph,
            {
              opacity: fadeAnims[index],
              transform: [
                {
                  translateY: Animated.multiply(slideAnims[index], 0.6),
                },
              ],
            },
          ]}
        >
          {item.subtitle}
        </Animated.Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Fixed bottom — dots + button never scroll */}
      <SafeAreaView style={styles.bottomSafe} edges={["bottom"]}>
        <View style={styles.bottomArea}>
          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, di) => {
              const isActive = di === current;
              return isActive ? (
                <LinearGradient
                  key={di}
                  colors={["#8DDBFF", "#268FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dotActive}
                />
              ) : (
                <View key={di} style={styles.dot} />
              );
            })}
          </View>

          {/* Button */}
          <BlueButton label={SLIDES[current].btn} onPress={goNext} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  page: {
    width,
    flex: 1,
  },

  imageArea: {
    height: height * 0.55,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: vs(80),
  },

  textArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(16),
  },

  bottomSafe: {
    backgroundColor: "#ffffff",
  },
  bottomArea: {
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
  },

  heading: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(34),
    lineHeight: fs(44),
    letterSpacing: -1,
    color: "#0A0A0A",
    textAlign: "center",
    marginBottom: vs(10),
  },
  paragraph: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(15),
    lineHeight: fs(23),
    color: "#8A8A8A",
    textAlign: "center",
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginBottom: vs(24),
  },
  dot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: "#D0D0D0" },
  dotActive: { width: s(24), height: s(8), borderRadius: s(4) },
});
