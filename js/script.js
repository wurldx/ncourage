const items = [...document.querySelectorAll(".gallery-item")];
const filters = [...document.querySelectorAll(".filter")];
const count = document.querySelector("#visibleCount");

filters.forEach(filter => {
  filter.addEventListener("click", () => {
    const selected = filter.dataset.filter;

    filters.forEach(btn => btn.classList.remove("active"));
    filter.classList.add("active");

    let visible = 0;

    items.forEach((item, index) => {
      const matches = selected === "all" || item.dataset.category === selected;

      if (matches) {
        item.classList.remove("is-hidden");
        item.style.animationDelay = `${Math.min(index * 45, 250)}ms`;
        visible++;
      } else {
        item.classList.add("is-hidden");
      }
    });

    count.textContent = visible;
  });
});

// Mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

menuToggle.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

  // Solid header while the menu is open. siteHeader is declared further down,
  // but this handler only runs on tap — after the script has fully initialized.
  siteHeader.classList.toggle("menu-open", open);
});

mobileMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    // Scroll position decides the header state from here (.scrolled vs transparent).
    siteHeader.classList.remove("menu-open");
  });
});

// Lightbox
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxLocation = document.querySelector("#lightboxLocation");
const lightboxCategory = document.querySelector("#lightboxCategory");
const lightboxIndex = document.querySelector("#lightboxIndex");
const lightboxTotal = document.querySelector("#lightboxTotal");

let currentIndex = 0;

function visibleItems() {
  return items.filter(item => !item.classList.contains("is-hidden"));
}

function openLightbox(item) {
  currentIndex = visibleItems().indexOf(item);
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function updateLightbox() {
  const visible = visibleItems();
  const item = visible[currentIndex];

  if (!item) return;

  const number = item.querySelector(".placeholder span").textContent;
  lightboxImage.innerHTML = `<span>${number}</span>`;
  lightboxTitle.textContent = item.dataset.title;
  lightboxLocation.textContent = item.dataset.location;
  lightboxCategory.textContent =
    item.dataset.category.charAt(0).toUpperCase() +
    item.dataset.category.slice(1);
  // Editorial plate counter: 03 / 12 style.
  lightboxIndex.textContent = String(currentIndex + 1).padStart(2, "0");
  lightboxTotal.textContent = String(visible.length).padStart(2, "0");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function nextImage() {
  const visible = visibleItems();
  currentIndex = (currentIndex + 1) % visible.length;
  updateLightbox();
}

function previousImage() {
  const visible = visibleItems();
  currentIndex = (currentIndex - 1 + visible.length) % visible.length;
  updateLightbox();
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
});

// Subtle active nav state while scrolling
// "Home" points at index.html, so links are matched by data-section,
// not by their href, and the hero carries id="home".
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".desktop-nav a");
const navLinksBySection = [...navLinks].reduce((map, link) => {
  if (link.dataset.section) map[link.dataset.section] = link;
  return map;
}, {});

function setActiveNav(sectionId) {
  const link = navLinksBySection[sectionId];
  if (!link) return;

  navLinks.forEach(item => item.classList.remove("active"));
  link.classList.add("active");
}

const observer = new IntersectionObserver(entries => {
  const inView = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!inView.length) return;

  setActiveNav(inView[0].target.id);
}, { threshold: [0.2, 0.45, 0.7] });

sections.forEach(section => observer.observe(section));

// Header transparency: fully see-through while the hero sits behind it, then
// cross-faded back to the page colour (CSS transition on .site-header) once
// the hero's bottom edge clears the header. Toggling at the header's height,
// not at 0, avoids a window where the transparent bar would show light text
// over the gallery's light background.
const siteHeader = document.querySelector(".site-header");
const hero = document.querySelector(".hero");

function updateHeader() {
  const pastHero = hero.getBoundingClientRect().bottom <= siteHeader.offsetHeight;
  siteHeader.classList.toggle("scrolled", pastHero);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader(); // covers reloads restored to a mid-page scroll position

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