function getRevealTargets() {
  const explicit = document.querySelectorAll("[data-reveal]");
  if (explicit.length) return [...explicit];

  const main = document.querySelector("main");
  if (!main) return [];

  const isFrame =
    main.className.includes("frame") || main.className.includes("Frame");
  if (isFrame) {
    return [...main.querySelectorAll(":scope > section, :scope > div")];
  }

  const frame = main.querySelector('[class*="frame"], [class*="Frame"]');
  if (frame) {
    return [...frame.querySelectorAll(":scope > section, :scope > div")];
  }

  return [...main.querySelectorAll(":scope > section, :scope > div")];
}

function initScrollReveal() {
  const targets = getRevealTargets();
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;

  const toggle = () => btn.classList.toggle("is-visible", window.scrollY > 400);
  window.addEventListener("scroll", toggle, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initBackToTop();
});
