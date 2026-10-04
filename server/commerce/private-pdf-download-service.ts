import { and, eq, gt } from "drizzle-orm";

import { analysisRuns, privateDocuments, products } from "../../drizzle/schema";
import type { CommerceProductCode } from "../../shared/commerce";
import { getDb } from "../db";
import { storageGetBuffer } from "../storage";
import { verifyAnalysisDeliveryGrant } from "./entitlement-service";
import { getPrivatePdfFilename, type AnalysisPdfKind } from "./pdf-delivery-policy";

export type PrivatePdfDownload = {
  filename: string;
  content: Buffer;
};

function isAnalysisPdfKind(value: string): value is AnalysisPdfKind {
  return value === "personal_deep" || value === "couple_love_deep" || value === "parent_child_deep";
}

/**
 * A delivery token is a short-lived, signed bearer grant that is already issued
 * after an entitlement is consumed. The stored private document is reused;
 * this path never creates a new PDF or queues another email.
 */
export async function getPrivateAnalysisPdfDownload(input: {
  analysisRunId: number;
  productCode: CommerceProductCode;
  deliveryToken: string;
}): Promise<PrivatePdfDownload> {
  const grant = verifyAnalysisDeliveryGrant({
    accessToken: input.deliveryToken,
    analysisRunId: input.analysisRunId,
    productCode: input.productCode,
  });
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const rows = await db
    .select({
      storageKey: privateDocuments.storageKey,
      productCode: products.code,
    })
    .from(privateDocuments)
    .innerJoin(analysisRuns, eq(privateDocuments.analysisRunId, analysisRuns.id))
    .innerJoin(products, eq(analysisRuns.productId, products.id))
    .where(and(
      eq(analysisRuns.id, input.analysisRunId),
      eq(analysisRuns.customerId, grant.customerId),
      eq(products.code, input.productCode),
      eq(privateDocuments.status, "generated"),
      gt(privateDocuments.retentionExpiresAt, new Date()),
    ))
    .limit(1);
  const document = rows[0];
  if (!document?.storageKey || !isAnalysisPdfKind(document.productCode)) {
    throw new Error("PRIVATE_PDF_NOT_AVAILABLE");
  }

  return {
    filename: getPrivatePdfFilename(document.productCode),
    content: await storageGetBuffer(document.storageKey),
  };
}
