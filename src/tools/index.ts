import { mergeTool } from './merge';
import { splitTool } from './split';
import { compressTool } from './compress';
import { rotateTool } from './rotate';
import { imagesToPdfTool } from './images-to-pdf';
import { pdfToImagesTool } from './pdf-to-images';
import { watermarkTool } from './watermark';
import { signTool } from './sign';
import { pagenumbersTool } from './page-numbers';

export interface ToolDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  render: (root: HTMLElement) => void;
}

export const tools: ToolDef[] = [
  mergeTool,
  splitTool,
  compressTool,
  rotateTool,
  imagesToPdfTool,
  pdfToImagesTool,
  watermarkTool,
  signTool,
  pagenumbersTool,
];
