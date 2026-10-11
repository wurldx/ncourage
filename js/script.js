const items = [...document.querySelectorAll(".gallery-item")];
const filters = [...document.querySelectorAll(".filter")];
const count = document.querySelector("#visibleCount");
const gallery = document.querySelector("#galleryGrid");
let updateMasonry = () => {};

items.forEach(item => {
  const title = item.dataset.title;
  const category = item.dataset.category;
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const card = item.querySelector(".image-card");
  const meta = item.querySelector(".image-meta");

  meta.querySelector("span:first-child").textContent = title;
  meta.querySelector("span:last-child").textContent = categoryLabel;
  card.setAttribute("aria-label", `Open ${title}, ${categoryLabel}, ${item.dataset.location}, ${item.dataset.year}`);

  const image = item.querySelector(".placeholder img");
  if (image) {
    image.alt = `${title}, ${categoryLabel}, ${item.dataset.location}, ${item.dataset.year}`;
  }
});

document.querySelectorAll(".placeholder img").forEach(image => {
  image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
  if (image.complete && image.naturalWidth > 0) image.classList.add("is-loaded");
});

if ("ResizeObserver" in window && gallery) {
  gallery.classList.add("is-masonry");

  updateMasonry = () => {
    const styles = getComputedStyle(gallery);
    const rowHeight = parseFloat(styles.gridAutoRows);
    const rowGap = parseFloat(styles.rowGap);
    if (!rowHeight) return;

    items.forEach(item => {
      if (item.classList.contains("is-hidden")) return;
      const cardHeight = item.querySelector(".image-card").offsetHeight;
      const rowSpan = Math.max(1, Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap)));
      item.style.setProperty("--masonry-rows", rowSpan);
    });
  };

  const masonryObserver = new ResizeObserver(() => requestAnimationFrame(updateMasonry));
  items.forEach(item => masonryObserver.observe(item.querySelector(".image-card")));
  window.addEventListener("resize", updateMasonry, { passive: true });
  updateMasonry();
}

filters.forEach(filter => {
  filter.addEventListener("click", () => {
    const selected = filter.dataset.filter;

    filters.forEach(btn => btn.classList.remove("active"));
    filters.forEach(btn => btn.setAttribute("aria-pressed", "false"));
    filter.classList.add("active");
    filter.setAttribute("aria-pressed", "true");

    const shown = [];

    items.forEach((item, index) => {
      const matches = selected === "all" || item.dataset.category === selected;

      if (matches) {
        item.classList.remove("is-hidden");
        // Same stagger vocabulary the grid observer uses (--stagger).
        item.style.setProperty("--stagger", `${Math.min(index * 45, 250)}ms`);
        shown.push(item);
      } else {
        item.classList.add("is-hidden");
        item.classList.remove("is-in");
      }
    });

    // Restart the entrance animation on everything shown, so a filter pass
    // reads as the plates rising back in rather than simply reappearing.
    // One reflow between removal and re-add is what actually retriggers it.
    shown.forEach(item => item.classList.remove("is-in"));
    void document.body.offsetWidth;
    shown.forEach(item => item.classList.add("is-in"));
    requestAnimationFrame(updateMasonry);

    if (count) {
      count.textContent = shown.length;
      // Tally pop: re-trigger the countPop keyframes on the number.
      count.classList.remove("is-ticked");
      void count.offsetWidth;
      count.classList.add("is-ticked");
    }
  });
});

// Mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

// One state setter for every path in and out of the menu, so aria, inert, the
// scroll lock, and the header style can never drift apart.
function setMenu(open, { restoreFocus = false } = {}) {
  mobileMenu.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.inert = !open;
  // The page behind the panel stops scrolling while the menu is up.
  document.body.classList.toggle("menu-locked", open);

  // Solid header while the menu is open. siteHeader is declared further down,
  // but these handlers only run on input — after the script has fully initialized.
  siteHeader.classList.toggle("menu-open", open);
  if (!open && restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  setMenu(!mobileMenu.classList.contains("open"));
});

mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || !mobileMenu.classList.contains("open")) return;
  setMenu(false, { restoreFocus: true });
});

// Presses outside the panel dismiss the menu — the dimmed page is the cancel
// surface. The press itself keeps focus where the user already put it.
document.addEventListener("pointerdown", event => {
  if (!mobileMenu.classList.contains("open")) return;
  if (mobileMenu.contains(event.target) || menuToggle.contains(event.target)) return;
  setMenu(false);
});

const socialProfiles = {
  Instagram: "https://instagram.com/YOUR_HANDLE",
  YouTube: "https://youtube.com/@YOUR_HANDLE",
  TikTok: "https://tiktok.com/@YOUR_HANDLE",
  LinkedIn: "https://linkedin.com/in/YOUR_HANDLE"
};

document.querySelectorAll(".footer-social a").forEach(link => {
  const profileUrl = socialProfiles[link.getAttribute("aria-label")];
  if (!profileUrl) return;
  link.href = profileUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");
const requiredContactFields = [...contactForm.querySelectorAll("input[required], select[required], textarea[required]")];

function contactFieldError(field) {
  if (field.validity.valueMissing) {
    const messages = {
      contactName: "Enter your name.",
      contactEmail: "Enter your email address.",
      shootType: "Choose a shoot type.",
      contactMessage: "Tell me a little about the shoot."
    };
    return messages[field.id] || "Complete this field.";
  }

  if (field.validity.typeMismatch && field.type === "email") {
    return "Enter a valid email address.";
  }

  if (field.validity.tooShort) {
    return `Add at least ${field.minLength} characters.`;
  }

  return "";
}

function updateContactField(field) {
  const error = document.querySelector(`#${field.id}Error`);
  const message = contactFieldError(field);
  field.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
  return !message;
}

requiredContactFields.forEach(field => {
  field.setAttribute("aria-invalid", "false");
  field.addEventListener("blur", () => {
    field.dataset.touched = "true";
    updateContactField(field);
  });
  field.addEventListener("input", () => {
    if (field.dataset.touched === "true") updateContactField(field);
  });
  field.addEventListener("change", () => {
    if (field.dataset.touched === "true") updateContactField(field);
  });
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  const invalidFields = requiredContactFields.filter(field => {
    field.dataset.touched = "true";
    return !updateContactField(field);
  });

  if (invalidFields.length) {
    formStatus.textContent = "Please review the fields marked below.";
    invalidFields[0].focus();
    return;
  }

  const details = Object.fromEntries(new FormData(contactForm).entries());
  const subject = encodeURIComponent(`Shoot enquiry: ${details.shootType}`);
  const message = [
    `Name: ${details.name}`,
    `Email: ${details.email}`,
    `Shoot type: ${details.shootType}`,
    `Preferred date: ${details.preferredDate || "Flexible"}`,
    "",
    details.message
  ].join("\n");

  formStatus.textContent = "Opening your email app with the enquiry details…";
  window.location.href = `mailto:hello@ncouragestudios.com?subject=${subject}&body=${encodeURIComponent(message)}`;
});

// Lightbox
const lightbox = document.querySelector("#lightbox");
const lightboxContent = document.querySelector(".lightbox-content");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxLocation = document.querySelector("#lightboxLocation");
const lightboxCategory = document.querySelector("#lightboxCategory");
const lightboxYear = document.querySelector("#lightboxYear");
const lightboxIndex = document.querySelector("#lightboxIndex");
const lightboxTotal = document.querySelector("#lightboxTotal");
const lightboxProgress = document.querySelector("#lightboxProgress");

let currentIndex = 0;
let lastFocusedElement = null;
let touchStart = null;

function visibleItems() {
  return items.filter(item => !item.classList.contains("is-hidden"));
}

function openLightbox(item) {
  currentIndex = visibleItems().indexOf(item);
  lastFocusedElement = item.querySelector(".image-card");
  updateLightbox();
  // Any directional swap from a previous visit is cleared, so the plate
  // only plays its entrance transition on the way in.
  lightboxContent.classList.remove("is-next", "is-prev");
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => document.querySelector(".lightbox-close").focus());
}

function updateLightbox() {
  const visible = visibleItems();
  const item = visible[currentIndex];

  if (!item) return;

  const number = item.querySelector(".placeholder span")?.textContent || String(currentIndex + 1).padStart(2, "0");
  const sourceImage = item.querySelector(".placeholder img");
  lightboxImage.replaceChildren();

  if (sourceImage) {
    const image = sourceImage.cloneNode(true);
    image.loading = "eager";
    image.classList.add("is-loaded");
    lightboxImage.append(image);
  } else {
    const numberLabel = document.createElement("span");
    numberLabel.textContent = number;
    lightboxImage.append(numberLabel);
  }

  lightboxTitle.textContent = item.dataset.title;
  lightboxLocation.textContent = item.dataset.location;
  lightboxCategory.textContent =
    item.dataset.category.charAt(0).toUpperCase() +
    item.dataset.category.slice(1);
  lightboxYear.textContent = item.dataset.year;
  // Editorial plate counter: 03 / 12 style.
  lightboxIndex.textContent = String(currentIndex + 1).padStart(2, "0");
  lightboxTotal.textContent = String(visible.length).padStart(2, "0");
  lightboxProgress.style.width = `${((currentIndex + 1) / visible.length) * 100}%`;
  preloadAdjacentImages();
}

function preloadAdjacentImages() {
  const visible = visibleItems();
  if (visible.length < 2) return;

  [
    visible[(currentIndex + 1) % visible.length],
    visible[(currentIndex - 1 + visible.length) % visible.length]
  ].forEach(item => {
    const image = item.querySelector(".placeholder img");
    if (!image) return;
    const preload = new Image();
    if (image.srcset) preload.srcset = image.srcset;
    preload.sizes = image.sizes;
    preload.src = image.currentSrc || image.src;
  });
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  lastFocusedElement?.focus();
}

// Re-runs the directional keyframes on the plate for every navigation.
function playSwap(direction) {
  lightboxContent.classList.remove("is-next", "is-prev");
  void lightboxContent.offsetWidth;
  lightboxContent.classList.add(direction === "prev" ? "is-prev" : "is-next");
}

function nextImage() {
  const visible = visibleItems();
  if (!visible.length) return;
  currentIndex = (currentIndex + 1) % visible.length;
  updateLightbox();
  playSwap("next");
}

function previousImage() {
  const visible = visibleItems();
  if (!visible.length) return;
  currentIndex = (currentIndex - 1 + visible.length) % visible.length;
  updateLightbox();
  playSwap("prev");
}

items.forEach(item => {
  item.querySelector(".image-card").addEventListener("click", () => {
    openLightbox(item);
  });
});

document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
document.querySelector(".lightbox-next").addEventListener("click", nextImage);
document.querySelector(".lightbox-prev").addEventListener("click", previousImage);

lightbox.addEventListener("click", event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") nextImage();
  if (event.key === "ArrowLeft") previousImage();

  if (event.key === "Tab") {
    const focusable = [...lightbox.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

lightboxContent.addEventListener("touchstart", event => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

lightboxContent.addEventListener("touchend", event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    deltaX < 0 ? nextImage() : previousImage();
  }
  touchStart = null;
}, { passive: true });

// Subtle active nav state while scrolling
// "Home" points at index.html, so links are matched by data-section,
// not by their href, and the hero carries id="home".
const sections = document.querySelectorAll("main section[id]");
const allNavLinks = document.querySelectorAll("[data-section]");
const navLinksBySection = [...allNavLinks].reduce((map, link) => {
  if (link.dataset.section) {
    map[link.dataset.section] ??= [];
    map[link.dataset.section].push(link);
  }
  return map;
}, {});

function setActiveNav(sectionId) {
  const links = navLinksBySection[sectionId];
  if (!links) return;

  allNavLinks.forEach(item => item.classList.remove("active"));
  links.forEach(link => link.classList.add("active"));
}

const observer = new IntersectionObserver(entries => {
  const inView = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!inView.length) return;

  setActiveNav(inView[0].target.id);
}, { threshold: [0.2, 0.45, 0.7] });

sections.forEach(section => observer.observe(section));

// Header transparency: fully see-through only while the page sits at the very
// top, then cross-faded back to the page colour (CSS transition on
// .site-header) as soon as scrollY leaves 0 — so the bar never stays
// transparent over content sliding out from behind it.
const siteHeader = document.querySelector(".site-header");
const hero = document.querySelector(".hero");

function updateHeader() {
  // Solid the moment the page scrolls at all, so the bar never sits
  // transparent over content sliding out from behind it.
  siteHeader.classList.toggle("scrolled", window.scrollY > 0);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader(); // covers reloads restored to a mid-page scroll position

const mobileBooking = document.querySelector(".mobile-booking");
const backToTop = document.querySelector(".back-to-top");
const contactSection = document.querySelector("#contact");
let heroInView = true;
let contactInView = false;

function updateMobileBooking() {
  mobileBooking.classList.toggle("is-visible", !heroInView && !contactInView);
}

const heroVisibilityObserver = new IntersectionObserver(([entry]) => {
  heroInView = entry.isIntersecting;
  updateMobileBooking();
});

heroVisibilityObserver.observe(hero);

const contactVisibilityObserver = new IntersectionObserver(([entry]) => {
  contactInView = entry.isIntersecting;
  updateMobileBooking();
});

contactVisibilityObserver.observe(contactSection);

function updateBackToTop() {
  backToTop.classList.toggle("is-visible", window.scrollY > 500);
}

window.addEventListener("scroll", updateBackToTop, { passive: true });
updateBackToTop();
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Scroll reveal for editorial blocks. Elements opt in with [data-reveal];
// the hidden state is gated behind html.js (set in <head>), so no-JS readers
// always see the page. Reduced-motion users get everything shown immediately.
const revealEls = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealEls.forEach(el => el.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

  revealEls.forEach(el => revealObserver.observe(el));
}

// Gallery plates hold until they scroll into frame, then rise in on a
// stagger set per batch (--stagger, capped so the last plate in a row never
// feels late). Same reduced-motion / no-IntersectionObserver fallback the
// editorial blocks above use.
if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  items.forEach(item => item.classList.add("is-in"));
} else {
  const plateObserver = new IntersectionObserver((entries, obs) => {
    entries
      .filter(entry => entry.isIntersecting)
      .forEach((entry, index) => {
        entry.target.style.setProperty("--stagger", `${Math.min(index * 90, 360)}ms`);
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  items.forEach(item => plateObserver.observe(item));
}

// The ghost "Talk" word drifts against the scroll for a little depth behind
// the contact plate. rAF-throttled, passive, and only computed while the
// section is on screen. Skipped entirely under reduced motion (where CSS
// also pins transform: none).
const ghost = document.querySelector(".contact-ghost");

if (ghost && !prefersReducedMotion.matches) {
  let ghostFrame = false;

  const updateGhost = () => {
    const bounds = ghost.parentElement.getBoundingClientRect();

    if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
      const progress =
        (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
      // Mid-scroll sits at 0, so the word only ever travels ~±23px.
      ghost.style.transform = `translate3d(0, ${(0.5 - progress) * 46}px, 0)`;
    }

    ghostFrame = false;
  };

  window.addEventListener("scroll", () => {
    if (ghostFrame) return;
    ghostFrame = true;
    requestAnimationFrame(updateGhost);
  }, { passive: true });

  updateGhost(); // covers reloads restored mid-page
}