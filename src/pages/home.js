import { tools } from '../tools/index';
export function renderHome() {
    const cards = tools.map((t) => `
    <a class="card" href="#/${t.id}">
      <span class="icon">${t.icon}</span>
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
    </a>`).join('');
    return `
  <section class="hero wrap">
    <span class="badge">100% FREE · NO SIGN-UP · NO WATERMARKS</span>
    <h1>Your PDF's <em>dost</em>,<br />right in your browser.</h1>
    <p>Merge, split, compress, convert and sign PDFs — free forever. Your files are processed on your device and never uploaded anywhere.</p>
  </section>
  <div class="wrap">
    <div class="grid">${cards}</div>
    <section class="privacy-strip">
      <span class="lock">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </span>
      <div>
        <h2>Private by design</h2>
        <p>Every tool runs locally in your browser using open-source libraries. There is no server receiving your files — even we couldn't see them if we wanted to. <a href="#/about" style="color:#5eead4">How it works →</a></p>
      </div>
    </section>
  </div>`;
}
