/**
 * Custom Toast configuration matching Finny design system
 * Usage: showToast("success", "Title", "Message")
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Toast, { BaseToast, ToastConfig } from "react-native-toast-message";
import { CheckCircle, WarningCircle, Info, XCircle } from "phosphor-react-native";
import { s, vs, fs } from "../lib/responsive";

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: "#F0FDF4", border: "#BBF7D0", color: "#16A34A" },
  error: { icon: XCircle, bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
  info: { icon: Info, bg: "#EFF6FF", border: "#BFDBFE", color: "#2563EB" },
  warning: { icon: WarningCircle, bg: "#FFFBEB", border: "#FDE68A", color: "#D97706" },
};

function CustomToast({ type, text1, text2 }: { type: keyof typeof TOAST_TYPES; text1?: string; text2?: string }) {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  return (
    <View style={[st.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Icon size={s(20)} color={config.color} weight="fill" />
      <View style={st.textWrap}>
        {text1 ? <Text style={[st.title, { color: config.color }]}>{text1}</Text> : null}
        {text2 ? <Text style={st.message}>{text2}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <CustomToast type="success" text1={props.text1} text2={props.text2} />,
  error: (props) => <CustomToast type="error" text1={props.text1} text2={props.text2} />,
  info: (props) => <CustomToast type="info" text1={props.text1} text2={props.text2} />,
  warning: (props) => <CustomToast type="warning" text1={props.text1} text2={props.text2} />,
};

/** Convenience helper — call from anywhere */
export function showToast(
  type: "success" | "error" | "info" | "warning",
  title: string,
  message?: string,
) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    topOffset: vs(60),
  });
}

export { Toast };

const st = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderRadius: s(14),
    borderWidth: 1,
    marginHorizontal: s(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    maxWidth: 420,
  },
  textWrap: {
    flex: 1,
    gap: vs(2),
  },
  title: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  message: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: fs(13),
    color: "#52525B",
    lineHeight: fs(18),
  },
});
