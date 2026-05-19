import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Animated, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect, useCallback } from "react";
import { Microphone, CaretLeft, PaperPlaneRight, Stop as StopIcon } from "phosphor-react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Store } from "../../lib/store";
import { s, vs, fs } from "../../lib/responsive";
import { Audio } from "expo-av";
import { BlueOrb, GreenOrb } from "../../components/Orbs";

const { height: SCREEN_H } = Dimensions.get("window");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_EMPTY = [
  "What's my balance?",
  "Add ₹500 expense",
  "Can I afford this?",
  "Show my savings",
  "Set a budget",
];

const SUGGESTED_CHAT = [
  "Add to wishlist",
  "Set a budget",
  "Show my expenses",
  "How much did I save?",
];

export default function FinnyScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? "";
  const router = useRouter();

  // Transition animations
  const gradientAnim = useRef(new Animated.Value(0)).current;    // 0 = visible, 1 = slid down
  const headingAnim = useRef(new Animated.Value(1)).current;     // 1 = visible, 0 = gone
  const chatAnim = useRef(new Animated.Value(0)).current;        // 0 = hidden, 1 = visible

  // Breathing gradient animation
  const breatheAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!chatActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 5000, useNativeDriver: false }),
          Animated.timing(breatheAnim, { toValue: 0, duration: 5000, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [chatActive]);

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
    } else {
      pulseAnim.setValue(1);
    }
  }, [recording]);

  const transitionToChat = useCallback(() => {
    setChatActive(true);
    Animated.parallel([
      // Fade out gradient
      Animated.timing(gradientAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Fade out heading
      Animated.timing(headingAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      // Fade in chat
      Animated.timing(chatAnim, { toValue: 1, duration: 500, delay: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Recording / Transcription ────────────────────────────────────────────
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
  }, [baseUrl, transcribeBlob]);

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
  }, [baseUrl, transcribeBlob]);

  const toggleRecording = useCallback(() => {
    if (recording) stopRecording();
    else startRecording();
  }, [recording, startRecording, stopRecording]);

  // ─── Send Message ─────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    // Transition to chat mode on first real send
    if (!chatActive) transitionToChat();

    const summary = await Store.getSummary();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const apiMessages = updated.map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch(`${baseUrl}api/chat-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, context: summary }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat API error:", response.status, errorText);
        throw new Error(`API ${response.status}`);
      }

      const data = await response.json();
      let content = data.content || "";

      const actionMatch = content.match(/\[ACTION:\s*(\{[\s\S]*\})\s*\]/);
      const cleanContent = content.replace(/\[ACTION:\s*\{[\s\S]*\}\s*\]/, "").trim();

      if (actionMatch) {
        try {
          const jsonStr = actionMatch[1].trim();
          const actionData = JSON.parse(jsonStr);
          const result = await Store.executeAction(actionData.action, actionData);
          content = cleanContent || result || "Done!";
        } catch (e) {
          console.error("Action parse error:", e);
          content = cleanContent || "I tried to do that but hit an issue. Try again!";
        }
      } else {
        content = cleanContent || content;
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content } : m)
      );
    } catch (err: any) {
      console.error("Finny chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Oops, couldn't connect. Try again!" }
            : m
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ─── Message renderer ─────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const displayContent = item.content.replace(/\[ACTION:[\s\S]*\]/, "").trim();
    return (
      <View style={st.msgBlock}>
        <View style={[st.nameRow, isUser && st.nameRowUser]}>
          {!isUser && <BlueOrb size={s(16)} />}
          <Text style={st.nameLabel}>{isUser ? "You" : "Finny"}</Text>
          {isUser && <GreenOrb size={s(16)} />}
        </View>
        <View style={[st.bubbleWrap, isUser && st.bubbleWrapUser]}>
          <View style={[st.bubble, isUser ? st.bubbleUser : st.bubbleAI]}>
            {!isUser && displayContent === "" && item.content === "" ? (
              <View style={{ flexDirection: "row", gap: s(4), alignItems: "center" }}>
                <ActivityIndicator size="small" color="#268FFF" />
                <Text style={st.thinkingText}>Thinking...</Text>
              </View>
            ) : (
              <Text style={[st.bubbleText, isUser && st.bubbleTextUser]}>
                {displayContent || "Done!"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Input Bar (shared between both states) ───────────────────────────────
  const renderInputBar = (variant: "empty" | "chat") => (
    <View style={[st.inputBar, variant === "empty" && st.inputBarEmpty]}>
      <View style={[
        st.inputPill,
        variant === "empty" && st.inputPillEmpty,
        recording && st.inputPillRecording,
      ]}>
        {recording ? (
          <View style={st.recordingRow}>
            <Animated.View style={[st.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={st.recordingText}>Listening...</Text>
          </View>
        ) : transcribing ? (
          <View style={st.recordingRow}>
            <ActivityIndicator size="small" color="#268FFF" />
            <Text style={st.recordingText}>Transcribing...</Text>
          </View>
        ) : (
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#A1A1AA"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
        )}
        <TouchableOpacity
          style={[st.micBtn, recording && st.micBtnActive]}
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
        onPress={() => sendMessage()}
        disabled={!input.trim() || loading || recording}
        activeOpacity={0.85}
      >
        <View style={[st.sendCircle, (!input.trim() || loading || recording) && st.sendCircleOff]}>
          <PaperPlaneRight size={s(18)} color="#FFFFFF" weight="fill" />
        </View>
      </TouchableOpacity>
    </View>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────

  // Animated gradient position for breathing
  const gradientOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <KeyboardAvoidingView
      style={st.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* ── EMPTY STATE (gradient background) ── */}
      <Animated.View
        style={[
          st.emptyState,
          {
            opacity: gradientAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
        pointerEvents={chatActive ? "none" : "auto"}
      >
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientOpacity }]}>
            <LinearGradient
              colors={["#FFFFFF", "#D7EDFF", "#84C6FF", "#1D92F6", "#0073D5"]}
              locations={[0, 0.5, 0.75, 0.875, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Header over gradient */}
          <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
            <View style={st.emptyHeader}>
              <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <CaretLeft size={s(22)} color="#09090B" weight="bold" />
              </TouchableOpacity>
              <Text style={st.headerTitle}>Ask Finny</Text>
              <View style={{ width: s(40) }} />
            </View>
          </SafeAreaView>

          {/* Centered content */}
          <View style={st.emptyCenter}>
            <Text style={st.emptyHeading}>Ask Finny anything</Text>

            {renderInputBar("empty")}

            {/* Horizontal auto-suggest chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.emptyChipScroll}
              style={st.emptyChipScrollWrap}
            >
              {SUGGESTED_EMPTY.map((s_) => (
                <TouchableOpacity key={s_} style={st.emptyChip} onPress={() => sendMessage(s_)} activeOpacity={0.7}>
                  <Text style={st.emptyChipText}>{s_}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <SafeAreaView edges={["bottom"]} />
        </Animated.View>

      {/* ── CHAT STATE ── */}
      <Animated.View
        style={[
          st.chatState,
          { opacity: chatAnim },
        ]}
        pointerEvents={chatActive ? "auto" : "none"}
      >
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
          <View style={st.chatHeader}>
            <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <CaretLeft size={s(22)} color="#09090B" weight="bold" />
            </TouchableOpacity>
            <Text style={st.headerTitle}>Ask Finny</Text>
            <View style={{ width: s(40) }} />
          </View>
        </SafeAreaView>

        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={st.msgList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />

          {/* Horizontal suggestion chips */}
          <View style={st.chipWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.chipScroll}
              keyboardShouldPersistTaps="handled"
            >
              {SUGGESTED_CHAT.map((s_) => (
                <TouchableOpacity key={s_} style={st.chatChip} onPress={() => sendMessage(s_)} activeOpacity={0.7}>
                  <Text style={st.chatChipText}>{s_}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fff" }}>
            {renderInputBar("chat")}
          </SafeAreaView>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  // ── Empty State ──
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  emptyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    paddingBottom: vs(12),
  },
  emptyCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(24),
    marginTop: -vs(40),
  },
  emptyHeading: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(24),
    color: "#09090B",
    marginBottom: vs(20),
    textAlign: "center",
  },
  emptyChipScrollWrap: {
    alignSelf: "stretch",
    marginTop: vs(16),
    maxHeight: vs(48),
  },
  emptyChipScroll: {
    paddingLeft: 0,
    paddingRight: s(16),
    gap: s(8),
    flexDirection: "row",
    alignItems: "center",
  },
  emptyChip: {
    backgroundColor: "#EFF6FF",
    borderRadius: s(50),
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
  },
  emptyChipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(13),
    color: "#3DA4FC",
  },

  // ── Chat State ──
  chatState: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  // ── Shared ──
  backBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(17),
    color: "#09090B",
  },

  // ── Messages ──
  msgList: { padding: s(20), paddingBottom: vs(4), flexGrow: 1 },
  msgBlock: { marginBottom: vs(20) },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    marginBottom: vs(6),
  },
  nameRowUser: {
    justifyContent: "flex-end",
  },
  nameLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(13),
    color: "#09090B",
  },
  bubbleWrap: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bubbleWrapUser: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: s(18),
    padding: s(14),
    paddingHorizontal: s(16),
  },
  bubbleAI: {
    backgroundColor: "#EFF6FF",
    borderTopLeftRadius: s(4),
  },
  bubbleUser: {
    backgroundColor: "#EFF6FF",
    borderTopRightRadius: s(4),
  },
  bubbleText: {
    fontSize: fs(14),
    fontFamily: "InstrumentSans_400Regular",
    color: "#63B0F2",
    lineHeight: fs(21),
  },
  bubbleTextUser: {
    color: "#696969",
  },
  thinkingText: {
    fontSize: fs(13),
    fontFamily: "InstrumentSans_400Regular",
    color: "#94A3B8",
  },

  // ── Chat suggestion chips (horizontal) ──
  chipWrapper: {
    flexShrink: 0,
  },
  chipScroll: {
    paddingHorizontal: s(16),
    paddingTop: vs(6),
    paddingBottom: vs(4),
    gap: s(8),
    flexDirection: "row",
  },
  chatChip: {
    backgroundColor: "#EFF6FF",
    borderRadius: s(50),
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
  },
  chatChipText: {
    fontSize: fs(13),
    fontFamily: "Poppins_400Regular",
    color: "#3DA4FC",
    lineHeight: fs(17),
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: vs(4),
    paddingBottom: vs(6),
    paddingHorizontal: s(16),
    gap: s(8),
  },
  inputBarEmpty: {
    paddingHorizontal: 0,
    alignSelf: "stretch",
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
  inputPillEmpty: {
    backgroundColor: "#FFFFFF",
    borderColor: "transparent",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: "InstrumentSans_400Regular",
    color: "#1A1A2E",
    maxHeight: vs(100),
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  micBtn: {
    padding: s(4),
    marginLeft: s(4),
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
  inputPillRecording: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  recordingRow: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
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

  // ── Send button (black circle) ──
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
