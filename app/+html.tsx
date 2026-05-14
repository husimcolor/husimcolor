import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web HTML 래퍼 - OG 메타 태그 포함
 * 카카오톡, 인스타그램 등 SNS 공유 시 미리보기 표시에 사용됩니다.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* 기본 메타 */}
        <title>휴심컬러 - 컬러 심리 코칭</title>
        <meta
          name="description"
          content="25가지 컬러 중 3가지를 선택하면, 지금 내 마음의 흐름을 감성적으로 읽어드립니다. 심리 흐름 · 성격 흐름 · 오늘의 코칭 메시지를 확인해보세요."
        />
        <meta name="keywords" content="컬러심리, 컬러코칭, 심리테스트, 색채심리, 휴심컬러" />
        <meta name="author" content="휴심컬러" />

        {/* Open Graph (카카오톡, 페이스북, 인스타 등) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="휴심컬러" />
        <meta property="og:title" content="휴심컬러 - 컬러 심리 코칭" />
        <meta
          property="og:description"
          content="25가지 컬러 중 3가지를 선택하면, 지금 내 마음의 흐름을 감성적으로 읽어드립니다."
        />
        <meta
          property="og:image"
          content="https://d2xsxph8kpxj0f.cloudfront.net/310519663646006927/mTvBGzpe4naoi2CdDkbujz/og-image-UFm9JY9VEFD6rQ6JtyuaWJ.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://husimcolor.vercel.app" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="휴심컬러 - 컬러 심리 코칭" />
        <meta
          name="twitter:description"
          content="25가지 컬러 중 3가지를 선택하면, 지금 내 마음의 흐름을 감성적으로 읽어드립니다."
        />
        <meta
          name="twitter:image"
          content="https://d2xsxph8kpxj0f.cloudfront.net/310519663646006927/mTvBGzpe4naoi2CdDkbujz/og-image-UFm9JY9VEFD6rQ6JtyuaWJ.png"
        />

        {/* 모바일 웹앱 설정 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="휴심컬러" />
        <meta name="theme-color" content="#FAF8F3" />

        {/* 삼성 인터넷 등 브라우저 강제 다크모드 방지 */}
        <meta name="color-scheme" content="only light" />

        {/* 인앱 브라우저(인스타, 카톡, 구글 등) JS 로드 전 배경색 보장 - 투명 배경 방지 */}
        {/* CSS 변수 폴백: 구버전 Android WebView(카카오/인스타 인앱 브라우저)에서 ThemeProvider JS 실행 전 CSS 변수가 없어 텍스트가 투명하게 보이는 문제 방지 */}
        {/* @ts-ignore */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --color-foreground: #3D3530;
            --color-background: #FAF8F3;
            --color-surface: #F2EFE7;
            --color-muted: #9B8E85;
            --color-border: #DDD8CE;
            --color-primary: #8FA68E;
            --color-success: #5A8A5A;
            --color-warning: #C4956A;
            --color-error: #C45A5A;
          }
          html, body, #root {
            background-color: #FAF8F3 !important;
            color: #3D3530 !important;
            color-scheme: only light !important;
          }
          body { margin: 0; }
          * { -webkit-text-fill-color: inherit; }
        `}} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
