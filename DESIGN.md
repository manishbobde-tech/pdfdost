# Pdfdost — DESIGN.md

Brand: **Pdfdost** — "PDF ka dost". Free PDF tools that run entirely in the browser.
Tagline: "Free PDF tools, private by design."

## Palette
- `--bg`: #FFFBF2 (warm cream page background)
- `--bg-soft`: #FFF4E3 (soft warm panels)
- `--ink`: #1C1917 (warm near-black text)
- `--ink-soft`: #57534E (secondary text)
- `--primary`: #EA580C (friendly orange, CTAs)
- `--primary-dark`: #C2410C (hover states)
- `--primary-soft`: #FFEEDD (tinted fills)
- `--teal`: #0D9488 (accents, success)
- `--card`: #FFFFFF
- `--border`: #F0E2CC (warm hairlines)

## Type
- Family: "Plus Jakarta Sans", system-ui fallback.
- H1 800/2.5rem, H2 700/1.5rem, body 400/1rem, small 0.875rem.
- Tight letter-spacing on headings (-0.02em).

## Shape & motion
- Radius: 18px cards, 12px inputs, pill buttons.
- Shadow: soft warm `0 10px 30px rgba(234,88,12,.08)`.
- Card hover: translateY(-4px), border warms to primary.
- Buttons: pill, 600 weight, primary fills orange, secondary outline.

## Layout
- Max width 1080px, generous whitespace.
- Sticky header, blurred cream.
- Tool grid: `repeat(auto-fill, minmax(250px, 1fr))`.
- Tool pages: centered panel, dropzone on top, options, big CTA, status line.
- Dropzone: dashed warm border, orange tint on dragover.
- Mobile: single column, tappable targets ≥44px, no horizontal scroll.

## Voice
Friendly, plain-spoken. "Your files never leave your device." No jargon.
