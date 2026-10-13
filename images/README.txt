Ncourage Studios image assets.

Hero (used by the #home section in index.html):
  ncouragehero.png        2650x1298  source master, kept for re-exporting
  ncouragehero.webp       2000x980   desktop / 3x mobile
  ncouragehero-1000.webp  1000x490   1x-2x mobile

Regenerate the WebP files with ImageMagick 7:

  magick "images/ncouragehero.png" -strip -resize 2000x -quality 82 -define webp:method=6 "images/ncouragehero.webp"
  magick "images/ncouragehero.png" -strip -resize 1000x -quality 78 -define webp:method=6 "images/ncouragehero-1000.webp"

Logo mark (used by the header and the footer in index.html):
  ncouragelogo_black.webp  383x257  black artwork, used whenever the
                                    background is light
  ncouragelogo.webp        383x257  white artwork, used while the header is
                                    transparent over the hero photo

Both files show the symbol only. The supplied 1024x709 master was cropped to
the artwork first, then everything below the symbol was cut off -- the wordmark
is not part of the artwork because the site sets it as live text in Montserrat
(see the Logo section of README.md):

  -crop 694x444+178+124 +repage            artwork without the empty margin
  -crop 694x257+0+0 +repage -trim +repage  the symbol above the wordmark

The canvas edge is therefore the symbol's edge and the CSS height is the
symbol's height (40px, 32px under 640px). The mark leads the lockup and the brand
name follows it as live text in the header and footer, so the artwork carries the
symbol only.

Re-export both files from the master with ImageMagick 7 -- the white variant is
repainted from the black one, RGB channels only, so the alpha channel is reused
untouched and the two files stay in exact register:

  magick "ncourage_studios_logo_transparent.webp" -crop 694x444+178+124 +repage -crop 694x257+0+0 +repage -trim +repage -strip -define webp:method=6 -quality 95 "images/ncouragelogo_black.webp"
  magick "images/ncouragelogo_black.webp" -channel RGB -evaluate set 100% +channel -strip -quality 92 -define webp:method=6 "images/ncouragelogo.webp"

Gallery photographs (images/editorial, images/event, images/event/portraits,
images/fashion, images/studio):

  <folder><n>.webp        master, full resolution, kept for re-exporting
                          (e.g. editorial1.webp, portraits7.webp)
  <folder><n>-480.webp    grid card on phones           (quality 75)
  <folder><n>-800.webp    grid card on desktop / retina (quality 78)
  <folder><n>-1600.webp   lightbox plate                (quality 80)

The serial number follows the natural order of the file names each photo had
before renaming. The 240-350px leftovers with hash-suffix names are old
placeholder thumbnails; they are ignored by the pipeline and safe to delete.

python images/optimize_pictures.py --apply

renames any new full-size photos, exports the three serving sizes with
ImageMagick 7 (stripped, never enlarged past the master), and rewrites the
gallery items in index.html. Existing exports are kept unless --force is
passed. The categories map to the gallery filters like this:

  editorial        -> Editorial
  event            -> Events
  event/portraits  -> Portraits
  fashion          -> Fashion
  studio           -> Portraits
