import { PDFDocument } from 'pdf-lib';
import type { ToolDef } from './index';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes, parseRanges } from '../lib/pdf';

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="12" cy="13" r="2"/><path d="M9.5 15.5 8 21l3.5-2M14.5 15.5 16 21l-3.5-2"/></svg>`;

export const splitTool: ToolDef = {
  id: 'split',
  title: 'Split PDF',
  desc: 'Extract the pages you want into a new PDF. Pick ranges like 1-3, 8.',
  icon: ICON,
  render(root) {
    root.innerHTML = pageHeader('Split PDF', 'Pull out just the pages you need. Everything happens in your browser — nothing is uploaded.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Pages to keep <span class="hint">e.g. 1-3, 8, 10-12</span></label>
          <input type="text" id="range" placeholder="1-3, 8" />
        </div>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="split.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Split PDF</button>
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
      const rangeStr = (root.querySelector('#range') as HTMLInputElement).value.trim();
      if (!rangeStr) { setStatus(status, 'Tell me which pages to keep first.', 'error'); return; }
      go.disabled = true;
      setStatus(status, 'Splitting…');
      try {
        const bytes = await readAsBytes(files[0]);
        const doc = await PDFDocument.load(bytes);
        const max = doc.getPageCount();
        const pages = parseRanges(rangeStr, max);
        if (pages.length === 0) { setStatus(status, `No valid pages in that range — this PDF has ${max} pages.`, 'error'); return; }
        const out = await PDFDocument.create();
        const copied = await out.copyPages(doc, pages.map((p) => p - 1));
        copied.forEach((p) => out.addPage(p));
        const saved = await out.save();
        let name = (root.querySelector('#fname') as HTMLInputElement).value.trim() || 'split.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        downloadBytes(saved, name);
        setStatus(status, `Done — ${pages.length} page${pages.length > 1 ? 's' : ''} extracted.`, 'success');
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
