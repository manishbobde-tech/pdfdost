import { PDFDocument, degrees } from 'pdf-lib';
import { createDropzone, downloadBytes, pageHeader, renderFileList, setStatus } from '../lib/ui';
import { readAsBytes } from '../lib/pdf';
const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>`;
export const rotateTool = {
    id: 'rotate',
    title: 'Rotate PDF',
    desc: 'Rotate all pages 90°, 180° or 270° — fix sideways scans in one click.',
    icon: ICON,
    render(root) {
        root.innerHTML = pageHeader('Rotate PDF', 'Straighten sideways pages. Everything happens in your browser — nothing is uploaded.') + `
      <div class="panel">
        <div id="dz"></div>
        <ul id="filelist" class="filelist"></ul>
        <div class="field">
          <label>Rotate by</label>
          <select id="angle">
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="270">90° counter-clockwise</option>
          </select>
        </div>
        <div class="field">
          <label>Output filename</label>
          <input type="text" id="fname" value="rotated.pdf" />
        </div>
        <div class="row">
          <button id="go" class="btn primary" disabled>Rotate PDF</button>
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
            setStatus(status, 'Rotating…');
            try {
                const bytes = await readAsBytes(files[0]);
                const doc = await PDFDocument.load(bytes);
                const angle = parseInt(root.querySelector('#angle').value, 10);
                doc.getPages().forEach((p) => {
                    const cur = p.getRotation().angle;
                    p.setRotation(degrees((cur + angle) % 360));
                });
                const saved = await doc.save();
                let name = root.querySelector('#fname').value.trim() || 'rotated.pdf';
                if (!name.toLowerCase().endsWith('.pdf'))
                    name += '.pdf';
                downloadBytes(saved, name);
                setStatus(status, 'Done — pages rotated.', 'success');
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
