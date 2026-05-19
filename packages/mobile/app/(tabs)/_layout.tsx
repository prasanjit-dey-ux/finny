import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { House, CreditCard, Heart } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, vs, fs } from "../../lib/responsive";
import { AiGradientButton } from "../../components/AskAiButtons";

type TabDef = {
  key: string;
  label: string;
  icon: (color: string, size: number, weight: "regular" | "fill" | "bold") => React.ReactNode;
};

const TABS: TabDef[] = [
  { key: "home", label: "Home", icon: (c, sz, w) => <House size={sz} color={c} weight={w} /> },
  { key: "spends", label: "Spends", icon: (c, sz, w) => <CreditCard size={sz} color={c} weight={w} /> },
  { key: "wishes", label: "Wishlist", icon: (c, sz, w) => <Heart size={sz} color={c} weight={w} /> },
  { key: "finny", label: "Ask AI", icon: () => null },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, vs(8));

  // Hide tab bar on Finny screen
  const currentRoute = state.routes[state.index];
  if (currentRoute?.name === "finny") return null;

  return (
    <View style={[st.bar, { paddingBottom: bottomPad }]}>
      <View style={st.barInner}>
        {/* Left pill group — Home, Spends, Wishes */}
        <View style={st.pillGroup}>
          {state.routes.slice(0, 3).map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tab = TABS[index];
            if (!tab) return null;

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isFocused) {
              return (
                <Pressable key={route.key} onPress={onPress} style={st.activeWrap}>
                  <View style={st.activePill}>
                    {tab.icon("#000", s(18), "fill")}
                    <Text style={st.activeLabel}>{tab.label}</Text>
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable key={route.key} onPress={onPress} style={st.inactiveWrap}>
                {tab.icon("#71717A", s(20), "regular")}
              </Pressable>
            );
          })}
        </View>

        {/* Right side — Ask AI (gradient text, no bg) */}
        {(() => {
          const finnyIndex = 3;
          const route = state.routes[finnyIndex];
          const isFocused = state.index === finnyIndex;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return <AiGradientButton onPress={onPress} />;
        })()}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="spends" />
      <Tabs.Screen name="wishes" />
      <Tabs.Screen name="finny" />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: {
    backgroundColor: "#FFFFFF",
    paddingTop: vs(8),
    paddingHorizontal: s(16),
  },
  barInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(14),
  },

  // Left pill group container
  pillGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: s(120),
    paddingVertical: vs(5),
    paddingHorizontal: s(5),
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  // Inactive tab inside pill
  inactiveWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(14),
    height: s(42),
  },

  // Active tab — nested darker pill
  activeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    backgroundColor: "#D4D4D8",
    borderRadius: s(90),
    paddingHorizontal: s(16),
    height: s(42),
  },
  activeLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(13),
    color: "#3F3F46",
  },


});
