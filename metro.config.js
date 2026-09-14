const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const isCloudBuild = process.env.VERCEL === "1" || process.env.CI === "true";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // 로컬 개발에서는 NativeWind 캐시 파일을 생성해 HMR을 유지한다.
  // Vercel의 읽기 전용/감시 제약에서는 가상 CSS 모듈을 사용해
  // react-native-css-interop/.cache/web.css의 SHA 조회 실패를 방지한다.
  forceWriteFileSystem: !isCloudBuild,
});
