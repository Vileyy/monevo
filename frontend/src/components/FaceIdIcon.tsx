import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

type FaceIdIconProps = {
  size?: number;
  color?: string;
};

export function FaceIdIcon({ size = 24, color = "#0F172A" }: FaceIdIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9V7a3 3 0 0 1 3-3h2 M15 4h2a3 3 0 0 1 3 3v2 M20 15v2a3 3 0 0 1-3 3h-2 M9 20H7a3 3 0 0 1-3-3v-2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={9.2} y={8.9} width={1.8} height={3.7} rx={0.9} fill={color} />
      <Rect x={13} y={8.9} width={1.8} height={3.7} rx={0.9} fill={color} />
      <Path
        d="M9.2 14.6a4.5 4.5 0 0 0 5.6 0"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
