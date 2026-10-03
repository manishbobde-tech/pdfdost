import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { ToolDef } from './index';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes } from '../lib/pdf';

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15c1.5 1.5 4.5 1.5 6 0"/></svg>`;

export const watermarkTool: ToolDef = {
  id: 'watermark',
  title: 'Watermark PDF',
  desc: 'Stamp diagonal text across every page — DRAFT, CONFIDENTIAL, your name.',
  icon: ICON,
  render(root) {
    root.innerHTML = pageHeader('Watermark PDF', 'Stamp text diagonally across every page. Everything happens in your browser — nothing is uploaded.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Watermark text</label>
          <input type="text" id="wtext" value="DRAFT" maxlength="40" />
        </div>
        <div class="row">
          <div class="field grow" style="margin:0">
            <label>Opacity</label>
            <select id="op">
              <option value="0.25">Light</option>
              <option value="0.45" selected>Medium</option>
              <option value="0.65">Strong</option>
            </select>
          </div>
          <div class="field grow" style="margin:0">
            <label>Output filename</label>
            <input type="text" id="fname" value="watermarked.pdf" />
          </div>
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Add watermark</button>
        </div>
        <div id="status" class="status"></div>
      </div>`;

    const q = (s: string) => root.querySelector(s) as HTMLElement;
    const dz = createDropzone({ accept: '.pdf,application/pdf', multiple: false, label: 'Drop a PDF file here', onChange: refresh });
    q('#dz').appendChild(dz.el);
    const list = q('#filelist');
    const go = q('#go') as HTMLButtonElement;
    const status = q('#status');

    function refresh() {
      renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
      go.disabled = dz.getFiles().length !== 1;
    }

    async function run() {
      const files = dz.getFiles();
      if (files.length !== 1) return;
      const text = (root.querySelector('#wtext') as HTMLInputElement).value.trim();
      if (!text) { setStatus(status, 'Type your watermark text first.', 'error'); return; }
      go.disabled = true;
      setStatus(status, 'Stamping…');
      try {
        const bytes = await readAsBytes(files[0]);
        const doc = await PDFDocument.load(bytes);
        const font = await doc.embedFont(StandardFonts.HelveticaBold);
        const opacity = parseFloat((root.querySelector('#op') as HTMLSelectElement).value);
        const size = 56;
        for (const page of doc.getPages()) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, size);
          page.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2,
            size,
            font,
            color: rgb(0.55, 0.55, 0.58),
            opacity,
            rotate: degrees(-35),
          });
        }
        const saved = await doc.save();
        let name = (root.querySelector('#fname') as HTMLInputElement).value.trim() || 'watermarked.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        downloadBytes(saved, name);
        setStatus(status, 'Done — watermark added.', 'success');
      } catch (err) {
        console.error(err);
        setStatus(status, 'Something went wrong. Please try again.', 'error');
      } finally {
        go.disabled = dz.getFiles().length !== 1;
      }
    }
    go.addEventListener('click', run);
    refresh();
  },
};
