import { useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

import { useLocalization } from "@/lib/localization-context";
import { localizeStaticCopy } from "@/lib/zh-cn-copy";

interface IntroductionVideoCardProps {
  title: string;
  description: string;
  videoSource: number;
  posterSource: ImageSourcePropType;
  accessibilityLabel: string;
}

function OnDemandVideoPlayer({
  source,
  title,
  closeLabel,
  onClose,
}: {
  source: number;
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  // This subtree is rendered only after an intentional tap. Keeping the player
  // unmounted on the product screen prevents the browser from requesting the
  // full MP4 before the visitor chooses to play it.
  const player = useVideoPlayer(source, (createdPlayer) => {
    createdPlayer.loop = false;
    createdPlayer.staysActiveInBackground = false;
    createdPlayer.showNowPlayingNotification = false;
  });

  return (
    <View style={styles.playerSection}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        playsInline
        style={styles.video}
        accessibilityLabel={title}
      />
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${closeLabel}: ${title}`}
      >
        <Text style={styles.closeButtonText}>{closeLabel}</Text>
      </Pressable>
    </View>
  );
}

/**
 * A poster-first video card. The poster is the only visual rendered initially;
 * the MP4 player is created after the visitor presses the card, never autoplaying.
 */
export function IntroductionVideoCard({
  title,
  description,
  videoSource,
  posterSource,
  accessibilityLabel,
}: IntroductionVideoCardProps) {
  const { locale } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const localize = (copy: string) => localizeStaticCopy(copy, locale);
  const localizedTitle = localize(title);
  const closeLabel = localize("영상 닫기");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{localizedTitle}</Text>
      <Text style={styles.description}>{localize(description)}</Text>
      {isOpen ? (
        <OnDemandVideoPlayer
          source={videoSource}
          title={localizedTitle}
          closeLabel={closeLabel}
          onClose={() => setIsOpen(false)}
        />
      ) : (
        <Pressable
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.posterButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={localize(accessibilityLabel)}
        >
          <Image
            source={posterSource}
            style={styles.poster}
            resizeMode="contain"
            accessibilityLabel={`${localizedTitle} ${localize("썸네일")}`}
          />
          <View style={styles.playPill} pointerEvents="none">
            <Text style={styles.playPillText}>{localize("▶ 재생하기")}</Text>
          </View>
        </Pressable>
      )}
      <Text style={styles.notice}>
        {localize("탭한 뒤에만 재생기를 열며, 자동재생하지 않습니다.")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8C8B4",
    backgroundColor: "#FFFDFC",
    padding: 14,
  },
  title: {
    alignSelf: "stretch",
    color: "#3D2B1F",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
    textAlign: "center",
  },
  description: {
    alignSelf: "stretch",
    color: "#6E6257",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  posterButton: {
    width: 240,
    aspectRatio: 9 / 16,
    maxWidth: "100%",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#F3EFE9",
    borderWidth: 1,
    borderColor: "#E1D6C6",
    justifyContent: "center",
    alignItems: "center",
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  playPill: {
    position: "absolute",
    bottom: 14,
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: "rgba(45, 36, 32, 0.86)",
    alignItems: "center",
    justifyContent: "center",
  },
  playPillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  playerSection: {
    width: 240,
    maxWidth: "100%",
    gap: 8,
    alignItems: "center",
  },
  video: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 12,
    backgroundColor: "#181512",
  },
  closeButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BCA98F",
    backgroundColor: "#FFF9F0",
  },
  closeButtonText: {
    color: "#75512C",
    fontSize: 13,
    fontWeight: "800",
  },
  notice: {
    alignSelf: "stretch",
    color: "#7B7166",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
});
