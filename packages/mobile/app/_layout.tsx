import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useCallback } from "react";
import { Toast, toastConfig } from "../components/FinnyToast";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { View } from "react-native";

// Keep splash visible until we're ready
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    Asset.loadAsync([
      require("../assets/onboarding1.png"),
      require("../assets/onboarding2.png"),
      require("../assets/onboarding3.png"),
      require("../assets/welcome.png"),
    ]).then(() => setAssetsLoaded(true)).catch(() => setAssetsLoaded(true));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && assetsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, assetsLoaded]);

  // Don't render anything until ready — splash stays visible
  if (!fontsLoaded || !assetsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Stack screenOptions={{ headerShown: false, animation: "none" }} />
          <Toast config={toastConfig} />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
