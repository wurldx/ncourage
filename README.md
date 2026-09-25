# Ncourage Studios Gallery Redesign

A vanilla HTML/CSS/JS photography portfolio redesign using grey placeholder images.

`index.html` is the site's home page and the whole site lives on it: the hero,
the filterable gallery (`#gallery`), the studio story (`#about`) and the
contact call to action (`#contact`) are sections of this one page. The header
logo, the "Home" nav link and the footer logo all point back to `index.html`.

## Structure

- `index.html` — home page markup (single-page site)
- `css/style.css` — responsive styling
- `js/script.js` — filters, mobile navigation, lightbox and keyboard controls
- `images/` — site images: the hero, the logo mark and the gallery photos

## Replacing placeholders with real photos

Each gallery item currently contains:

```html
<div class="placeholder"><span>01</span></div>
```

Replace it with:

```html
<img src="images/photo-01.jpg" alt="Portrait Study">
```

and add:

```css
.placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

For the best result, keep the original editorial aspect ratios.

## Hero image

The `#home` hero uses a full-bleed photograph behind the headline, with a
left-to-right dark scrim (`.hero::after`) so the copy stays readable.

| File | Size | Used for |
| --- | --- | --- |
| `images/ncouragehero.webp` | 2000×980 | desktop, and mobile at 3× |
| `images/ncouragehero-1000.webp` | 1000×490 | mobile at 1×–2× |

Both keep the original 2.04:1 ratio. `index.html` preloads them with
`imagesrcset`/`imagesizes` and drops them into a single `<img class="hero-image">`.

To regenerate them from the source PNG (ImageMagick 7):

```bash
magick "images/ncouragehero.png" -strip -resize 2000x -quality 82 -define webp:method=6 "images/ncouragehero.webp"
magick "images/ncouragehero.png" -strip -resize 1000x -quality 78 -define webp:method=6 "images/ncouragehero-1000.webp"
```

`object-position` is tuned per breakpoint in `css/style.css`: `58% center`
desktop (the wide frame barely crops) and `50% center` below 640px, where the
narrow crop has to keep both models' faces in view.

## Logo

The masthead and the footer pair the bitmap mark (the pixel-square shutter
symbol) with a live-text NCOURAGE STUDIOS wordmark, so the brand name stays
selectable text that inherits the bar's colour instead of becoming a third
exported image. The 1024×709 master supplied in the hand-off also carried the
wordmark below the symbol; it is cropped out of the artwork and rebuilt in type,
matched to the artwork's own metrics (see the table below). Two WebP files are
exported, both 383×257 and trimmed to the symbol, so the same CSS height renders
both at the same size:

| File | Artwork | Used for |
| --- | --- | --- |
| `images/ncouragelogo.webp` | white | the header while it is transparent over the hero |
| `images/ncouragelogo_black.webp` | black | the header once `.scrolled`/`.menu-open` makes the bar solid, and the footer |

`index.html` wraps the marks in `<span class="logo-stack">`, where the two
`<img class="logo-mark">` elements share a single grid cell, and `css/style.css`
cross-fades their opacity on the header's existing `--nav-fade`, so the swap is
timed with the rest of the bar. The footer keeps only the black mark, because it
always sits on the light page colour.

`--logo-height` in `css/style.css` drives the whole lockup: the mark's height and,
through `calc()`, every wordmark size (40px, dropping to 32px in the 640px
breakpoint).

### Wordmark

The mark leads the lockup, with the wordmark set after it as real text in
Montserrat (`--font-logo`, two weights requested in `index.html`). It needs no
images and no extra colour rules: it inherits `color`, so it follows the bar's
own transition from light over the hero to ink once solid. Its metrics were
measured off the master rather than guessed:

| Value | Artwork (÷ symbol height 257) | `css/style.css` |
| --- | --- | --- |
| NCOURAGE cap height | 86 → .335 | `font-size: .4676` (Montserrat cap/em is .7155), weight 500 |
| STUDIOS cap height | 45 → .175 | `font-size: .2447`, weight 800 |
| Line gap | 23 → .090 | sub-line `margin-top: .03` |
| NCOURAGE ink width | 693 → 2.696 | `letter-spacing: -.012em` |
| STUDIOS ink width | 670 → 2.607 | `letter-spacing: 1em`, `margin-right: -1em` |
| Mark → wordmark gap | not in the artwork | `gap: .34`, chosen for the header |

Montserrat was picked by rendering six candidate families at the artwork's own
cap height and scoring them against the master: per-letter widths (mean absolute
error 2.1px at cap 86, against 3.6–10.9 for the other five) plus stroke-to-cap
ratio (.151 in the artwork; Montserrat 500 = .140, Montserrat 600 = .186).
Changing the family means re-checking those two numbers and both
`letter-spacing` values.

Both files come from the master: the artwork is cropped out of its transparent
margin, then everything below the symbol is cut off. The white variant is then
repainted from the black one — only the RGB channels are touched, so the alpha
channel (and therefore the register) is untouched:

```bash
magick "ncourage_studios_logo_transparent.webp" -crop 694x444+178+124 +repage -crop 694x257+0+0 +repage -trim +repage -strip -define webp:method=6 -quality 95 "images/ncouragelogo_black.webp"
magick "images/ncouragelogo_black.webp" -channel RGB -evaluate set 100% +channel -strip -quality 92 -define webp:method=6 "images/ncouragelogo.webp"
```

## Run

Open `index.html` directly in a browser, or use VS Code Live Server.
