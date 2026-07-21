import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./footer.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Footer — the capsule close + the puzzle (Figma 400:823).

   Two beats on one warm ground (the page's cream easing into the shared
   pale-yellow sheet #F2E5D3, continuing the scroll's gradient):

   1. The CLOSING CAPSULE — the pill returns for the closing argument:
      a near-white capsule holding "You were going to commit anyway. /
      Commit on better terms." (the second line in the ink→bronze wash)
      and the black Check Eligibility pill.

   2. The PUZZLE BAND — the room photo behind the blurred peach wash,
      squares held open across the whole band. Same interactive roots as
      before (hover a cell, the wash wipes, the room shows through); the
      standing tiles frame the slots message + "Talk to us" — above and
      below it — leaving only the cells right behind the words washed.

   Implementation notes carried over: the wash is ONE backdrop-blurred
   sheet; revealed cells are tiles painting the sharp photo ON TOP of it
   (the exit-pane slice trick), so no dynamic masks are ever rebuilt on
   mousemove.
   ──────────────────────────────────────────────────────────────────────── */

const CELL = 169;
const COL0 = 159; // grid anchors, frame px (right edge lands at 1511)
const ROW0 = 305;
const TOP = 164; // the photo region's top edge in its 982-frame terms
const COLS = [-1, 0, 1, 2, 3, 4, 5, 6, 7]; // −1 = the partial edge column
const ROWS = [-1, 0, 1, 2, 3, 4]; // row 4 is the mobile band's bottom-edge bleed
/* the standing tiles — a staircase across the whole band. The right
   (cols 3–7) carries the bulk; on the left only the top-edge tile stands
   (col 1, row −1) so the top row reads across the whole band. The cells
   that would hug the slots copy (left cols, rows 0/1/2/3) are left washed
   and reveal on HOVER only — nothing stands close enough to crowd the
   words */
const FIXED_DESKTOP = new Set([
  // right mosaic
  "3,-1", "5,-1",
  "4,0", "6,0",
  "3,1", "5,1", "7,1",
  "4,2", "6,2",
  "5,3", "7,3",
  // left — just the top edge, clear of the copy
  "1,-1",
]);

/* Phone: the copy sits ABOVE the band (no left third to keep clear), so
   the mosaic reads across the full width. NOT a checkerboard — an
   irregular scatter (Figma 497:895 ref): horizontal clusters (row −1
   cols 1–2, row 2 cols 2–3, row 3 cols 4–5) and vertical clusters (col 4
   rows −1/0, col 5 rows 2/3) break the alternation so the peeks land
   randomly with frosted gaps between. Drag reveals the frosted ones. */
const FIXED_MOBILE = new Set([
  "1,-1", "2,-1", "4,-1",
  "4,0",
  "1,1", "3,1",
  "2,2", "3,2", "5,2",
  "1,3", "4,3", "5,3",
  "3,4",
]);

export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLElement | null>(null);

  /* which standing-tile arrangement to lay: the phone gets the balanced
     weave, wider screens the right-weighted desktop cluster */
  const [isPhone, setIsPhone] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsPhone(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const FIXED = isPhone ? FIXED_MOBILE : FIXED_DESKTOP;

  /* the entrance tween (below) faded the mount-time is-on tiles in with
     inline opacity; if the breakpoint later flips, swap the standing set
     without leaving the old set's inline styles stuck on — CSS then drives
     each tile purely from whether it now carries .is-on. Skips the first
     pass so the entrance fade is never clobbered. */
  const swapped = useRef(false);
  useEffect(() => {
    if (!swapped.current) {
      swapped.current = true;
      return;
    }
    const tiles = sectionRef.current?.querySelectorAll(".ft__tile");
    if (tiles) gsap.set(tiles, { clearProps: "opacity,visibility" });
  }, [isPhone]);

  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);

    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set(q(".ft__close, .ft__slots > *"), { autoAlpha: 0, y: 20 });
      gsap.set(q(".ft__tile.is-on"), { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        onEnter: () => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .to(q(".ft__close"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0)
            .to(
              q(".ft__slots > *"),
              { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1 },
              0.15
            )
            .to(
              q(".ft__tile.is-on"),
              { autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: "power1.inOut" },
              0.3
            );
        },
        once: true,
      });
    }, sectionRef);

    /* the puzzle — light the cell under the pointer; the wash returns on
       a slow trail once it leaves. Class-only work, no React re-renders.
       Desktop hovers the BAND (so the wipe works even under the slots
       copy overlay); the phone DRAGS the region for the same reveal. */
    const region = regionRef.current!;
    const band = region.parentElement!;

    const litTo = (clientX: number, clientY: number) => {
      const r = region.getBoundingClientRect();
      // the tiles ride --uf/--fx, which differ by breakpoint — recompute
      // the same frame math the CSS uses or the cell lookup lands wrong
      const phone = window.matchMedia("(max-width: 640px)").matches;
      const u = phone
        ? window.innerWidth / 756
        : Math.min(window.innerWidth / 1512, window.innerHeight / 982);
      const fx = window.innerWidth / 2 - 756 * u;
      const xu = (clientX - r.left - fx) / u;
      const yu = ((clientY - r.top) / r.height) * 818 + TOP;
      const c = Math.min(7, Math.max(-1, Math.floor((xu - COL0) / CELL)));
      const rw = Math.min(3, Math.max(-1, Math.floor((yu - ROW0) / CELL)));
      // desktop keeps the cells behind the slots copy (left cols, its two
      // rows) frosted so a sharp slice never lights under the words; the
      // phone stacks the copy ABOVE the band, so every cell is fair game
      const behindCopy = !phone && c < 3 && (rw === 1 || rw === 2);
      const next = behindCopy
        ? null
        : region.querySelector<HTMLElement>(`.ft__tile[data-cell="${c},${rw}"]`);
      if (next === litRef.current) return;
      litRef.current?.classList.remove("is-lit");
      next?.classList.add("is-lit");
      litRef.current = next;
    };
    const clearLit = () => {
      litRef.current?.classList.remove("is-lit");
      litRef.current = null;
    };

    const onMove = (e: MouseEvent) => litTo(e.clientX, e.clientY);
    // touch drag = the phone's "hover". Passive / no preventDefault: a
    // vertical drag still scrolls (revealing tiles as it passes), a
    // horizontal drag just plays them.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) litTo(t.clientX, t.clientY);
    };
    band.addEventListener("mousemove", onMove);
    band.addEventListener("mouseleave", clearLit);
    region.addEventListener("touchstart", onTouch, { passive: true });
    region.addEventListener("touchmove", onTouch, { passive: true });
    region.addEventListener("touchend", clearLit);
    region.addEventListener("touchcancel", clearLit);
    return () => {
      band.removeEventListener("mousemove", onMove);
      band.removeEventListener("mouseleave", clearLit);
      region.removeEventListener("touchstart", onTouch);
      region.removeEventListener("touchmove", onTouch);
      region.removeEventListener("touchend", clearLit);
      region.removeEventListener("touchcancel", clearLit);
      ctx.revert();
    };
  }, []);

  const goRegister = () =>
    document.querySelector(".rg")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="ft" ref={sectionRef}>
      {/* ── the closing capsule (400:894 / 400:840) ── */}
      {/* one pill on desktop; on phones it splits into three stacked
          pills — line, gradient line, CTA (Figma 497:895). The h2
          dissolves via display:contents so its two lines become pill
          siblings of the CTA; the grad text keeps its own inner span so
          its background-clip gradient never fights the pill's fill. */}
      <div className="ft__close">
        <h2 className="ft__close-title">
          <span className="ft__close-l1">You were going to commit anyway</span>
          <span className="ft__close-l2">
            <span className="ft__close-grad">Commit on better terms</span>
          </span>
        </h2>
        <div className="ft__cta-wrap">
          <button type="button" className="ft__cta" onClick={goRegister}>
            Check Eligibility <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* ── the slots band: copy left, puzzle weighted right (400:852) ── */}
      <div className="ft__band">
        <div className="ft__region" ref={regionRef} aria-hidden>
          <img className="ft__photo" src="/footer-room.jpg" alt="" />
          <div className="ft__wash" />
          {COLS.map((c) =>
            ROWS.map((r) => {
              const x = COL0 + c * CELL;
              const y = ROW0 + r * CELL - TOP;
              const key = `${c},${r}`;
              return (
                <div
                  key={key}
                  data-cell={key}
                  className={`ft__tile${FIXED.has(key) ? " is-on" : ""}`}
                  style={{
                    left: `calc(var(--fx) + var(--uf) * ${x})`,
                    top: `calc(var(--uf) * ${y})`,
                  }}
                >
                  <img
                    src="/footer-room.jpg"
                    alt=""
                    style={{
                      left: `calc(-1 * (var(--fx) + var(--uf) * ${x}))`,
                      top: `calc(var(--uf) * ${-y})`,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="ft__slots">
          <p className="ft__slots-line">
            We open a limited number of Flent&nbsp;11 slots every month.
          </p>
          <p className="ft__slots-ask">
            <strong>Still unsure?</strong>
            <br />
            Talk to the Flent team before you decide.
          </p>
          <button type="button" className="ft__talk" onClick={goRegister}>
            Talk to us
          </button>
        </div>
      </div>
    </section>
  );
}
