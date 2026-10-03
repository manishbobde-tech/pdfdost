import './styles.css';
import { renderHome } from './pages/home';
import { renderAbout } from './pages/about';
import { tools } from './tools/index';
const app = document.getElementById('app');
const LOGO_SVG = `<img src="/favicon.svg" alt="Pdfdost logo" />`;
function shell(content) {
    return `
  <header class="site-header">
    <div class="wrap">
      <a class="logo" href="#/">${LOGO_SVG}<span>Pdf<em>dost</em></span></a>
      <nav class="nav">
        <a href="#/">All tools</a>
        <a href="#/about">About</a>
      </nav>
    </div>
  </header>
  <main>${content}</main>
  <footer class="site-footer">
    <div class="wrap">
      <span><strong>Pdfdost</strong> — free PDF tools, private by design.</span>
      <span class="right">
        <a href="#/about">How it works</a>
        <span>Your files never leave your device.</span>
      </span>
    </div>
  </footer>`;
}
function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    let content = '';
    if (hash === '' || hash === '/') {
        content = renderHome();
        app.innerHTML = shell(content);
    }
    else if (hash === 'about') {
        content = renderAbout();
        app.innerHTML = shell(content);
    }
    else {
        const tool = tools.find((t) => t.id === hash);
        if (tool) {
            app.innerHTML = shell('<div id="tool-root"></div>');
            tool.render(document.getElementById('tool-root'));
        }
        else {
            app.innerHTML = shell('<div class="wrap" style="padding:60px 20px;text-align:center"><h1>Not found</h1><p><a href="#/">Back to all tools</a></p></div>');
        }
    }
    window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
