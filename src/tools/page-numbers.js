import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes } from '../lib/pdf';
const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 18h6"/></svg>`;
export const pagenumbersTool = {
    id: 'page-numbers',
    title: 'Page numbers',
    desc: 'Add "Page 1 of 10" footers to every page of your PDF.',
    icon: ICON,
    render(root) {
        root.innerHTML = pageHeader('Page numbers', 'Number every page with a clean footer. Everything happens in your browser — nothing is uploaded.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="row">
          <div class="field grow" style="margin:0">
            <label>Position</label>
            <select id="pos">
              <option value="bottom-center" selected>Bottom center</option>
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
            </select>
          </div>
          <div class="field grow" style="margin:0">
            <label>Start numbering at</label>
            <input type="number" id="start" value="1" min="1" />
          </div>
        </div>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="numbered.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Add page numbers</button>
        </div>
        <div id="status" class="status"></div>
      </div>`;
        const q = (s) => root.querySelector(s);
        const dz = createDropzone({ accept: '.pdf,application/pdf', multiple: false, label: 'Drop a PDF file here', onChange: refresh });
        q('#dz').appendChild(dz.el);
        const list = q('#filelist');
        const go = q('#go');
        const status = q('#status');
        function refresh() {
            renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
            go.disabled = dz.getFiles().length !== 1;
        }
        async function run() {
            const files = dz.getFiles();
            if (files.length !== 1)
                return;
            go.disabled = true;
            setStatus(status, 'Numbering…');
            try {
                const bytes = await readAsBytes(files[0]);
                const doc = await PDFDocument.load(bytes);
                const font = await doc.embedFont(StandardFonts.Helvetica);
                const pos = root.querySelector('#pos').value;
                const start = Math.max(1, parseInt(root.querySelector('#start').value, 10) || 1);
                const pages = doc.getPages();
                const total = pages.length;
                pages.forEach((page, i) => {
                    const { width } = page.getSize();
                    const label = `Page ${start + i} of ${start + total - 1}`;
                    const size = 10;
                    const tw = font.widthOfTextAtSize(label, size);
                    const x = pos === 'bottom-left' ? 36 : pos === 'bottom-right' ? width - tw - 36 : width / 2 - tw / 2;
                    page.drawText(label, { x, y: 30, size, font, color: rgb(0.35, 0.33, 0.31) });
                });
                const saved = await doc.save();
                let name = root.querySelector('#fname').value.trim() || 'numbered.pdf';
                if (!name.toLowerCase().endsWith('.pdf'))
                    name += '.pdf';
                downloadBytes(saved, name);
                setStatus(status, 'Done — pages numbered.', 'success');
            }
            catch (err) {
                console.error(err);
                setStatus(status, 'Something went wrong. Please try again.', 'error');
            }
            finally {
                go.disabled = dz.getFiles().length !== 1;
            }
        }
        go.addEventListener('click', run);
        refresh();
    },
};
