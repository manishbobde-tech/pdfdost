# Pdfdost — free PDF tools, private by design

**Pdfdost** ("PDF ka dost" — your PDF's friend) is a free collection of PDF tools that run entirely in your web browser. No account, no watermarks, no usage limits.

## Tools (v1)
Merge, Split, Compress, Rotate, Images→PDF, PDF→Images, Watermark, E-sign, Page numbers.

## How it works
Everything runs client-side: `pdf-lib` for building/editing, `pdf.js` for rendering, `JSZip` for downloads. No server ever receives your files.

## Develop
```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Deploy
Static site — deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages).
