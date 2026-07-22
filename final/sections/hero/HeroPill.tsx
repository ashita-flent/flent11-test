import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import "./hero-pill.css";

/* ────────────────────────────────────────────────────────────────────────
   Hero — the "11 opens" intro (Figma Page 2 storyboard: Frame 18143615 →
   18143614 → 18143613 → frame4 / 329:2547, 2026-07-18 layout pass:
   wordmark+headline on the 83 column, CTA top-right, supporting line
   right of the headline).

   The page opens on the brand's two chamfered bars — the "11". They part
   and grow while a capsule window emerges between them, expands across
   the frame (swallowing the bars), and settles as the hero image; the
   wordmark, headline and CTA land last. The photo NEVER moves — every
   beat only regrows the capsule hole (a clip-path inset+round), exactly
   how the design's Subtract layers do it.

   Geometry is the 1512×982 design frame via --u (the storyboard's three
   intro frames are 1546 wide; all elements are frame-centred, so their
   coords are normalised here by −17). Time-based like the old door
   intro; reduced-motion jumps to the settled frame.
   ──────────────────────────────────────────────────────────────────────── */

/* capsule hole per beat, frame coords [top, right-edge→, bottom, left] */
const PILL_EMERGE = { t: 413, r: 1512 - 993, b: 982 - 569, l: 519 }; // 474×156
const PILL_WIDE = { t: 309, r: 1512 - 1310, b: 982 - 674, l: 202 }; // 1108×365
const PILL_SETTLE = { t: 173.41, r: 1512 - 1448.56, b: 982 - 629.84, l: 63 }; // 329:2549

/* the bars: 19u wide, chamfer dips 8.15% of height toward the seam */
const BAR0 = { w: 19, h: 105, y: 438, lx: 725, rx: 768 }; // the "11"
const BAR1 = { w: 19, h: 145, y: 419, lx: 451, rx: 1043 }; // parted

export default function HeroPill() {
  const sectionRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const clip = clipRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* beat rects in px. Desktop: frame coords × u (the clip layer IS the
       centred 1512u×982u frame). Mobile: hand-tuned viewport beats — the
       same choreography re-proportioned for a portrait screen. */
    type Rect = { t: number; r: number; b: number; l: number };
    let emerge: Rect, wide: Rect, settle: Rect;
    let bar0 = { ...BAR0 }, bar1 = { ...BAR1 };
    let fw: number, fh: number; // clip layer box

    if (!mobile) {
      const u = Math.min(window.innerWidth / 1512, window.innerHeight / 982);
      const s = (v: number) => v * u;
      fw = s(1512);
      fh = s(982);
      const px = (o: typeof PILL_EMERGE) => ({ t: s(o.t), r: s(o.r), b: s(o.b), l: s(o.l) });
      emerge = px(PILL_EMERGE);
      wide = px(PILL_WIDE);
      settle = px(PILL_SETTLE);
      bar0 = { w: s(BAR0.w), h: s(BAR0.h), y: s(BAR0.y), lx: s(BAR0.lx), rx: s(BAR0.rx) };
      bar1 = { w: s(BAR1.w), h: s(BAR1.h), y: s(BAR1.y), lx: s(BAR1.lx), rx: s(BAR1.rx) };
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      fw = vw;
      fh = vh;
      // the bars sit on the middle slat's centre (404:257 — slat 2 spans
      // 246..359 of the 874 frame); the slats do the rest
      const cy = (302.5 / 874) * vh;
      emerge = wide = settle = { t: 0, r: 0, b: 0, l: 0 }; // unused on phones
      bar0 = { w: 15, h: 84, y: cy - 42, lx: vw / 2 - 25, rx: vw / 2 + 10 };
      bar1 = { w: 15, h: 118, y: cy - 59, lx: vw / 2 - 158, rx: vw / 2 + 143 };
    }

    const barL = section.querySelector<HTMLElement>(".hp__bar--l")!;
    const barR = section.querySelector<HTMLElement>(".hp__bar--r")!;
    const setBars = (b: typeof bar0) => {
      gsap.set(barL, { left: b.lx, top: b.y, width: b.w, height: b.h });
      gsap.set(barR, { left: b.rx, top: b.y, width: b.w, height: b.h });
    };

    /* the capsule hole — a proxy drives clip-path so every beat stays a
       true capsule (round tracks the shrinking height automatically) */
    const hole = { t: fh / 2, r: fw / 2, b: fh / 2, l: fw / 2 }; // closed slit
    const paint = () =>
      gsap.set(clip, {
        clipPath: `inset(${hole.t}px ${hole.r}px ${hole.b}px ${hole.l}px round 9999px)`,
      });

    const R = "round 999px"; // capsule ends, any slat height
    const slats = [...section.querySelectorAll<HTMLElement>(".hp__slat")];
    /* every slat starts as a closed centre slit and spreads WIDTHWISE —
       the same pill-growth as the desktop capsule; the outer pair join
       while the middle is still opening */
    const SLAT_CLOSED = `inset(0% 50% 0% 50% ${R})`;

    const ctx = gsap.context(() => {
      gsap.set(q(".hp__brand, .hp__title, .hp__sub, .hp__cta"), { autoAlpha: 0, y: 16 });
      setBars(bar0);
      gsap.set([barL, barR], { autoAlpha: 0 });
      if (mobile) {
        slats.forEach((el) => gsap.set(el, { clipPath: SLAT_CLOSED }));
      } else {
        paint();
      }

      if (reduce) {
        if (mobile) {
          slats.forEach((el) => gsap.set(el, { clipPath: `inset(0% ${R})` }));
        } else {
          Object.assign(hole, settle);
          paint();
        }
        gsap.set(q(".hp__brand, .hp__title, .hp__sub, .hp__cta"), { autoAlpha: 1, y: 0 });
        gsap.set([barL, barR], { autoAlpha: 0 });
        return;
      }

      const tl = gsap.timeline();
      // the 11 reads first...
      tl.to([barL, barR], { autoAlpha: 1, duration: 0.35, ease: "power1.out" }, 0.1);
      // ...the bars lead apart...
      tl.to(barL, { left: bar1.lx, top: bar1.y, width: bar1.w, height: bar1.h, duration: 0.7, ease: "power2.inOut" }, 0.7)
        .to(barR, { left: bar1.rx, top: bar1.y, width: bar1.w, height: bar1.h, duration: 0.7, ease: "power2.inOut" }, 0.7);

      if (mobile) {
        /* ...the middle pill flows through the gap and SPREADS — the same
           widthwise growth as the desktop capsule — and while it's still
           growing, the pills above and below it appear as centre slits
           and spread with it, the image surfacing through all three
           (404:257). Numeric proxies keep the insets symmetric every
           frame (string-tweened clip-paths drift off-centre once the
           browser serialises them to shorthand). */
        const spread = (el: HTMLElement, at: number, dur: number) => {
          const p = { v: 50 };
          tl.to(
            p,
            {
              v: 0,
              duration: dur,
              ease: "power2.inOut",
              onUpdate: () =>
                gsap.set(el, {
                  clipPath: `inset(0% ${p.v}% 0% ${p.v}% ${R})`,
                }),
            },
            at
          );
        };
        spread(slats[1], 0.75, 1.35);
        spread(slats[0], 1.05, 1.15);
        spread(slats[2], 1.15, 1.15);
        tl.set([barL, barR], { autoAlpha: 0 }, 1.6); // swallowed mid-spread
        tl.to(q(".hp__brand"), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.1)
          .to(q(".hp__title"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.25)
          .to(q(".hp__sub"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.35)
          .to(q(".hp__cta"), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.5);
      } else {
        /* ONE unbroken motion: the storyboard beats are waypoints inside a
           single tween — emerge between the bars, take the width, settle —
           so the capsule never stops growing (a per-beat chain reads
           frame-by-frame; velocity must never touch zero mid-flight). */
        const path = gsap.utils.interpolate([{ ...hole }, emerge, wide, settle]);
        const prog = { p: 0 };
        tl.to(
          prog,
          {
            p: 1,
            duration: 2.4,
            ease: "power2.inOut",
            onUpdate: () => {
              Object.assign(hole, path(prog.p));
              paint();
            },
          },
          0.75
        );
        tl.set([barL, barR], { autoAlpha: 0 }, 2.4); // long swallowed by now
        // the frame furnishes itself while the capsule is still landing
        tl.to(q(".hp__brand"), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.55)
          .to(q(".hp__title"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.7)
          .to(q(".hp__sub"), { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 2.8)
          .to(q(".hp__cta"), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.9);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goRegister = () =>
    document.querySelector(".rg")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="hp" ref={sectionRef}>
      <div className="hp__frame">
        {/* the brand bars — chamfer stays 8.15% of height at any size */}
        <svg className="hp__bar hp__bar--l" viewBox="0 0 19 105" preserveAspectRatio="none" aria-hidden>
          <path d="M0 0L19 8.554V105H0V0Z" fill="#000" />
        </svg>
        <svg className="hp__bar hp__bar--r" viewBox="0 0 19 105" preserveAspectRatio="none" aria-hidden>
          <path d="M19 0L0 8.554V105H19V0Z" fill="#000" />
        </svg>

        {/* the capsule window — the photo is fixed, only the hole grows */}
        <div className="hp__clip" ref={clipRef}>
          <img
            className="hp__img"
            src="/hero-room.jpg?v=4"
            alt="A flent home — staircase, gallery wall, someone at ease"
            fetchPriority="high"
          />
        </div>

        {/* phone: three capsule slats onto the same fixed scene (404:257) */}
        <div className="hp__slats" aria-hidden>
          {[122, 246, 369].map((sy, i) => (
            <div
              key={sy}
              className={`hp__slat hp__slat--${i}`}
              style={{ "--sy": sy } as React.CSSProperties}
            >
              <img src="/hero-room.jpg?v=4" alt="" />
            </div>
          ))}
        </div>

        <img className="hp__brand" src="/hero-flent11.svg" alt="flent 11" />

        <h1 className="hp__title">
          11 month lock-in
          <br />
          finally made <em>worth it</em>
        </h1>
        <p className="hp__sub">
          Flent 11 turns a standard 11-month lock-in into a better rental
          plan — with savings, monthly flexibility, and better terms around
          early exits.
        </p>
        <button type="button" className="hp__cta" onClick={goRegister}>
          Check Eligibility <span aria-hidden>→</span>
        </button>
      </div>
    </section>
  );
}
