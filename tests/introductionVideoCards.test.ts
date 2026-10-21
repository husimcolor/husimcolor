import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { localizeStaticCopy } from "../lib/zh-cn-copy";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");
const checksum = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

const videoCard = read("components/introduction-video-card.tsx");
const homeScreen = read("app/(tabs)/index.tsx");
const freeResultScreen = read("app/(tabs)/result.tsx");
const relationshipStartScreen = read("app/(tabs)/couple-start.tsx");

const assets = [
  {
    path: `${root}/assets/videos/personal-deep-analysis-introduction-ko.mp4`,
    checksum: "d8bce98c688fe9d8ec6e5f4a2d21c5230c2c4473e7b36bf86636d5edc79f42b2",
  },
  {
    path: `${root}/assets/videos/relationship-how-to-use-ko.mp4`,
    checksum: "a0dc84767091618e04619f4d26ae2ab081a8f6c87a3dd45222fc79acf0ccdcfb",
  },
  {
    path: `${root}/assets/images/video-posters/personal-deep-analysis-introduction-ko.jpg`,
    checksum: "0aa743e683c5b069e59440e3c10b65d73fbcbe9d5aff67310f277162b90a39eb",
  },
  {
    path: `${root}/assets/images/video-posters/relationship-how-to-use-ko.jpg`,
    checksum: "e675632f05e1d90dbaafb2b7cb042942a45e273e516c2f9db78d38959e584b1f",
  },
] as const;

describe("zh-CN introduction video cards", () => {
  it("keeps the supplied videos and posters at the reference paths without changing their contents", () => {
    for (const asset of assets) {
      expect(existsSync(asset.path)).toBe(true);
      expect(statSync(asset.path).size).toBeGreaterThan(100_000);
      expect(checksum(asset.path)).toBe(asset.checksum);
    }
  });

  it("shows a poster first and mounts the player only after a tap, without autoplay", () => {
    expect(videoCard).toContain("const [isOpen, setIsOpen] = useState(false)");
    expect(videoCard).toContain("isOpen ? (");
    expect(videoCard).toContain("<OnDemandVideoPlayer");
    expect(videoCard).toContain("useVideoPlayer(source");
    expect(videoCard).not.toContain(".play()");
    expect(videoCard).toContain("createdPlayer.loop = false");
    expect(videoCard).toContain('contentFit="contain"');
    expect(videoCard).toContain("aspectRatio: 9 / 16");
    expect(videoCard).toContain("nativeControls");
  });

  it("uses the reviewed Simplified Chinese title, description, and accessibility copy", () => {
    expect(localizeStaticCopy("개인 심화분석 소개 영상", "zh-CN")).toBe(
      "个人深度分析介绍视频",
    );
    expect(localizeStaticCopy("두 사람이 이용하는 방법", "zh-CN")).toBe(
      "两人使用方法",
    );
    expect(localizeStaticCopy("개인 심화분석 소개 영상 재생하기", "zh-CN")).toBe(
      "播放个人深度分析介绍视频",
    );
    expect(localizeStaticCopy("두 사람이 이용하는 방법 영상 재생하기", "zh-CN")).toBe(
      "播放两人使用方法视频",
    );
    expect(localizeStaticCopy("실제 심화테스트 화면과 리포트 예시를 짧게 확인해 보세요.", "zh-CN")).toBe(
      "用短片了解实际深度测试界面和报告示例。",
    );
    expect(localizeStaticCopy("각자 참여하고 초대 링크로 결과를 함께 확인하는 흐름을 살펴보세요.", "zh-CN")).toBe(
      "请了解两人分别参与，并通过邀请链接一起查看结果的流程。",
    );
    expect(localizeStaticCopy("탭한 뒤에만 재생기를 열며, 자동재생하지 않습니다.", "zh-CN")).toBe(
      "仅在点击后打开播放器，不会自动播放。",
    );
    expect(videoCard).toContain("localizeStaticCopy(copy, locale)");
  });

  it("places the final personal video in home and free-result upsells without replacing their sample or checkout CTAs", () => {
    for (const source of [homeScreen, freeResultScreen]) {
      expect(source).toContain("개인 심화분석 소개 영상");
      expect(source).toContain("personal-deep-analysis-introduction-ko.mp4");
      expect(source).toContain("personal-deep-analysis-introduction-ko.jpg");
    }
    expect(homeScreen).toContain("handlePersonalDeepEntry");
    expect(homeScreen).toContain("handleOpenSampleReport('personal_deep')");
    expect(freeResultScreen).toContain("handleOpenPersonalSampleReport");
    expect(freeResultScreen).toContain(
      "router.push('/(tabs)/commerce-checkout?product=personal_deep' as any)",
    );
  });

  it("limits the relationship video to the romantic card and preserves parent-child and free-friend flows", () => {
    expect(relationshipStartScreen).toContain('product.id === "romantic" ? (');
    expect(relationshipStartScreen).toContain("두 사람이 이용하는 방법");
    expect(relationshipStartScreen).toContain("relationship-how-to-use-ko.mp4");
    expect(relationshipStartScreen).toContain("relationship-how-to-use-ko.jpg");
    expect(relationshipStartScreen.match(/<IntroductionVideoCard/g)).toHaveLength(1);
    expect(relationshipStartScreen).toContain("openPaidCheckout(productCode)");
    expect(relationshipStartScreen).toContain("handleOpenSampleReport(sampleProduct)");
    expect(relationshipStartScreen).toContain('setSelectedFreeProductId("friend")');
    expect(relationshipStartScreen).toContain("onPress={handleStart}");
  });
});
