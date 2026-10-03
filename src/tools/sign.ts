import { PDFDocument } from 'pdf-lib';
import type { ToolDef } from './index';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes, dataUrlToBytes } from '../lib/pdf';

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>`;

const POSITIONS = {
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
  'top-right': 'Top right',
  'center': 'Center of page',
} as const;

export const signTool: ToolDef = {
  id: 'sign',
  title: 'E-sign PDF',
  desc: 'Draw your signature and stamp it onto any page of your PDF.',
  icon: ICON,
  render(root) {
    root.innerHTML = pageHeader('E-sign PDF', 'Draw your signature below, pick a page and position, and stamp it on. Everything happens in your browser.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Draw your signature</label>
          <canvas id="pad" class="sigpad"></canvas>
          <span class="hint">Use your mouse or finger. <a href="#" id="clearpad">Clear</a></span>
        </div>
        <div class="row">
          <div class="field grow" style="margin:0">
            <label>Page number</label>
            <input type="number" id="pageno" value="1" min="1" />
          </div>
          <div class="field grow" style="margin:0">
            <label>Position</label>
            <select id="pos">
              ${Object.entries(POSITIONS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="signed.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Sign PDF</button>
        </div>
        <div id="status" class="status"></div>
      </div>`;

    const q = (s: string) => root.querySelector(s) as HTMLElement;
    const dz = createDropzone({ accept: '.pdf,application/pdf', multiple: false, label: 'Drop the PDF to sign here', onChange: refresh });
    q('#dz').appendChild(dz.el);
    const list = q('#filelist');
    const go = q('#go') as HTMLButtonElement;
    const status = q('#status');

    // --- signature pad ---
    const pad = q('#pad') as HTMLCanvasElement;
    const pctx = pad.getContext('2d')!;
    let drawing = false;
    let hasInk = false;
    function sizePad() {
      const r = pad.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      pad.width = r.width * dpr;
      pad.height = 200 * dpr;
      pctx.scale(dpr, dpr);
      pctx.lineWidth = 2.5;
      pctx.lineCap = 'round';
      pctx.strokeStyle = '#1c1917';
    }
    sizePad();
    const posOf = (e: PointerEvent) => {
      const r = pad.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    pad.addEventListener('pointerdown', (e) => { drawing = true; pad.setPointerCapture(e.pointerId); const p = posOf(e); pctx.beginPath(); pctx.moveTo(p.x, p.y); });
    pad.addEventListener('pointermove', (e) => { if (!drawing) return; const p = posOf(e); pctx.lineTo(p.x, p.y); pctx.stroke(); hasInk = true; refresh(); });
    pad.addEventListener('pointerup', () => { drawing = false; });
    (q('#clearpad') as HTMLAnchorElement).addEventListener('click', (e) => {
      e.preventDefault();
      pctx.clearRect(0, 0, pad.width, pad.height);
      hasInk = false;
      refresh();
    });

    function refresh() {
      renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
      go.disabled = dz.getFiles().length !== 1 || !hasInk;
    }

    async function run() {
      const files = dz.getFiles();
      if (files.length !== 1 || !hasInk) return;
      go.disabled = true;
      setStatus(status, 'Signing…');
      try {
        const bytes = await readAsBytes(files[0]);
        const doc = await PDFDocument.load(bytes);
        const pages = doc.getPages();
        let n = Math.max(1, parseInt((root.querySelector('#pageno') as HTMLInputElement).value, 10) || 1);
        n = Math.min(n, pages.length);
        const page = pages[n - 1];
        const { width, height } = page.getSize();

        const sigUrl = pad.toDataURL('image/png');
        const sigImg = await doc.embedPng(dataUrlToBytes(sigUrl));
        const targetW = 160;
        const scale = targetW / sigImg.width;
        const w = targetW;
        const h = sigImg.height * scale;
        const pos = (root.querySelector('#pos') as HTMLSelectElement).value as keyof typeof POSITIONS;
        const m = 50;
        const coords =
          pos === 'bottom-left' ? { x: m, y: m } :
          pos === 'top-right' ? { x: width - w - m, y: height - h - m } :
          pos === 'center' ? { x: (width - w) / 2, y: (height - h) / 2 } :
          { x: width - w - m, y: m };
        page.drawImage(sigImg, { ...coords, width: w, height: h });

        const saved = await doc.save();
        let name = (root.querySelector('#fname') as HTMLInputElement).value.trim() || 'signed.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        downloadBytes(saved, name);
        setStatus(status, `Done — signature stamped on page ${n}.`, 'success');
      } catch (err) {
        console.error(err);
        setStatus(status, 'Something went wrong. Please try again.', 'error');
      } finally {
        refresh();
      }
    }
    go.addEventListener('click', run);
    refresh();
  },
};
