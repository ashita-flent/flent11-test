import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PaneWindow,
  FlowWire,
  LABEL_X,
  LABEL_Y,
  inr,
} from "../how/HowItWorks";
import "../how/how.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Upfront — the pay-upfront act as its own section (extracted from the
   journey's closing beats; now follows the lock-in comparison table).

   A: the white break slide (Figma 18143458) — the offer stated plainly,
      the lamp-lit wall peeking in a strip on the right (the strip IS the
      detail page's left edge, parked shifted).
   B: "See how it works" slides the pair left as one filmstrip — the
      detail page (Frame 7) with the dark candle-lit window, the tenant
      card paying flent directly, and the months gathering into the one
      price. Click-only; scroll locks until Back.

   The visual grammar (classes, --u frame, window rigs) is the journey's —
   this section reuses how.css wholesale under the same `how` root class.
   ──────────────────────────────────────────────────────────────────────── */

/* the strip seam in viewport terms: frame-centre + 344u (frame-x 1100).
   On phones the wall parks fully offscreen — the break reads as a plain
   paper slide. */
const peekPx = () =>
  window.matchMedia("(max-width: 640px)").matches
    ? window.innerWidth
    : window.innerWidth / 2 +
      344 * Math.min(window.innerWidth / 1512, window.innerHeight / 982);

export default function Upfront({ rent }: { rent: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const glowRigRef = useRef<HTMLDivElement>(null);
  const frameRigRef = useRef<HTMLDivElement>(null);
  const warmBgRef = useRef<HTMLDivElement>(null);
  const uARef = useRef<HTMLDivElement>(null);
  const uBRef = useRef<HTMLDivElement>(null);

  /* the detail page — click-only, pushed in from the right */
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;
  const swapRef = useRef<gsap.core.Timeline | null>(null);
  // the close branch must NEVER run at mount: it would overwrite the
  // parked strip/panel positions. It only plays after a real open.
  const hadOpenRef = useRef(false);

  /* hovering the strip nudges ONLY the peek — the paper's edge, its
     floating link and the wall lean left 48px together; the copy on the
     paper never moves. (The hit zone itself stays fixed so the hover
     can't flap at the seam.) */
  const nudgeStrip = (on: boolean) => {
    if (openRef.current) return;
    if (swapRef.current?.isActive()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current!;
    const N = on ? 48 : 0;
    const vars = {
      duration: on ? 0.45 : 0.55,
      ease: on ? "power3.out" : "power3.inOut",
      overwrite: "auto" as const,
    };
    gsap.to(section.querySelectorAll(".how__break-panel, .how__break-see"), {
      x: -N,
      ...vars,
    });
    gsap.to(warmBgRef.current, { x: peekPx() - N, ...vars });
  };

  // the chevrons walk you on to the next section
  const goOnward = () => {
    const s = sectionRef.current!;
    window.scrollTo({ top: s.offsetTop + s.offsetHeight, behavior: "smooth" });
  };

  /* ── mount: park the peek, hide the night pieces, entrance + parking ── */
  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const rigs = [rigRef.current!, glowRigRef.current!, frameRigRef.current!];
    const ctx = gsap.context(() => {
      const q = (sel: string) => section.querySelectorAll(sel);

      gsap.set(warmBgRef.current, { x: peekPx() });
      // the window arrives only with the detail page — at its HOME pose
      // (Frame 7's placement; the swap adds the −31u x shift)
      gsap.set(rigs, { autoAlpha: 0 });
      gsap.set(rigRef.current, { "--frost": "16.445px" });
      gsap.set(uBRef.current, { autoAlpha: 0 });
      gsap.set(q(".how__plit, .how__m2, .how__m2-glow, .how__wprice"), {
        autoAlpha: 0,
      });
      // journey-beat furniture the shared window carries — never lit here
      gsap.set(q(".how__pamt, .how__pdisc, .how__catch, .how__scroll-on"), {
        autoAlpha: 0,
      });

      // entrance — the ask reads first, then the offer, then the way in
      // (replays on every re-entry, like the journey's beat arrivals did)
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: section,
            start: "top 55%",
            toggleActions: "restart none none none",
          },
        })
        .set(q(".how__uhead-kicker, .how__uhead-line"), { autoAlpha: 0, y: 14 })
        .set(q(".how__break-see, .how__break-down"), { autoAlpha: 0 })
        .to(q(".how__uhead-kicker"), { autoAlpha: 1, y: 0, duration: 0.5 }, 0.25)
        .to(q(".how__uhead-line"), { autoAlpha: 1, y: 0, duration: 0.5 }, 0.5)
        .to(q(".how__break-see"), { autoAlpha: 1, duration: 0.5 }, 1.0)
        .to(q(".how__break-down"), { autoAlpha: 1, duration: 0.5 }, 1.15);

      // gentle parking: the slide is a full-viewport composition — when
      // the scroll rests nearby, settle it fully in view (same grammar as
      // the exit sheet's snap break)
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        snap: {
          snapTo: (v: number) => (Math.abs(v - 0.5) < 0.22 ? 0.5 : v),
          inertia: false,
          duration: { min: 0.2, max: 0.5 },
          delay: 0.08,
          ease: "power2.out",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ── the detail swap — the break pushes left, the night page slides in
     from the right; closing reverses it ── */
  useLayoutEffect(() => {
    if (!open && !hadOpenRef.current) return;
    if (open) hadOpenRef.current = true;
    const section = sectionRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);
    const uA = uARef.current!;
    const uB = uBRef.current!;
    const rigs = [rigRef.current!, glowRigRef.current!, frameRigRef.current!];
    const warmBg = warmBgRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduce ? 0 : 1;

    swapRef.current?.kill();
    // the detail page owns the screen: no scrolling until Back
    document.documentElement.style.overflow = open ? "hidden" : "";
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
    swapRef.current = tl;

    const mobileL = window.matchMedia("(max-width: 640px)").matches;
    const peek = peekPx();

    if (open) {
      const u = Math.min(window.innerWidth / 1512, window.innerHeight / 982);
      // Frame 7 rests the window at x 904 (home is 935); on phones the
      // window instead drops 12vh so the tenant card clears its top edge
      const winShift = mobileL ? 0 : -31 * u;
      const labels = q(".how__plabel");
      tl.set(rigs, { y: mobileL ? window.innerHeight * 0.12 : 0 })
        .set(q(".how__m1"), { autoAlpha: 1, y: 0 })
        .set(q(".how__pane--m1 .how__plit, .how__plit--m2, .how__m2-glow"), {
          autoAlpha: 1,
        })
        .set(q(".how__m2"), { autoAlpha: 1, y: 0 })
        .set(q(".how__wprice"), { autoAlpha: 0 })
        .set(labels, { x: 0, y: 0, opacity: 1, transition: "none" })
        .set(q(".how__ustep--b .how__fin2-card"), { autoAlpha: 0, y: 14 })
        .set(q(".how__ustep--b .how__tflow-wire"), {
          clipPath: "inset(0 100% 0 0)",
        })
        .set(q(".how__ub-flent"), {
          autoAlpha: 0,
          scale: 0.9,
          transformOrigin: "50% 50%",
        })
        // the filmstrip slide: the panel exits left while the wall (the
        // detail page's own backdrop, already peeking in the strip)
        // slides in GLUED to its trailing edge — one continuous surface,
        // no crossfade. The strip's link steps aside first.
        .to(q(".how__break-see"), { autoAlpha: 0, duration: 0.15 * D }, 0)
        .to(q(".how__break-down"), { autoAlpha: 0, duration: 0.15 * D }, 0)
        .to(uA, { x: -peek, duration: 0.8 * D, ease: "power3.inOut" }, 0)
        .to(
          q(".how__break-panel, .how__break-see"),
          { x: 0, duration: 0.8 * D, ease: "power3.inOut" },
          0
        )
        .to(warmBg, { x: 0, duration: 0.8 * D, ease: "power3.inOut" }, 0)
        .fromTo(
          uB,
          { autoAlpha: 0, x: 140, y: 0 },
          { autoAlpha: 1, x: 0, duration: 0.6 * D, ease: "power3.out" },
          0.4
        )
        .fromTo(
          rigs,
          { x: winShift + 110 * (reduce ? 0 : 1), autoAlpha: 0 },
          { x: winShift, autoAlpha: 1, duration: 0.6 * D, ease: "power3.out" },
          0.42
        )
        // …then the page tells its story: the card pays flent, and the
        // months gather into the one payment for the whole stay
        .to(
          q(".how__ustep--b .how__fin2-card"),
          { autoAlpha: 1, y: 0, duration: 0.4 * D },
          0.8
        )
        .to(
          q(".how__ustep--b .how__tflow-wire"),
          { clipPath: "inset(0 0% 0 0)", duration: 0.7 * D, ease: "power1.inOut" },
          1.15
        )
        .to(
          q(".how__ub-flent"),
          { autoAlpha: 1, scale: 1, duration: 0.35 * D, ease: "back.out(1.4)" },
          1.75
        )
        .to(
          labels,
          {
            x: (i: number) => {
              const p = i + 1;
              const lx = (p % 3) * 170 + LABEL_X[p % 3];
              return (255 - lx) * u;
            },
            y: (i: number) => {
              const p = i + 1;
              const ly = Math.floor(p / 3) * 170 + LABEL_Y[Math.floor(p / 3)];
              return (330 - ly) * u;
            },
            opacity: 0,
            duration: 0.75 * D,
            ease: "power2.inOut",
            stagger: 0.05 * D,
          },
          1.95
        )
        .to(
          q(".how__wprice"),
          { autoAlpha: 1, duration: 0.45 * D, ease: "power2.out" },
          2.8
        );
    } else {
      // hand everything back: the detail leaves right, the break returns
      tl.to(uB, { autoAlpha: 0, x: 140, duration: 0.45 * D, ease: "power2.in" }, 0)
        .to(rigs, { autoAlpha: 0, duration: 0.4 * D }, 0)
        .to(warmBg, { x: peek, duration: 0.75 * D, ease: "power3.inOut" }, 0.05)
        .to(uA, { x: 0, autoAlpha: 1, duration: 0.75 * D, ease: "power3.inOut" }, 0.05)
        .to(
          q(".how__break-see, .how__break-down"),
          { autoAlpha: 1, duration: 0.35 * D },
          0.55
        )
        .set(uB, { x: 0 })
        .set(rigs, { x: 0, y: 0 })
        .set(q(".how__plit, .how__m2, .how__m2-glow, .how__wprice"), {
          autoAlpha: 0,
        })
        .set(q(".how__plabel"), {
          clearProps: "x,y,opacity,visibility,transition",
        });
    }

    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <section className="how upf" ref={sectionRef}>
      <div className="how__stage">
        {/* lamp-lit evening wall (Figma 65:522) — parked shifted so its
            left edge peeks in the strip; the open slides it to 0 */}
        <div className="how__warmbg" ref={warmBgRef} aria-hidden>
          <img src="/how-warm-bg.png" alt="" />
        </div>
        {/* the act's wash + blur — one continuous treated surface across
            the strip and the opened page */}
        <div className="how__scrim how__scrim--c" aria-hidden />

        {/* warm glows behind the lit panes — stage level, composites
            against the wall */}
        <div className="how__glowrig is-upfront" ref={glowRigRef} aria-hidden>
          <div className="how__m1-glow" />
          <div className="how__m2-glow" />
        </div>

        {/* contain-fit 1512×982 design frame */}
        <div className="how__frame">
          {/* ── act A — the white break slide (Figma 18143458) ── */}
          <div className="how__step how__ustep--a" ref={uARef}>
            <div className="how__break-panel" />
            <div className="how__uhead">
              <p className="how__uhead-kicker">
                Prefer to skip the financing entirely?
              </p>
              <p className="how__uhead-line">
                Pay upfront <strong>and get 2 months off</strong>
              </p>
            </div>
            <div
              className="how__break-strip"
              onPointerEnter={() => nudgeStrip(true)}
              onPointerLeave={() => nudgeStrip(false)}
              onClick={() => setOpen(true)}
              aria-hidden
            />
            <button
              type="button"
              className="how__break-see"
              onPointerEnter={() => nudgeStrip(true)}
              onPointerLeave={() => nudgeStrip(false)}
              onClick={() => setOpen(true)}
            >
              See how it works <span aria-hidden>&rarr;</span>
            </button>
            <button
              type="button"
              className="how__break-down"
              onClick={goOnward}
              aria-label="Continue on"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M7 6l5 5 5-5" />
                <path d="M7 13l5 5 5-5" />
              </svg>
            </button>
          </div>

          {/* ── act B — the offer summary (Figma Frame 7) ── */}
          <div className="how__step how__ustep--b" ref={uBRef}>
            <button
              type="button"
              className="how__uback"
              onClick={() => setOpen(false)}
            >
              <span aria-hidden>&larr;</span> Back
            </button>
            <div className="how__copy how__copy--scaffold how__copy--monthly">
              <h3 className="how__title">
                No EMIs, No financer,
                <br />
                just you and Flent
              </h3>
              <p className="how__body">
                Nine months cover the whole stay — the discount is applied
                into the price, so money never comes back because it never
                leaves. You pay Flent directly.
              </p>
            </div>
            {/* Figma 253:2664 — the same tenant card as the EMI beat
                carries the discounted upfront price straight to flent */}
            <div className="how__fin2-card how__fin2-card--ub">
              <div className="how__fin2-tenant">
                <img src="/how-tenant.png" alt="" />
                <span className="how__fin2-tname">
                  <strong>Akanksha Mishra</strong>
                  Flent Tenant
                </span>
              </div>
              <div className="how__fin2-amts">
                ₹ {inr(rent * 9)} <s>₹ {inr(rent * 11)}</s>
              </div>
              <p className="how__fin2-note">
                Your 11 months rent upfront <strong>with 2 months off</strong>
              </p>
            </div>
            <span className="how__ub-wire" aria-hidden>
              <FlowWire w={271} id="upfWireUB" />
            </span>
            <span className="how__ub-flent" aria-hidden>
              <img src="/trust-flent-tile.svg" alt="" />
            </span>
          </div>

          {/* the dark candle-lit window — arrives with the detail page,
              resting at its home pose (Frame 7) */}
          <div
            className={`how__winrig is-upfront${open ? " is-uB" : ""}`}
            ref={rigRef}
          >
            <PaneWindow rent={rent} />
          </div>
        </div>

        {/* dark solid frame + drop shadows (151:199) */}
        <div className="how__framerig is-upfront" ref={frameRigRef} aria-hidden>
          <div className="how__winframe" />
        </div>
      </div>
    </section>
  );
}
