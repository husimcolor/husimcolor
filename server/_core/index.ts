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
import { getPrivateAnalysisPdfDownload } from "../commerce/private-pdf-download-service";
import { getRelationshipPrivatePdfDownload } from "../commerce/relationship-invite-service";

function queryValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function setPdfDownloadHeaders(res: express.Response, filename: string, length: number) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(length));
  res.setHeader("Content-Disposition", `attachment; filename="husimcolor-report.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

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

  // Vercel의 private-pdf-download 함수와 동일한 읽기 전용 개발 경로다.
  // 저장된 문서만 반환하며 PDF 재생성·outbox 생성·이메일 전송을 하지 않는다.
  app.all("/api/private-pdf-download", async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }
    try {
      const relationshipToken = queryValue(req.query.relationshipToken);
      const resultToken = queryValue(req.query.resultToken);
      const download = relationshipToken || resultToken
        ? await getRelationshipPrivatePdfDownload({ accessToken: relationshipToken, resultToken })
        : await getPrivateAnalysisPdfDownload({
            analysisRunId: Number(queryValue(req.query.analysisRunId)),
            productCode: queryValue(req.query.productCode) as "personal_deep" | "couple_love_deep" | "parent_child_deep",
            deliveryToken: queryValue(req.query.deliveryToken) ?? "",
          });
      setPdfDownloadHeaders(res, download.filename, download.content.length);
      res.status(200);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      res.end(download.content);
    } catch {
      // 접근 토큰 및 저장소 정보를 응답에서 노출하지 않는다.
      res.status(404).json({ error: "PDF_NOT_AVAILABLE" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
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
