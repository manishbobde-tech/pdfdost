import { PDFDocument } from 'pdf-lib';
import type { ToolDef } from './index';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes } from '../lib/pdf';

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6M9 11h2"/></svg>`;

export const mergeTool: ToolDef = {
  id: 'merge',
  title: 'Merge PDF',
  desc: 'Combine multiple PDFs into one file, in the order you choose.',
  icon: ICON,
  render(root) {
    root.innerHTML = pageHeader('Merge PDF', 'Combine multiple PDFs into a single file. Everything happens in your browser — nothing is uploaded.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="merged.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Merge PDFs</button>
        </div>
        <div class="progress" id="prog"><div></div></div>
        <div id="status" class="status"></div>
      </div>`;

    const q = (s: string) => root.querySelector(s) as HTMLElement;
    const dz = createDropzone({ accept: '.pdf,application/pdf', multiple: true, label: 'Drop PDF files here', onChange: refresh });
    q('#dz').appendChild(dz.el);
    const list = q('#filelist') as HTMLElement;
    const go = q('#go') as HTMLButtonElement;
    const status = q('#status');
    const prog = q('#prog');
    const bar = prog.firstElementChild as HTMLElement;

    function refresh() {
      renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
      go.disabled = dz.getFiles().length < 2;
    }

    async function run() {
      const files = dz.getFiles();
      if (files.length < 2) return;
      go.disabled = true;
      prog.classList.add('on');
      setStatus(status, 'Merging…');
      try {
        const out = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          setStatus(status, `Reading ${files[i].name} (${i + 1}/${files.length})…`);
          const bytes = await readAsBytes(files[i]);
          const doc = await PDFDocument.load(bytes);
          const pages = await out.copyPages(doc, doc.getPageIndices());
          pages.forEach((p) => out.addPage(p));
          bar.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
        }
        const saved = await out.save();
        let name = (root.querySelector('#fname') as HTMLInputElement).value.trim() || 'merged.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf';
        downloadBytes(saved, name);
        setStatus(status, `Done — ${files.length} files merged.`, 'success');
      } catch (err) {
        console.error(err);
        setStatus(status, 'Something went wrong merging these files. Please try again.', 'error');
      } finally {
        prog.classList.remove('on');
        bar.style.width = '0%';
        go.disabled = dz.getFiles().length < 2;
      }
    }
    go.addEventListener('click', run);
    refresh();
  },
};
