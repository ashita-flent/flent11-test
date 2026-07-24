import { useEffect, useRef, useState } from "react";
import "./nav.css";

/* ────────────────────────────────────────────────────────────────────────
   Nav — the floating top bar (Figma 489:584 desktop / 489:759 mobile):
   a glass flent-wordmark pill on the left and a solid "Check Eligibility →"
   pill on the right, sized to the same height.

   It stays fixed over every section and wears a LIGHT or DARK skin depending
   on the section scrolling under it (the design ships both variants). The bar
   itself is fully transparent — no fill or blur behind it — so the skin's ink
   colour alone carries it over each ground.

   Theme model: each section the nav rides over has a dominant ground —
   light (the cream sheet) or dark (a room photo / evening frame). The map
   below keys those grounds by the section's root class; on scroll we find
   whichever section crosses the nav's waist and wear its skin. Live rects
   are read every frame so GSAP-pinned sections (journey, exit) resolve
   correctly while they're position:fixed.
   ──────────────────────────────────────────────────────────────────────── */

// section root class → dark skin. `true` = the whole section is dark. A
// NUMBER = dark only once that section's own scroll progress passes it, for
// grounds that shift mid-section. A FUNCTION = decide per-state from the
// element. Absent ⇒ always light.
//
// Measured the real ground behind the bar per section: every section reads
// light (cream / white, 0.72–0.96) except the pinned journey. The journey
// opens on a light room (~0.7) then its financing beats run dark (~0.2) with
// white copy — so with the bar transparent it needs a dark skin over the
// beats but a light one over the intro, hence the 0.08 progress threshold.
// The pay-upfront is light on desktop (cream ground) but DARK on phones
// (the full-bleed candle photo, 418:865) and whenever its detail is
// expanded full-bleed (both breakpoints), so it decides live.
const DARK_SECTIONS: Record<
  string,
  true | number | ((el: HTMLElement) => boolean)
> = {
  ".how__winclip": 0.08,
  ".upf": (el) =>
    el.classList.contains("is-open") ||
    window.matchMedia("(max-width: 640px)").matches,
};

// the sections, top-to-bottom (DOM order), by the root class each renders
const SECTION_SELECTORS = [
  ".hp", // hero
  ".how__winclip", // journey
  ".exit-trust-wash", // exit + trust
  ".lc", // lock-in cards
  ".upf", // pay-upfront
  ".fq", // faq
  ".pr", // social proof
  ".ft", // footer
];

const goRegister = () =>
  document.querySelector(".rg")?.scrollIntoView({ behavior: "smooth" });

export default function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current!;

    let raf = 0;
    const update = () => {
      raf = 0;
      // probe the nav's vertical middle. Several sections can straddle it at
      // a hand-off (a pinned spacer still spans it while the next section has
      // scrolled up over the top); the one visually AT the bar is the frontmost
      // — the greatest top that's still ≤ the probe. That owns the skin.
      const probe = nav.offsetHeight * 0.5;
      let skin: "light" | "dark" = "light";
      let bestTop = -Infinity;
      for (const sel of SECTION_SELECTORS) {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) continue;
        // GSAP-pinned sections get wrapped in a .pin-spacer that holds their
        // whole scroll range at the top; the pinned inner element can sit
        // mid-viewport and never reach the bar, so read the spacer instead.
        const target = el.closest<HTMLElement>(".pin-spacer") ?? el;
        const r = target.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe && r.top > bestTop) {
          bestTop = r.top;
          const rule = DARK_SECTIONS[sel];
          let dark = rule === true;
          if (typeof rule === "number") {
            // how far into this (usually pinned) section we've scrolled
            const scrollable = target.offsetHeight - window.innerHeight;
            const prog = scrollable > 0 ? -r.top / scrollable : 0;
            dark = prog >= rule;
          } else if (typeof rule === "function") {
            dark = rule(el);
          }
          skin = dark ? "dark" : "light";
        }
      }
      setTheme(skin);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // the pay-upfront flips light↔dark on open WITHOUT a scroll (and it
    // locks the page while expanded), so re-probe when its class changes
    const upf = document.querySelector(".upf");
    const mo = upf
      ? new MutationObserver(onScroll)
      : null;
    mo?.observe(upf!, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mo?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header ref={navRef} className={`nav nav--${theme}`}>
      {/* mobile only — a scrim+blur over the phone's status-bar/dock zone so
          scrolled content fades out ("disappearing" effect, daylight-style) */}
      <span className="nav__dock" aria-hidden />
      <nav className="nav__inner" aria-label="Primary">
        <a
          className="nav__logo"
          href="https://flent.in"
          aria-label="flent 11 — flent.in"
        >
          <span className="nav__logo-mark" aria-hidden />
        </a>
        <div className="nav__ctas">
          <button
            type="button"
            className="nav__cta nav__cta--primary"
            onClick={goRegister}
          >
            Check Eligibility <span aria-hidden>→</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
