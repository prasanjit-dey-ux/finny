import { Text, TouchableOpacity, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function DarkButton({ label, onPress, style }: Props) {
  return (
    <View style={[st.shadowWrapper, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={st.border}>
        <LinearGradient
          colors={["#555555", "#0B0B0B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={st.gradient}
        >
          {/* Inset top highlight — only top 28px */}
          <LinearGradient
            colors={["rgba(255,255,255,0.20)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={st.insetHighlight}
            pointerEvents="none"
          />

          {/* Inset bottom dark line */}
          <View style={st.insetBottom} pointerEvents="none" />

          <Text style={st.label}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  shadowWrapper: {
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  border: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    overflow: "hidden",
  },
  gradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  insetHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  insetBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textTransform: "capitalize",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
