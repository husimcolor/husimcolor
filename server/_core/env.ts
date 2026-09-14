// GitHub Actions의 정적 Expo 빌드와 Vercel 서버리스 런타임은 환경변수
// 주입 범위가 다를 수 있다. 이 값은 현재 프로젝트의 OAuth 등록 appId다.
export const HUSIMCOLOR_OAUTH_APP_ID = "mTvBGzpe4naoi2CdDkbujz";

export function resolveOAuthAppId(value = process.env.VITE_APP_ID): string {
  return value || HUSIMCOLOR_OAUTH_APP_ID;
}

export const ENV = {
  appId: resolveOAuthAppId(),
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
