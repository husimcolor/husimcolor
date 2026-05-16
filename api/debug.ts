/**
 * Vercel 디버그 엔드포인트 - DB 연결 상태 확인용
 * 배포 후 /api/debug 로 접근하면 DB 연결 상태와 데이터 건수를 반환합니다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.status(200).json({
      status: "error",
      message: "DATABASE_URL not set",
      env: Object.keys(process.env).filter(k => k.startsWith("DATABASE") || k.startsWith("EXPO")),
    });
  }

  try {
    // SSL 파라미터 제거 후 연결
    const urlWithoutSsl = dbUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
    
    const pool = mysql.createPool({
      uri: urlWithoutSsl,
      ssl: { rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 3,
      connectTimeout: 10000,
    }).promise();

    const [[paymentRows]] = await pool.query("SELECT COUNT(*) as cnt FROM payment_records") as any;
    const [[visitorRows]] = await pool.query("SELECT COUNT(*) as cnt FROM visitor_logs") as any;
    const [[reviewRows]] = await pool.query("SELECT COUNT(*) as cnt FROM reviews") as any;
    
    await pool.end();

    return res.status(200).json({
      status: "ok",
      db_connected: true,
      payment_records: paymentRows.cnt,
      visitor_logs: visitorRows.cnt,
      reviews: reviewRows.cnt,
      url_prefix: dbUrl.substring(0, 30) + "...",
    });
  } catch (error: any) {
    return res.status(200).json({
      status: "error",
      db_connected: false,
      message: error.message,
      code: error.code,
      url_prefix: dbUrl.substring(0, 30) + "...",
    });
  }
}
