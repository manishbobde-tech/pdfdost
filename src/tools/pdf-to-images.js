import JSZip from 'jszip';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes, loadPdfJs, renderPageToCanvas, dataUrlToBytes } from '../lib/pdf';
const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><rect x="8" y="13" width="8" height="6" rx="1"/></svg>`;
export const pdfToImagesTool = {
    id: 'pdf-to-images',
    title: 'PDF to Images',
    desc: 'Export every page of your PDF as a PNG or JPG image.',
    icon: ICON,
    render(root) {
        root.innerHTML = pageHeader('PDF to Images', 'Turn each page into a crisp image, downloaded together as a ZIP. Everything happens in your browser.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="row">
          <div class="field grow" style="margin:0">
            <label>Image format</label>
            <select id="fmt">
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
            </select>
          </div>
          <div class="field grow" style="margin:0">
            <label>Resolution</label>
            <select id="scale">
              <option value="2">High (2x)</option>
              <option value="1.5" selected>Medium (1.5x)</option>
              <option value="1">Standard (1x)</option>
            </select>
          </div>
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Convert to images</button>
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
                const fmt = root.querySelector('#fmt').value;
                const scale = parseFloat(root.querySelector('#scale').value);
                const bytes = await readAsBytes(files[0]);
                const pdf = await loadPdfJs(bytes);
                const count = pdf.numPages;
                const zip = new JSZip();
                const base = files[0].name.replace(/\.pdf$/i, '');
                for (let i = 1; i <= count; i++) {
                    setStatus(status, `Rendering page ${i} of ${count}…`);
                    const canvas = await renderPageToCanvas(pdf, i, scale);
                    const url = canvas.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92);
                    zip.file(`${base}-page-${i}.${fmt === 'png' ? 'png' : 'jpg'}`, dataUrlToBytes(url));
                    bar.style.width = `${Math.round((i / count) * 100)}%`;
                }
                setStatus(status, 'Zipping…');
                const blob = await zip.generateAsync({ type: 'uint8array' });
                downloadBytes(blob, `${base}-images.zip`, 'application/zip');
                setStatus(status, `Done — ${count} image${count > 1 ? 's' : ''} in the ZIP.`, 'success');
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
