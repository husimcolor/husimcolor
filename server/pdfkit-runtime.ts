import PDFKitModule from "pdfkit";

type PdfDocumentConstructor = typeof PDFKitModule;

/**
 * PDFKit is CommonJS. The locally bundled server function receives the
 * constructor directly, while some Vercel prebuilt runtime resolutions expose
 * it under `default`. Normalize both forms before any report is generated.
 */
export function resolvePdfDocumentConstructor(moduleValue: unknown): PdfDocumentConstructor {
  const defaultExport = (moduleValue as { default?: unknown } | null)?.default;
  const resolved = typeof moduleValue === "function"
    ? moduleValue
    : typeof defaultExport === "function"
      ? defaultExport
      : null;

  if (!resolved) throw new Error("PDFKIT_CONSTRUCTOR_UNAVAILABLE");
  return resolved as PdfDocumentConstructor;
}

export const PDFDocument = resolvePdfDocumentConstructor(PDFKitModule);
