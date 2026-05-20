import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { s } from "../lib/responsive";

const userOrbSvg = `
<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_303_3443)">
<rect width="16.0262" height="16.0262" rx="8.0131" fill="#7AC13C"/>
<g filter="url(#filter1_f_303_3443)">
<ellipse cx="5.50901" cy="9.08914" rx="5.50901" ry="5.08524" fill="#C6F959"/>
<ellipse cx="5.50901" cy="9.08914" rx="5.50901" ry="5.08524" fill="white"/>
<ellipse cx="7.51291" cy="10.9368" rx="5.50901" ry="5.08524" fill="#F7FFE0"/>
</g>
</g>
<defs>
<filter id="filter1_f_303_3443" x="-4.00655" y="-0.00264359" width="21.0365" height="20.0326" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="2.00327" result="effect1_foregroundBlur_303_3443"/>
</filter>
<clipPath id="clip0_303_3443">
<rect width="16.0262" height="16.0262" rx="8.0131" fill="white"/>
</clipPath>
</defs>
</svg>
`;

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

/**
 * User Orb — SVG (lime)
 * Matches the onboarding user orb.
 */
export function UserOrb({ size = s(16) }: { size?: number }) {
  return <SvgXml xml={userOrbSvg} width={size} height={size} />;
}
