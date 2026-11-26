import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();
const bannerSource = readFileSync(`${root}/components/december-event-banner.tsx`, "utf8");
const pageSource = readFileSync(`${root}/app/(tabs)/december-coupons.tsx`, "utf8");
const homeSource = readFileSync(`${root}/app/(tabs)/index.tsx`, "utf8");
const relationshipSource = readFileSync(`${root}/app/(tabs)/couple-start.tsx`, "utf8");

type Element = { type: string | ((props: any) => Element | null); props: Record<string, any> };
const jsx = (type: Element["type"], props: Element["props"]): Element => ({ type, props });
const native = Object.fromEntries(["ActivityIndicator", "FlatList", "Pressable", "Text", "View"].map((name) => [name, name]));
const nativeModules = { ...native, StyleSheet: { create: (value: unknown) => value } };

/** Render the TSX contract without a browser, DB, Metro or native runtime. */
function loadTsx(source: string, dependencies: Record<string, unknown> = {}) {
  const module = { exports: {} as Record<string, any> };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": nativeModules,
    ...dependencies,
  };
  runInNewContext(compiled.outputText, {
    module,
    exports: module.exports,
    require: (name: string) => {
      if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`);
      return modules[name];
    },
  });
  return module.exports;
}
const banner = loadTsx(bannerSource);

function nodes(value: any): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("type" in value)) return [];
  if (typeof value.type === "function") return nodes(value.type(value.props));
  const nested = [...nodes(value.props.children), ...nodes(value.props.ListHeaderComponent), ...nodes(value.props.ListFooterComponent)];
  if (value.type === "FlatList") {
    nested.push(...value.props.data.flatMap((item: unknown) => nodes(value.props.renderItem({ item }))));
  }
  return [value, ...nested];
}
function text(value: any): string {
  if (Array.isArray(value)) return value.map(text).join("");
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  if (typeof value.type === "function") return text(value.type(value.props));
  const listText = value.type === "FlatList"
    ? value.props.data.map((item: unknown) => text(value.props.renderItem({ item }))).join("")
    : "";
  return text(value.props.children) + text(value.props.ListHeaderComponent) + listText + text(value.props.ListFooterComponent);
}

const offers = [
  { productCode: "personal_deep", name: "개인 심화 리포트", couponCode: "PERSONAL-SERVER-CODE", listAmountKrw: 29_000, finalAmountKrw: 9_900, discountType: "fixed", discountValue: 19_100, state: "available" },
  { productCode: "couple_love_deep", name: "부부·연인 관계 리포트", couponCode: "COUPLE-SERVER-CODE", listAmountKrw: 59_000, finalAmountKrw: 23_600, discountType: "percent", discountValue: 60, state: "available" },
  { productCode: "parent_child_deep", name: "부모·자녀 관계 리포트", couponCode: "PARENT-SERVER-CODE", listAmountKrw: 39_000, finalAmountKrw: 15_600, discountType: "percent", discountValue: 60, state: "available" },
];
function pageHarness(options: { authenticated?: boolean; active?: boolean; states?: string[]; error?: boolean; pending?: boolean } = {}) {
  const status = {
    active: options.active ?? true,
    serverNow: new Date("2026-12-05T12:00:00+09:00"),
    startsAt: new Date("2026-12-01T00:00:00+09:00"),
    endsAt: new Date("2027-01-01T00:00:00+09:00"),
    offers: offers.map((offer, index) => ({ ...offer, state: options.states?.[index] ?? offer.state })),
  };
  const push = vi.fn();
  const login = vi.fn(() => true);
  const mutateAsync = vi.fn(async () => ({ ...status, offers: status.offers.map((offer) => ({ ...offer, state: "issued" })) }));
  const refetch = vi.fn();
  const setData = vi.fn();
  const invalidate = vi.fn();
  const query = { data: status, isSuccess: !options.error, isError: Boolean(options.error), isLoading: false, isFetching: false, refetch };
  const page = loadTsx(pageSource, {
    react: { useEffect: vi.fn(), useRef: (value: unknown) => ({ current: value }), useState: (value: unknown) => [value, vi.fn()] },
    "expo-router": { useRouter: () => ({ push, replace: vi.fn() }) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 0 }) },
    "@/components/screen-container": { ScreenContainer: "ScreenContainer" },
    "@/components/december-event-banner": banner,
    "@/constants/oauth": { startKakaoLogin: login },
    "@/hooks/use-auth": { useAuth: () => ({ isAuthenticated: options.authenticated ?? false, loading: false, error: null, refresh: vi.fn() }) },
    "@/lib/trpc": { trpc: {
      useUtils: () => ({ commerce: { coupons: { decemberStatus: { setData, invalidate } } } }),
      commerce: { coupons: {
        decemberStatus: { useQuery: () => query },
        claimDecember: { useMutation: () => ({ mutateAsync, reset: vi.fn(), isPending: options.pending ?? false, isError: false }) },
      } },
    } },
  });
  const tree = page.default();
  const allNodes = nodes(tree);
  const claimButton = allNodes.find((node) => node.props.testID === "december-claim-all")!;
  return { tree, allNodes, claimButton, push, login, mutateAsync, refetch, setData, invalidate };
}

describe("12월 이벤트 UI 계약", () => {
  it("활성 서버 값일 때만 배너를 표시하고 한국어 필수 문구를 실제 Text에 렌더링한다", () => {
    expect(banner.DecemberEventBanner({ active: false, onPress: vi.fn() })).toBeNull();
    const press = vi.fn();
    const tree = banner.DecemberEventBanner({ active: true, onPress: press });
    for (const copy of ["12월 연말 감사 이벤트", "한 해 동안 애써온 나에게,", "소중한 우리 가족에게,", "마음을 이해하는 시간을 선물하세요.", "개인 심화 리포트 9,900원 파격 특가", "부부·연인 / 부모·자녀 관계 리포트 60% 할인", "12.01 ~ 12.31", "할인 쿠폰 받기"]) {
      expect(text(tree)).toContain(copy);
    }
    expect(nodes(tree).some((node) => node.type === "Image")).toBe(false);
    nodes(tree).find((node) => node.props.testID === "december-event-cta")!.props.onPress();
    expect(press).toHaveBeenCalledOnce();
  });

  it("기기 시계가 아니라 서버 active와 상품별 응답 금액으로 가격을 결정한다", () => {
    expect(banner.getActiveDecemberOffer(undefined, "personal_deep")).toBeUndefined();
    expect(banner.getActiveDecemberOffer({ active: false, offers }, "personal_deep")).toBeUndefined();
    expect(banner.getActiveDecemberOffer({ active: true, offers }, "couple_love_deep")).toEqual(offers[1]);
    const customOffer = { ...offers[0], listAmountKrw: 31_000, finalAmountKrw: 8_700 };
    const priceText = text(banner.DecemberOfferPrice({ offer: customOffer }));
    expect(priceText).toContain("정가 31,000원");
    expect(priceText).toContain("8,700원");
    expect(priceText).toContain("로그인 쿠폰 적용 시");
    expect(bannerSource).not.toContain("Date.now(");
    expect(bannerSource).not.toContain("new Date(");
  });

  it("배너는 홈 로고 다음, 회원 및 서비스 카드보다 앞에 있고 관리자 5탭을 유지한다", () => {
    expect(homeSource.indexOf("<DecemberEventBanner")).toBeGreaterThan(homeSource.indexOf("onPress={handleAdminLogoTap}"));
    expect(homeSource.indexOf("<DecemberEventBanner")).toBeLessThan(homeSource.indexOf("styles.textSection,"));
    expect(homeSource).toContain("ADMIN_LOGO_TAP_COUNT_REQUIRED = 5");
    expect(homeSource).toContain("decemberActive && styles.eventLogoContainer");
    expect(homeSource).toContain("eventLogoContainer: { width: 64, height: 64");
    for (const source of [homeSource, relationshipSource]) {
      expect(source).toContain("trpc.commerce.coupons.decemberStatus.useQuery");
      expect(source).toContain("decemberStatus.data?.active === true");
      expect(source).toContain("<DecemberOfferPrice offer=");
      expect(source).toContain("december-coupons");
      expect(source).not.toMatch(/setLanguage\(["']zh["']/);
    }
  });

  it("계정 전환을 재조회하고 화면이 열린 상태의 시작·종료를 10초 폴링으로 반영한다", () => {
    for (const source of [homeSource, relationshipSource, pageSource]) {
      expect(source).toContain("refetchInterval: 10_000");
      expect(source).toContain("[auth.user?.id, auth.loading, refetchDecemberStatus]");
      expect(source).toContain("if (!auth.loading) void refetchDecemberStatus()");
      expect(source).not.toContain("isDecemberCampaignActive(");
    }
  });

  it("세 상품을 표시하고 전체 발급 버튼은 하나만 제공한다", () => {
    const harness = pageHarness();
    expect(harness.allNodes.filter((node) => node.props.testID?.startsWith("december-coupon-"))).toHaveLength(3);
    expect(harness.allNodes.filter((node) => node.props.testID === "december-claim-all")).toHaveLength(1);
    expect(text(harness.tree)).toContain("9,900원");
    expect(text(harness.tree)).toContain("23,600원");
    expect(text(harness.tree)).toContain("15,600원");
  });

  it("비로그인 계정은 카카오 로그인 후 쿠폰 화면으로 돌아오며 발급 API를 호출하지 않는다", () => {
    const harness = pageHarness();
    harness.claimButton.props.onPress();
    expect(harness.login).toHaveBeenCalledWith("/december-coupons");
    expect(harness.mutateAsync).not.toHaveBeenCalled();
    expect(pageSource).not.toContain("AsyncStorage");
    expect(pageSource).not.toContain("deviceId");
    expect(pageSource).not.toContain("TextInput");
    expect(pageSource).not.toMatch(/email\s*:/);
  });

  it("로그인 계정의 전체 발급은 입력 없이 실행하고 서버 반환 상태로 캐시를 갱신한다", async () => {
    const harness = pageHarness({ authenticated: true });
    harness.claimButton.props.onPress();
    await vi.waitFor(() => expect(harness.setData).toHaveBeenCalledOnce());
    expect(harness.mutateAsync).toHaveBeenCalledWith();
    expect(harness.login).not.toHaveBeenCalled();
    expect(harness.invalidate).toHaveBeenCalledOnce();
  });

  it("기간 외·로딩·오류·모두 발급 상태에서 새 쿠폰 발급을 막는다", () => {
    for (const options of [{ active: false }, { pending: true }, { error: true }, { states: ["issued", "reserved", "used"] }]) {
      const harness = pageHarness({ authenticated: true, ...options });
      expect(harness.claimButton.props.disabled).toBe(true);
      harness.claimButton.props.onPress();
      expect(harness.mutateAsync).not.toHaveBeenCalled();
    }
    const inactive = pageHarness({ active: false });
    expect(text(inactive.tree)).not.toContain("9,900원");
    expect(text(inactive.tree)).not.toContain("60% 할인");
  });

  it("발급·예약·사용 상태를 표시하고 발급된 쿠폰만 해당 상품 checkout에 전달한다", () => {
    const harness = pageHarness({ authenticated: true, states: ["issued", "reserved", "used"] });
    const rendered = text(harness.tree);
    expect(rendered).toContain("발급 완료");
    expect(rendered).toContain("결제 예약 중");
    expect(rendered).toContain("사용 완료");
    const links = harness.allNodes.filter((node) => node.props.accessibilityLabel?.endsWith("결제 화면 보기"));
    links.forEach((link) => link.props.onPress());
    expect(harness.push).toHaveBeenNthCalledWith(1, "/(tabs)/commerce-checkout?product=personal_deep&couponCode=PERSONAL-SERVER-CODE");
    expect(harness.push).toHaveBeenNthCalledWith(2, "/(tabs)/commerce-checkout?product=couple_love_deep");
    expect(harness.push).toHaveBeenNthCalledWith(3, "/(tabs)/commerce-checkout?product=parent_child_deep");
  });

  it("쿼리 오류 재시도와 기존 무료·영상·샘플·관계 즉시 결제·친구 흐름을 유지한다", () => {
    const harness = pageHarness({ error: true });
    harness.allNodes.find((node) => node.type === "Pressable" && text(node) === "다시 시도")!.props.onPress();
    expect(harness.refetch).toHaveBeenCalledOnce();
    expect(pageSource).toContain("claim.isError");
    expect(pageSource).toContain("ActivityIndicator");
    expect(homeSource).toContain("onPress={handleStart}");
    expect(homeSource).toContain("onPress={handlePersonalDeepEntry}");
    expect(homeSource).toContain("personal-deep-analysis-introduction-ko.mp4");
    expect(homeSource).toContain("handleOpenSamplePdf('personal_deep')");
    expect(relationshipSource).toContain("openPaidCheckout(paidProductCode)");
    expect(relationshipSource).toContain('setSelectedProductId("friend")');
    expect(relationshipSource).toContain('params: { relationType: "친구" }');
    expect(relationshipSource).toContain("handleOpenSamplePdf(sampleProduct)");
  });
});
