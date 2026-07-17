import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./footer.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Footer — the puzzle close (Figma 316:2059, Page 2).

   A room photo spans the bottom 818u of the frame, hidden behind a white
   wash — Figma's Subtract sheet: solid white fading 100%→~43% down the
   sheet WITH a background blur that fades alongside it (Figma masks
   backdrop blur by the fill's alpha; here one mask-image drives both).
   Square holes in the sheet show the sharp photo beneath.

   Exactly ELEVEN squares stay open — the design draws a 12th, partial
   square at the left edge; it's dropped so the count reads as the
   product's number (the copy above says so). Every other 169u grid cell
   reveals its piece of the photo only while the cursor rests on it —
   wipe the wash, the room shows through, piece by puzzle piece.

   Implementation: the wash is ONE backdrop-blurred sheet; revealed cells
   are tiles painting the sharp photo ON TOP of it (the exit-pane slice
   trick), so no dynamic masks are ever rebuilt on mousemove.
   ──────────────────────────────────────────────────────────────────────── */

const CELL = 169;
const COL0 = 159; // grid anchors, frame px (right edge lands at 1511)
const ROW0 = 305;
const TOP = 164; // the photo region's top edge in the 982 frame
const COLS = [-1, 0, 1, 2, 3, 4, 5, 6, 7]; // −1 = the partial edge column
const ROWS = [-1, 0, 1, 2, 3];
/* the eleven — a checkerboard staircase rising to the right */
const FIXED = new Set([
  "0,2", "1,3", "2,2", "3,3", "4,2",
  "5,1", "5,3", "6,0", "6,2", "7,1", "7,3",
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
      gsap.set(q(".ft__head, .ft__line, .ft__cta"), { autoAlpha: 0, y: 20 });
      gsap.set(q(".ft__tile.is-on"), { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: section,
        start: "top 62%",
        onEnter: () => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .to(q(".ft__head"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0)
            .to(q(".ft__line"), { autoAlpha: 1, y: 0, duration: 0.55 }, 0.12)
            .to(q(".ft__cta"), { autoAlpha: 1, y: 0, duration: 0.5 }, 0.22)
            .to(
              q(".ft__tile.is-on"),
              { autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: "power1.inOut" },
              0.25
            );
        },
        once: true,
      });
    }, sectionRef);

    /* the puzzle — light the cell under the cursor; the wash returns on
       a slow trail once it leaves. Class-only work, no React re-renders. */
    const region = regionRef.current!;
    if (!window.matchMedia("(hover: hover)").matches) return () => ctx.revert();
    const onMove = (e: MouseEvent) => {
      const r = region.getBoundingClientRect();
      const xu = ((e.clientX - r.left) / r.width) * 1512;
      const yu = ((e.clientY - r.top) / r.height) * 818 + TOP;
      const c = Math.min(7, Math.max(-1, Math.floor((xu - COL0) / CELL)));
      const rw = Math.min(3, Math.max(-1, Math.floor((yu - ROW0) / CELL)));
      const next = region.querySelector<HTMLElement>(
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
    region.addEventListener("mousemove", onMove);
    region.addEventListener("mouseleave", onLeave);
    return () => {
      region.removeEventListener("mousemove", onMove);
      region.removeEventListener("mouseleave", onLeave);
      ctx.revert();
    };
  }, []);

  const goRegister = () =>
    document.querySelector(".rg")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="ft" ref={sectionRef}>
      {/* ── the closing words (316:2077/2078) ── */}
      <h2 className="ft__head">
        You were going to commit anyway.
        <br />
        Commit on better terms.
      </h2>
      <div className="ft__row">
        <p className="ft__line">11 slots per month</p>
        <button type="button" className="ft__cta" onClick={goRegister}>
          Check Eligibility <span aria-hidden>→</span>
        </button>
      </div>

      {/* ── the puzzle (photo · wash · tiles) ── */}
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
                  left: `calc(var(--uf) * ${x})`,
                  top: `calc(var(--uf) * ${y})`,
                }}
              >
                <img
                  src="/footer-room.jpg"
                  alt=""
                  style={{
                    left: `calc(var(--uf) * ${-x})`,
                    top: `calc(var(--uf) * ${-y})`,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
