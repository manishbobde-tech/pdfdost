import { PDFDocument } from 'pdf-lib';
import type { ToolDef } from './index';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes } from '../lib/pdf';

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;

export const imagesToPdfTool: ToolDef = {
  id: 'images-to-pdf',
  title: 'Images to PDF',
  desc: 'Turn JPG or PNG photos into a PDF — one image per page.',
  icon: ICON,
  render(root) {
    root.innerHTML = pageHeader('Images to PDF', 'Combine photos or scans into a single PDF, one image per page. Everything happens in your browser.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="images.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Create PDF</button>
        </div>
        <div class="progress" id="prog"><div></div></div>
        <div id="status" class="status"></div>
      </div>`;

    const q = (s: string) => root.querySelector(s) as HTMLElement;
    const dz = createDropzone({ accept: 'image/png,image/jpeg,.png,.jpg,.jpeg', multiple: true, label: 'Drop JPG / PNG images here', onChange: refresh });
    q('#dz').appendChild(dz.el);
    const list = q('#filelist');
    const go = q('#go') as HTMLButtonElement;
    const status = q('#status');
    const prog = q('#prog');
    const bar = prog.firstElementChild as HTMLElement;

    function refresh() {
      renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
      go.disabled = dz.getFiles().length < 1;
    }

    async function run() {
      const files = dz.getFiles();
      if (!files.length) return;
      go.disabled = true;
      prog.classList.add('on');
      try {
        const out = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          setStatus(status, `Adding ${files[i].name} (${i + 1}/${files.length})…`);
          const bytes = await readAsBytes(files[i]);
          const isPng = files[i].type.includes('png') || files[i].name.toLowerCase().endsWith('.png');
          const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
          // Fit image onto an A4 page, keeping aspect ratio
          const A4 = { w: 595.28, h: 841.89 };
          const landscape = img.width > img.height;
          const pw = landscape ? A4.h : A4.w;
          const ph = landscape ? A4.w : A4.h;
          const page = out.addPage([pw, ph]);
          const scale = Math.min(pw / img.width, ph / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
          bar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
        }
        const saved = await out.save();
        let name = (root.querySelector('#fname') as HTMLInputElement).value.trim() || 'images.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        downloadBytes(saved, name);
        setStatus(status, `Done — ${files.length} image${files.length > 1 ? 's' : ''} in one PDF.`, 'success');
      } catch (err) {
        console.error(err);
        setStatus(status, 'Something went wrong. Only JPG and PNG images are supported.', 'error');
      } finally {
        prog.classList.remove('on');
        bar.style.width = '0%';
        go.disabled = dz.getFiles().length < 1;
      }
    }
    go.addEventListener('click', run);
    refresh();
  },
};
