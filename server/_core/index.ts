import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerKakaoOAuthRoutes } from "./kakao-oauth";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getPublicSampleReportDownload } from "../public-sample-report-service";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerKakaoOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // 고객 결과와 분리된 한국어 공개 샘플 PDF의 개발 환경 호환 route.
  // 상품 allow-list 밖의 파일은 반환하지 않으며, POST/DB write를 수행하지 않는다.
  app.all("/api/public-sample-report", async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }
    try {
      const sample = await getPublicSampleReportDownload({ product: req.query.product });
      const download = req.query.download === "1";
      const range = typeof req.headers.range === "string" ? req.headers.range : undefined;
      const setHeaders = (length: number) => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", String(length));
        res.setHeader(
          "Content-Disposition",
          `${download ? "attachment" : "inline"}; filename="husimcolor-sample-report.pdf"; filename*=UTF-8''${encodeURIComponent(sample.filename)}`,
        );
        res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("Accept-Ranges", "bytes");
      };

      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/u.exec(range);
        const start = match?.[1] ? Number(match[1]) : 0;
        const end = match?.[2] ? Number(match[2]) : sample.content.length - 1;
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= sample.content.length) {
          res.setHeader("Content-Range", `bytes */${sample.content.length}`);
          res.status(416).end();
          return;
        }
        const boundedEnd = Math.min(end, sample.content.length - 1);
        const chunk = sample.content.subarray(start, boundedEnd + 1);
        setHeaders(chunk.length);
        res.setHeader("Content-Range", `bytes ${start}-${boundedEnd}/${sample.content.length}`);
        res.status(206).end(req.method === "HEAD" ? undefined : chunk);
        return;
      }

      setHeaders(sample.content.length);
      res.status(200).end(req.method === "HEAD" ? undefined : sample.content);
    } catch {
      res.status(404).json({ error: "PUBLIC_SAMPLE_NOT_AVAILABLE" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
