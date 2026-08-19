// PROTOTYPE — scouting-u#22. Throwaway; not for main.
(function () {
  const VARIANTS = [
    { key: "a", label: "Variant A — Vertical rail" },
    { key: "b", label: "Variant B — Alternating bands" },
    { key: "c", label: "Variant C — Pinned horizontal trail" },
  ];

  function currentIndex() {
    const params = new URLSearchParams(location.search);
    const key = params.get("variant") || "a";
    const i = VARIANTS.findIndex((v) => v.key === key);
    return i === -1 ? 0 : i;
  }

  function applyVariant(index) {
    const variant = VARIANTS[index];
    document.documentElement.setAttribute("data-variant", variant.key);
    const label = document.querySelector("[data-ladder-label]");
    if (label) label.textContent = `Variant ${variant.key.toUpperCase()} — ${variant.label.split("— ")[1]}`;
    const params = new URLSearchParams(location.search);
    params.set("variant", variant.key);
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
  }

  let index = currentIndex();
  applyVariant(index);

  function cycle(delta) {
    index = (index + delta + VARIANTS.length) % VARIANTS.length;
    applyVariant(index);
  }

  document.querySelector("[data-ladder-prev]")?.addEventListener("click", () => cycle(-1));
  document.querySelector("[data-ladder-next]")?.addEventListener("click", () => cycle(1));

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
    }
    if (e.key === "ArrowLeft") cycle(-1);
    if (e.key === "ArrowRight") cycle(1);
  });

  // "You are here" stepper. Hidden variants are `display: none`, so they
  // never report as intersecting — no need to re-scope this per variant.
  const stepperLabel = document.querySelector("[data-ladder-stepper-label]");
  const dots = document.querySelectorAll("[data-ladder-dot]");
  const rankEls = document.querySelectorAll("[data-ladder-rank]");

  function setCurrentRank(rank, title) {
    if (stepperLabel) stepperLabel.textContent = title;
    dots.forEach((dot) => {
      dot.toggleAttribute("data-active", dot.getAttribute("data-ladder-dot") === rank);
    });
  }

  if (rankEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          setCurrentRank(el.getAttribute("data-ladder-rank"), el.getAttribute("data-ladder-title"));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    rankEls.forEach((el) => observer.observe(el));
  }
})();
