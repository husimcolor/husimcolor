import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

function readPngDimensions(relativePath: string) {
  const data = fs.readFileSync(path.join(projectRoot, relativePath));
  expect(data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

describe("휴심컬러 앱 웹 홈 화면 메타데이터", () => {
  it("표시 이름, manifest, favicon, Apple 아이콘을 모두 선언한다", () => {
    const html = readSource("app/+html.tsx");

    expect(html).toContain('<meta name="application-name" content="휴심컬러" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="휴심컬러" />');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest" />');
    expect(html).toContain('<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />');
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
  });

  it("연꽃 심볼 기반 any·maskable 아이콘과 다중 크기 favicon을 제공한다", () => {
    const manifest = JSON.parse(readSource("public/site.webmanifest"));

    expect(manifest.name).toBe("휴심컬러");
    expect(manifest.short_name).toBe("휴심컬러");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/pwa-icon-192.png", sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ src: "/pwa-icon-512.png", sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ src: "/pwa-icon-maskable-512.png", sizes: "512x512", purpose: "maskable" }),
      ]),
    );

    expect(readPngDimensions("public/pwa-icon-192.png")).toEqual({ width: 192, height: 192 });
    expect(readPngDimensions("public/pwa-icon-512.png")).toEqual({ width: 512, height: 512 });
    expect(readPngDimensions("public/pwa-icon-maskable-512.png")).toEqual({ width: 512, height: 512 });
    expect(readPngDimensions("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });

    const favicon = fs.readFileSync(path.join(projectRoot, "public/favicon.ico"));
    expect(favicon.subarray(0, 4)).toEqual(Buffer.from([0x00, 0x00, 0x01, 0x00]));
  });
});
