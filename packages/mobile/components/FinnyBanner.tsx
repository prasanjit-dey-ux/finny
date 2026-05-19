import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { s, vs, fs } from "../lib/responsive";

export function FinnyBanner() {
  const router = useRouter();

  return (
    <View style={st.wrapper}>
      {/* Card — clips stripes inside */}
      <View style={st.card}>
        {/* Decorative diagonal stripes */}
        <View style={st.stripe1} />
        <View style={st.stripe2} />

        {/* Text content */}
        <View style={st.content}>
          <Text style={st.title}>Ask Finny Anything</Text>
          <Text style={st.subtitle}>
            Get instant AI-powered advice on your spending, savings, and financial goals.
          </Text>

          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/finny")}
            activeOpacity={0.85}
            style={st.btnOuter}
          >
            <LinearGradient
              colors={["#030712", "#09090b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.btnInner}
            >
              <View style={st.btnHighlight} />
              <Text style={st.btnText}>Chat with Finny</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mascot — floats outside card via absolute + zIndex */}
      <Image
        source={require("../assets/finny-mascot.png")}
        style={st.mascot}
        resizeMode="contain"
      />
    </View>
  );
}

const st = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: vs(16),
  },
  card: {
    height: vs(172),
    backgroundColor: "#C3F53C",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "#D8F282",
    overflow: "hidden",
  },

  // Diagonal stripes
  stripe1: {
    position: "absolute",
    width: 16,
    height: 260,
    backgroundColor: "#E0FF8B",
    right: s(10),
    top: -60,
    transform: [{ rotate: "130deg" }],
  },
  stripe2: {
    position: "absolute",
    width: 16,
    height: 280,
    backgroundColor: "#E0FF8B",
    right: s(90),
    top: -60,
    transform: [{ rotate: "40deg" }],
  },

  // Left text block
  content: {
    position: "absolute",
    left: s(16),
    top: vs(16),
    right: s(140),
    gap: vs(4),
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(16),
    lineHeight: fs(22),
    color: "#000000",
    marginBottom: vs(2),
  },
  subtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(11),
    lineHeight: fs(18),
    color: "#577353",
    marginBottom: vs(8),
  },

  // CTA button
  btnOuter: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  btnInner: {
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: 999,
    overflow: "hidden",
  },
  btnHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  btnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(12),
    color: "#ffffff",
    letterSpacing: -0.2,
  },

  // Mascot — overlaps right edge
  mascot: {
    position: "absolute",
    right: -s(10),
    bottom: -vs(25),
    width: s(160),
    height: s(160),
    zIndex: 10,
  },
});
