import { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.8,
  } as TextStyle,
  title1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  } as TextStyle,
  title2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  } as TextStyle,
  title3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
  } as TextStyle,
  headline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  } as TextStyle,
  bodyBold: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  } as TextStyle,
  callout: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  } as TextStyle,
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  } as TextStyle,
  footnote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  } as TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500",
  } as TextStyle,
  tabular: {
    fontVariant: ["tabular-nums"],
  } as TextStyle,
} as const;
