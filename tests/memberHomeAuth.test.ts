import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("홈 화면 회원 진입", () => {
  const home = read("app/(tabs)/index.tsx");
  const memberPage = read("app/(tabs)/my-page.tsx");

  it("비로그인 상태에서 same-origin Kakao 로그인을 시작한다", () => {
    expect(home).toContain("startKakaoLogin('/my-page')");
    expect(home).toContain("로그인 · 회원가입 · 카카오로 시작하기");
    expect(home).toContain("trpc.auth.kakaoStatus.useQuery()");
  });

  it("로그인 상태에서는 홈과 회원 페이지 모두 마이페이지·로그아웃을 제공한다", () => {
    expect(home).toContain("마이페이지");
    expect(home).toContain("로그아웃");
    expect(memberPage).toContain("로그아웃");
  });

  it("구매 이메일은 6자리 소유권 확인 뒤에만 이력을 연결한다고 안내한다", () => {
    expect(memberPage).toContain("입력만으로 주문은 연결되지 않습니다.");
    expect(memberPage).toContain("이메일 확인·이력 연결");
    expect(home).not.toContain("createTossLive");
    expect(home).not.toContain("queueAndSendPdf");
  });
});
