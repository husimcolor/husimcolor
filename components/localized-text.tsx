import React from "react";
import { Text as NativeText, type TextProps } from "react-native";

import { useLocalization } from "@/lib/localization-context";
import { localizeStaticCopy } from "@/lib/zh-cn-copy";

function localizeChildren(value: React.ReactNode, locale: "ko" | "zh-CN"): React.ReactNode {
  if (typeof value === "string") return localizeStaticCopy(value, locale);
  if (Array.isArray(value)) return value.map((item) => localizeChildren(item, locale));
  return value;
}

/** Existing Korean JSX stays the canonical source; zh-CN renders from the reviewed catalog only. */
export function LocalizedText({ children, ...props }: TextProps) {
  const { locale } = useLocalization();
  return <NativeText {...props}>{localizeChildren(children, locale)}</NativeText>;
}
