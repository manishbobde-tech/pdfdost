export function renderAbout(): string {
  return `
  <div class="prose">
    <h1>About Pdfdost</h1>
    <p><strong>Pdfdost</strong> ("PDF ka dost" — your PDF's friend) is a free collection of PDF tools that run entirely in your web browser. No account, no watermarks, no usage limits.</p>

    <h2>How it works</h2>
    <p>When you open a file, it is read into your browser's memory and processed there by code the page has already downloaded: <strong>pdf-lib</strong> for building and editing PDFs, <strong>pdf.js</strong> for rendering pages, running right on your device. The result is produced locally and saved straight to your downloads.</p>
    <p>There is no Pdfdost server that receives your files. Your documents never leave your device, period.</p>

    <h2>What it costs</h2>
    <p>Nothing. There are no ads, no paid tier, and no features held back behind an account.</p>

    <h2>What we can't do (honestly)</h2>
    <p>Because everything runs in your browser, a few things aren't possible yet: converting PDFs to Word, Excel or PowerPoint with full layout needs server-side software, and opening password-protected PDFs isn't supported by our libraries. These are on the roadmap.</p>

    <h2>Open source building blocks</h2>
    <p>Pdfdost is built with open-source libraries: pdf-lib, pdf.js, and JSZip. Our own code — the friendly interface you're using — is an original creation.</p>
  </div>`;
}
