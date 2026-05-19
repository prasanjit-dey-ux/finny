import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { s, vs, fs } from "../lib/responsive";

const logo = require("../assets/images/logo.png");

/* ─── Orb dot (the small multi-layered circle) ─── */
function OrbDot({ size = s(16) }: { size?: number }) {
  const inner = size * 0.625;
  const topOff = size * 0.25;
  const leftOff = size * 0.125;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#0EA5E9", overflow: "hidden" }}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: "#BFDBFE", position: "absolute", left: 0, top: topOff }} />
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: "#FFFFFF", position: "absolute", left: 0, top: topOff }} />
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: "#BAE6FD", position: "absolute", left: leftOff, top: topOff + size * 0.115 }} />
    </View>
  );
}

/* ─── Gradient Text (blue linear gradient clipped to text) ─── */
function GradientText({ text, style }: { text: string; style?: any }) {
  if (Platform.OS === "web") {
    // Web supports background-clip natively
    return (
      <Text
        style={[
          styles.baseText,
          style,
          {
            // @ts-ignore — web-only CSS
            backgroundImage: "linear-gradient(180deg, #8DDBFF 0%, #268FFF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          } as any,
        ]}
      >
        {text}
      </Text>
    );
  }

  // Native: use MaskedView
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.baseText, style]}>{text}</Text>
      }
    >
      <LinearGradient colors={["#8DDBFF", "#268FFF"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <Text style={[styles.baseText, style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

/* ═══════════════════════════════════════════════════
   1. AI Gradient Button (no bg — just orb + gradient text)
   Used as default in tab bar
   ═══════════════════════════════════════════════════ */
export function AiGradientButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.gradientWrap}>
      <Image source={logo} style={styles.orbIcon} />
      <GradientText text="Ask AI" />
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════
   2. AI Dark Button (dark gradient bg, white text, glow)
   Premium feel — for CTAs, modals, etc.
   ═══════════════════════════════════════════════════ */
export function AiDarkButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={["#090414", "#04020B"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.darkWrap}
      >
        <OrbDot size={s(16)} />
        <Text style={styles.darkText}>Ask AI</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* Shared */
  baseText: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    textTransform: "capitalize",
  },
  orbIcon: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
  },

  /* Gradient button (no bg) */
  gradientWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    paddingHorizontal: s(10),
    height: s(42) + vs(10),
  },

  /* Dark button */
  darkWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    borderRadius: s(50),
    paddingHorizontal: s(16),
    height: s(42) + vs(10),
    borderWidth: 1,
    borderColor: "#1C1332",
    // Shadow layers
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
    overflow: "hidden",
  },
  darkText: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
});
