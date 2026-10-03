/** Shared UI helpers for Pdfdost tools. */

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/pdf') {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function pageHeader(title: string, desc: string): string {
  return `<div class="tool-head"><h1>${title}</h1><p>${desc}</p></div>`;
}

export interface Dropzone {
  el: HTMLElement;
  getFiles: () => File[];
  clear: () => void;
  removeAt: (i: number) => void;
}

export function createDropzone(opts: {
  accept: string;
  multiple: boolean;
  label?: string;
  onChange: () => void;
}): Dropzone {
  let files: File[] = [];
  const el = document.createElement('div');
  el.className = 'dropzone';
  el.innerHTML = `
    <div class="dz-icon">📄</div>
    <p><strong>${opts.label ?? 'Drop files here'}</strong> or click to browse</p>
    <p style="font-size:.8rem">Files are processed on your device — nothing is uploaded.</p>`;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = opts.accept;
  input.multiple = opts.multiple;
  input.style.display = 'none';

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    files = opts.multiple ? [...files, ...arr] : arr.slice(0, 1);
    opts.onChange();
  };

  el.addEventListener('click', () => input.click());
  input.addEventListener('change', () => { if (input.files) addFiles(input.files); input.value = ''; });
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag');
    if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
  });

  return {
    el,
    getFiles: () => files,
    clear: () => { files = []; opts.onChange(); },
    removeAt: (i: number) => { files = files.filter((_, j) => j !== i); opts.onChange(); },
  };
}

export function renderFileList(ul: HTMLElement, files: File[], onRemove: (i: number) => void) {
  ul.innerHTML = '';
  files.forEach((f, i) => {
    const li = document.createElement('li');
    const kb = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
    li.innerHTML = `<span class="fname">${escapeHtml(f.name)}</span><span class="fmeta">${kb}</span>`;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.title = 'Remove';
    btn.addEventListener('click', (e) => { e.stopPropagation(); onRemove(i); });
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function setStatus(el: HTMLElement, msg: string, kind: '' | 'error' | 'success' = '') {
  el.textContent = msg;
  el.className = 'status' + (kind ? ' ' + kind : '');
}
