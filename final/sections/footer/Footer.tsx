import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./footer.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Footer — the capsule close + the puzzle (Figma 400:823).

   Two beats on one warm ground (the page's cream easing into the sheet
   peach #F1E2D8, continuing the scroll's gradient):

   1. The CLOSING CAPSULE — the pill returns for the closing argument:
      a near-white capsule holding "You were going to commit anyway. /
      Commit on better terms." (the second line in the ink→bronze wash)
      and the black Check Eligibility pill.

   2. The PUZZLE BAND — the room photo behind the blurred peach wash,
      eleven squares held open. Same interactive roots as before (hover
      a cell, the wash wipes, the room shows through) but the standing
      tiles now cluster to the RIGHT, leaving the left of the band for
      the slots message + "Talk to us".

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
const ROWS = [-1, 0, 1, 2, 3];
/* the eleven — a staircase WEIGHTED RIGHT (cols 3–7), the left third of
   the band left washed for the slots copy */
const FIXED = new Set([
  "3,-1", "5,-1",
  "4,0", "6,0",
  "3,1", "5,1", "7,1",
  "4,2", "6,2",
  "5,3", "7,3",
]);

export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLElement | null>(null);

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

    /* the puzzle — light the cell under the cursor; the wash returns on
       a slow trail once it leaves. Class-only work, no React re-renders.
       Listeners ride the BAND (the region's parent) so the wipe works
       even while the cursor crosses the slots copy overlay. */
    const region = regionRef.current!;
    const band = region.parentElement!;
    if (!window.matchMedia("(hover: hover)").matches) return () => ctx.revert();
    const onMove = (e: MouseEvent) => {
      const r = region.getBoundingClientRect();
      // frame coords: undo the centred frame's left edge (--fx), then
      // divide by the contain-fit unit
      const u = Math.min(window.innerWidth / 1512, window.innerHeight / 982);
      const fx = window.innerWidth / 2 - 756 * u;
      const xu = (e.clientX - r.left - fx) / u;
      const yu = ((e.clientY - r.top) / r.height) * 818 + TOP;
      const c = Math.min(7, Math.max(-1, Math.floor((xu - COL0) / CELL)));
      const rw = Math.min(3, Math.max(-1, Math.floor((yu - ROW0) / CELL)));
      // the copy's columns never reveal — a sharp slice lighting up
      // behind the words made them unreadable; the wipe belongs to the
      // mosaic's right zone alone (cols 3–7, where the standing tiles
      // live)
      const next =
        c < 3
          ? null
          : region.querySelector<HTMLElement>(
              `.ft__tile[data-cell="${c},${rw}"]`
            );
      if (next === litRef.current) return;
      litRef.current?.classList.remove("is-lit");
      next?.classList.add("is-lit");
      litRef.current = next;
    };
    const onLeave = () => {
      litRef.current?.classList.remove("is-lit");
      litRef.current = null;
    };
    band.addEventListener("mousemove", onMove);
    band.addEventListener("mouseleave", onLeave);
    return () => {
      band.removeEventListener("mousemove", onMove);
      band.removeEventListener("mouseleave", onLeave);
      ctx.revert();
    };
  }, []);

  const goRegister = () =>
    document.querySelector(".rg")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="ft" ref={sectionRef}>
      {/* ── the closing capsule (400:894 / 400:840) ── */}
      <div className="ft__close">
        <h2 className="ft__close-title">
          You were going to commit anyway.
          <br />
          <span className="ft__close-grad">Commit on better terms.</span>
        </h2>
        <button type="button" className="ft__cta" onClick={goRegister}>
          Check Eligibility <span aria-hidden>→</span>
        </button>
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
