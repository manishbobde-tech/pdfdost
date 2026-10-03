/** Shared PDF helpers (pdf-lib for writing, pdf.js for rendering). */
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;

export const readAsBytes = (f: File): Promise<Uint8Array> =>
  f.arrayBuffer().then((b) => new Uint8Array(b));

export async function loadPdfLib(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes.slice());
}

export async function loadPdfJs(bytes: Uint8Array): Promise<any> {
  const task = (pdfjsLib as any).getDocument({ data: bytes.slice().buffer });
  return task.promise;
}

export async function renderPageToCanvas(pdf: any, pageNum: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function pageSize(pdf: any, pageNum: number): Promise<{ width: number; height: number }> {
  const page = await pdf.getPage(pageNum);
  const v = page.getViewport({ scale: 1 });
  return { width: v.width, height: v.height };
}

/** Parse "1-3, 8, 10-12" into sorted page numbers, clamped to [1, max]. */
export function parseRanges(input: string, max: number): number[] {
  const pages = new Set<number>();
  for (const part of input.split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Math.min(+m[1], +m[2]);
      const b = Math.max(+m[1], +m[2]);
      for (let i = a; i <= b; i++) if (i >= 1 && i <= max) pages.add(i);
    } else if (/^\d+$/.test(p)) {
      const i = +p;
      if (i >= 1 && i <= max) pages.add(i);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export { PDFDocument };
