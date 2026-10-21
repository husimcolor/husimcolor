import { existsSync, statSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const videoCard = readFileSync(
  `${root}/components/introduction-video-card.tsx`,
  "utf8",
);
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, "utf8");
const freeResultScreen = readFileSync(
  `${root}/app/(tabs)/result.tsx`,
  "utf8",
);
const relationshipStartScreen = readFileSync(
  `${root}/app/(tabs)/couple-start.tsx`,
  "utf8",
);

const personalVideo = `${root}/assets/videos/personal-deep-analysis-introduction-ko.mp4`;
const relationshipVideo = `${root}/assets/videos/relationship-how-to-use-ko.mp4`;
const personalPoster = `${root}/assets/images/video-posters/personal-deep-analysis-introduction-ko.jpg`;
const relationshipPoster = `${root}/assets/images/video-posters/relationship-how-to-use-ko.jpg`;

describe("한국어 소개 영상 카드", () => {
  it("사용자가 제공한 세로 영상과 포스터를 모두 포함한다", () => {
    for (const path of [
      personalVideo,
      relationshipVideo,
      personalPoster,
      relationshipPoster,
    ]) {
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(100_000);
    }
  });

  it("포스터를 먼저 보이고 탭한 뒤에만 플레이어를 마운트하며 자동재생하지 않는다", () => {
    expect(videoCard).toContain("const [isOpen, setIsOpen] = useState(false)");
    expect(videoCard).toContain("isOpen ? (");
    expect(videoCard).toContain("<OnDemandVideoPlayer");
    expect(videoCard).toContain("useVideoPlayer(source");
    expect(videoCard).not.toContain(".play()");
    expect(videoCard).toContain("createdPlayer.loop = false");
    expect(videoCard).toContain("contentFit=\"contain\"");
    expect(videoCard).toContain("aspectRatio: 9 / 16");
    expect(videoCard).toContain("nativeControls");
  });

  it("개인 심화 안내에 최종 개인 영상을 넣고 샘플·결제 CTA를 유지한다", () => {
    for (const source of [homeScreen, freeResultScreen]) {
      expect(source).toContain("개인 심화분석 소개 영상");
      expect(source).toContain("personal-deep-analysis-introduction-ko.mp4");
      expect(source).toContain(
        "personal-deep-analysis-introduction-ko.jpg",
      );
    }
    expect(homeScreen).toContain("handlePersonalDeepEntry");
    expect(homeScreen).toContain("handleOpenSamplePdf('personal_deep')");
    expect(freeResultScreen).toContain("handleOpenPersonalSamplePdf");
    expect(freeResultScreen).toContain(
      "router.push('/(tabs)/commerce-checkout?product=personal_deep' as any)",
    );
  });

  it("관계 영상은 부부·연인 상품 카드에만 넣고 부모·자녀와 무료 친구 흐름은 보존한다", () => {
    expect(relationshipStartScreen).toContain('product.id === "romantic"');
    expect(relationshipStartScreen).toContain("두 사람이 이용하는 방법");
    expect(relationshipStartScreen).toContain("relationship-how-to-use-ko.mp4");
    expect(relationshipStartScreen).toContain("relationship-how-to-use-ko.jpg");
    expect(relationshipStartScreen).toContain('setSelectedProductId("friend")');
    expect(relationshipStartScreen).toContain("handleFreeFriendStart");
    expect(relationshipStartScreen).toContain("handleOpenSamplePdf(sampleProduct)");
    expect(relationshipStartScreen).not.toContain('product.id === "parent-child" ? (\n                      <IntroductionVideoCard');
  });
});
