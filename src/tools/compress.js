import { PDFDocument } from 'pdf-lib';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes, loadPdfJs, renderPageToCanvas, pageSize, dataUrlToBytes } from '../lib/pdf';
const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 17c-1.5 0-2-1-2-2m4 2c-1.5 0-2-1-2-2m4 2c-1.5 0-2-1-2-2"/></svg>`;
const QUALITY = {
    high: { scale: 2.0, q: 0.85, label: 'High quality (larger file)' },
    medium: { scale: 1.5, q: 0.7, label: 'Medium quality (recommended)' },
    low: { scale: 1.0, q: 0.55, label: 'Smallest file (lower quality)' },
};
export const compressTool = {
    id: 'compress',
    title: 'Compress PDF',
    desc: 'Shrink your PDF by re-rendering pages at a smaller size.',
    icon: ICON,
    render(root) {
        root.innerHTML = pageHeader('Compress PDF', 'Make your PDF smaller by re-rendering pages at a lower resolution. Text becomes part of the page image — great for sharing and uploading.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Quality</label>
          <select id="quality">
            <option value="medium">${QUALITY.medium.label}</option>
            <option value="high">${QUALITY.high.label}</option>
            <option value="low">${QUALITY.low.label}</option>
          </select>
        </div>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="compressed.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Compress PDF</button>
        </div>
        <div class="progress" id="prog"><div></div></div>
        <div id="status" class="status"></div>
      </div>`;
        const q = (s) => root.querySelector(s);
        const dz = createDropzone({ accept: '.pdf,application/pdf', multiple: false, label: 'Drop a PDF file here', onChange: refresh });
        q('#dz').appendChild(dz.el);
        const list = q('#filelist');
        const go = q('#go');
        const status = q('#status');
        const prog = q('#prog');
        const bar = prog.firstElementChild;
        function refresh() {
            renderFileList(list, dz.getFiles(), (i) => { dz.removeAt(i); refresh(); });
            go.disabled = dz.getFiles().length !== 1;
        }
        async function run() {
            const files = dz.getFiles();
            if (files.length !== 1)
                return;
            go.disabled = true;
            prog.classList.add('on');
            try {
                const key = root.querySelector('#quality').value;
                const { scale, q: jq } = QUALITY[key];
                const bytes = await readAsBytes(files[0]);
                const originalKB = Math.round(bytes.length / 1024);
                setStatus(status, 'Reading pages…');
                const pdf = await loadPdfJs(bytes);
                const count = pdf.numPages;
                const out = await PDFDocument.create();
                for (let i = 1; i <= count; i++) {
                    setStatus(status, `Compressing page ${i} of ${count}…`);
                    const canvas = await renderPageToCanvas(pdf, i, scale);
                    const url = canvas.toDataURL('image/jpeg', jq);
                    const jpg = await out.embedJpg(dataUrlToBytes(url));
                    const { width, height } = await pageSize(pdf, i);
                    const page = out.addPage([width, height]);
                    page.drawImage(jpg, { x: 0, y: 0, width, height });
                    bar.style.width = `${Math.round((i / count) * 100)}%`;
                }
                const saved = await out.save();
                const savedKB = Math.round(saved.length / 1024);
                let name = root.querySelector('#fname').value.trim() || 'compressed.pdf';
                if (!name.toLowerCase().endsWith('.pdf'))
                    name += '.pdf';
                downloadBytes(saved, name);
                const pct = originalKB > 0 ? Math.round((1 - savedKB / originalKB) * 100) : 0;
                setStatus(status, `Done — ${originalKB} KB → ${savedKB} KB (${pct}% smaller).`, 'success');
            }
            catch (err) {
                console.error(err);
                setStatus(status, 'Something went wrong. Please try again.', 'error');
            }
            finally {
                prog.classList.remove('on');
                bar.style.width = '0%';
                go.disabled = dz.getFiles().length !== 1;
            }
        }
        go.addEventListener('click', run);
        refresh();
    },
};
