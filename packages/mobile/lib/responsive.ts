import { Dimensions, PixelRatio } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

// Base design size (iPhone 14 = 390)
const BASE_W = 390;
const BASE_H = 844;

export const sw = W;   // screen width
export const sh = H;   // screen height

// Scale a size relative to screen width
export function s(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel((W / BASE_W) * size));
}

// Scale a size relative to screen height
export function vs(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel((H / BASE_H) * size));
}

// Moderate scale (less aggressive — good for fonts)
export function ms(size: number, factor = 0.45): number {
  return Math.round(size + (s(size) - size) * factor);
}

// Responsive font size
export function fs(size: number): number {
  return ms(size, 0.4);
}

// Responsive padding/margin
export const r = {
  xs: s(6),
  sm: s(10),
  md: s(16),
  lg: s(20),
  xl: s(28),
  xxl: s(36),
};

// Border radius
export const br = {
  sm: s(8),
  md: s(12),
  lg: s(16),
  xl: s(20),
  pill: s(50),
};

// Is small screen (< 375)
export const isSmall = W < 375;
// Is large screen (>= 428, e.g. Pro Max)
export const isLarge = W >= 428;
