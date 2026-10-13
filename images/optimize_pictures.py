#!/usr/bin/env python3
"""Rename the grouped photographs and export the responsive gallery sizes.

The photographs live in per-category folders under images/. This script

  1. numbers the full-size photos after their folder, e.g.
         images/editorial/G24.<hash>.webp  ->  images/editorial/editorial2.webp
     (natural sort of the old name decides the serial order),
  2. exports the sizes the site serves next to each master:
         <name>-480.webp    grid card on phones            (quality 75)
         <name>-800.webp    grid card on desktop           (quality 78)
         <name>-1200.webp   feature plate / retina desktop (quality 80)
         <name>-1600.webp   lightbox plate                 (quality 80)
  3. writes the gallery <article> markup for index.html to a snippet file.

Masters are renamed in place and kept as the re-export source; the small
numbered leftovers (240-350px thumbnails from the old placeholder grid) are
skipped and left untouched.

Requires ImageMagick 7 (magick) on the PATH. Re-runnable: already-renamed
masters keep their serial number and existing exports are not regenerated
unless --force is passed.
"""
import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

# images/<folder> -> export slug, gallery data-category, title prefix.
# event/portraits and studio carry the Portraits filter; the other folders
# map to the like-named filter.
GROUPS = [
    ("editorial",        "editorial", "editorial", "Editorial"),
    ("event",            "event",     "events",    "Event"),
    ("event/portraits",  "portraits", "portraits", "Portrait"),
    ("fashion",          "fashion",   "fashion",   "Fashion"),
    ("studio",           "studio",    "portraits", "Studio"),
]

# (width target, webp quality) per use on the site.
SIZES = [(480, 75), (800, 78), (1200, 80), (1600, 80)]
MIN_WIDTH = 1000  # anything smaller is a legacy placeholder thumbnail

# Editorial rhythm for the plate grid, cycling like the original 12 plates:
# feature spans, staggered starts, plain thirds in between. Features stop at
# span 6 (half the grid) so a plate never outgrows its sharpest export.
CLASS_CYCLE = ["s6 off", "s5 off", "", "off", "", "off", "", "s5", "s6", "", "off", "s6 off"]


def sizes_for(classes: str) -> str:
    """Intrinsic width the plate can occupy, with a small buffer so the
    browser never under-selects a candidate and renders soft."""
    tablet, desktop = "46vw", "33vw"  # plain thirds
    if "s5" in classes:
        tablet, desktop = "92vw", "40vw"
    elif "s6" in classes:
        tablet, desktop = "92vw", "47vw"
    return f"(max-width: 640px) 92vw, (max-width: 900px) {tablet}, {desktop}"


def natural_key(name: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def identify(path: Path):
    out = subprocess.run(
        ["magick", "identify", "-format", "%w %h", str(path)],
        capture_output=True, text=True, check=True,
    )
    w, h = out.stdout.split()
    return int(w), int(h)


def export(master: Path, width: int, quality: int, force: bool):
    """One responsive WebP next to the master. Never enlarges past the master."""
    target = master.with_name(f"{master.stem}-{width}.webp")
    if target.exists() and not force:
        return target
    subprocess.run(
        ["magick", str(master),
         "-auto-orient", "-strip",
         "-resize", f"{width}x{width}>",
         "-define", "webp:method=6",
         "-quality", str(quality),
         str(target)],
        check=True,
    )
    return target


def collect_group(folder: Path, slug: str, force: bool):
    """Rename the full-size photos of one folder, return [(serial, master, w, h)]."""
    renamed = []  # (serial, path) already carrying the numbered name
    pending = []  # paths of not-yet-renamed originals
    export_re = re.compile(r"-(480|800|1200|1600)$")  # our own responsive exports

    for path in sorted(folder.glob("*.webp")):
        stem = path.stem
        if export_re.search(stem):
            continue  # responsive export of a master, not a source photo
        match = re.fullmatch(rf"{re.escape(slug)}(\d+)", stem)
        if match:
            renamed.append((int(match.group(1)), path))
            continue
        w, _h = identify(path)
        if w < MIN_WIDTH:
            continue  # legacy thumbnail, left as-is
        pending.append(path)

    used = {serial for serial, _ in renamed}
    serial = 1
    for path in sorted(pending, key=lambda p: natural_key(p.stem)):
        while serial in used:
            serial += 1
        used.add(serial)
        master = folder / f"{slug}{serial}.webp"
        path.rename(master)
        print(f"renamed  {path.relative_to(ROOT)}  ->  {master.relative_to(ROOT)}")
        renamed.append((serial, master))

    masters = []
    for serial, master in sorted(renamed):
        w, h = identify(master)
        for width, quality in SIZES:
            export(master, width, quality, force)
        masters.append((serial, master, w, h))
    return masters


def build_snippet(items, snippet_path: Path):
    """items: ordered [(slug, serial, category, title, folder, w, h)]."""
    blocks = []
    for index, (slug, serial, category, title, folder, w, h) in enumerate(items):
        classes = CLASS_CYCLE[index % len(CLASS_CYCLE)]
        name = f"{slug}{serial}"
        rel = f"images/{folder}"
        src = f"{rel}/{name}-800.webp"
        srcset = ", ".join(f"{rel}/{name}-{w}.webp {w}w" for w, _q in SIZES)
        full = f"{rel}/{name}-{SIZES[-1][0]}.webp"
        for referenced in [f"{rel}/{name}-{w}.webp" for w, _q in SIZES]:
            if not (ROOT / referenced).is_file():
                sys.exit(f"missing export: {referenced}")
        classes_attr = f' class="gallery-item {classes}"' if classes else ' class="gallery-item"'
        label = title.split(" ")[0]
        blocks.append(f"""\
        <article{classes_attr} data-category="{category}" data-title="{html.escape(title)}" data-location="Benin City, Nigeria" data-year="2026">
          <button class="image-card" type="button" aria-label="Open {html.escape(title)}">
            <div class="placeholder">
              <img src="{src}"
                   srcset="{srcset}"
                   sizes="{sizes_for(classes)}"
                   width="{w}" height="{h}"
                   alt="" loading="lazy" decoding="async"
                   data-full="{full}">
            </div>
            <div class="image-meta"><span>{html.escape(title)}</span><span>{label}</span></div>
          </button>
        </article>""")

    snippet_path.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")
    print(f"\nwrote {len(blocks)} gallery items to {snippet_path}")
    return "\n\n".join(blocks) + "\n"


def apply_to_index(snippet: str):
    """Replace whatever sits between the gallery grid div and its close."""
    index_path = ROOT / "index.html"
    lines = index_path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = end = None
    for i, line in enumerate(lines):
        if 'id="galleryGrid"' in line:
            start = i + 1
        elif start is not None and line.rstrip("\r\n") == "      </div>":
            end = i
            break
    if start is None or end is None:
        sys.exit("gallery grid markers not found in index.html")
    index_path.write_text("".join(lines[:start] + [snippet] + lines[end:]), encoding="utf-8")
    print(f"updated {index_path.relative_to(ROOT)} ({end - start} old lines -> 1 snippet)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true",
                        help="regenerate exports that already exist")
    parser.add_argument("--snippet", type=Path, default=None,
                        help="where to write the gallery HTML snippet")
    parser.add_argument("--apply", action="store_true",
                        help="also splice the generated items into index.html")
    args = parser.parse_args()

    per_category = {}
    for folder, slug, category, prefix in GROUPS:
        masters = collect_group(IMAGES / folder, slug, args.force)
        per_category.setdefault(category, [])
        print(f"{folder}: {len(masters)} photos -> {slug}1..{slug}{len(masters)}")
        for serial, master, w, h in masters:
            per_category[category].append((slug, serial, category, folder, w, h, prefix))

    # Round-robin across categories so "All" interleaves the sets.
    order = []
    queues = {c: list(v) for c, v in per_category.items()}
    group_order = [g[2] for g in GROUPS]
    while any(queues.values()):
        for category in group_order:
            if queues.get(category):
                slug, serial, cat, folder, w, h, prefix = queues[category].pop(0)
                title = f"{prefix} {serial}"
                order.append((slug, serial, cat, title, folder, w, h))

    snippet_path = args.snippet or (Path.home() / "AppData/Local/Temp" / "gallery-items.html")
    snippet = build_snippet(order, snippet_path)
    if args.apply:
        apply_to_index(snippet)


if __name__ == "__main__":
    main()
