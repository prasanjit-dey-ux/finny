import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { s } from "../lib/responsive";

/**
 * Blue Orb — Finny AI avatar
 * Gradient circle: #8DDBFF → #268FFF
 */
export function BlueOrb({ size = s(16) }: { size?: number }) {
  return (
    <LinearGradient
      colors={["#8DDBFF", "#268FFF"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
}

/**
 * Green Orb — User avatar
 * Gradient circle: #6EE7B7 → #34D399
 */
export function GreenOrb({ size = s(16) }: { size?: number }) {
  return (
    <LinearGradient
      colors={["#6EE7B7", "#34D399"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
}
