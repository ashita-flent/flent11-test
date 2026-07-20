import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./lockin-split.css";

gsap.registerPlugin(ScrollTrigger);

const IMG = "/home2.jpg";

const COLS = ["Typical Bangalore rental", "Regular Flent lock-in", "Flent 11"];
const FEAT = COLS.length - 1; // Flent 11 — lives on the photo side
const WC = 1; // Regular Flent — watercolour fill on the sketch side

/* Self-describing statements (Figma 383:288 — no label column; each cell
   carries its whole claim). The closing savings row is ours, computed
   from the rows above at the site's standard ₹45,000 rent:
     baseline year = 11 × 45,000                      = ₹4,95,000
     Regular lock-in saves ₹2,000 × 11               = ₹22,000  (~4%)
     Flent 11 pays 10 months at 43,000 = ₹4,30,000 ⇒ saves ₹65,000 (~13%) */
const ROWS: { cells: ReactNode[] }[] = [
  {
    cells: [
      "6+ months rent as deposit",
      "3 months rent as deposit",
      "3 months rent as deposit",
    ],
  },
  {
    cells: [
      "No lock-in benefit",
      "₹2,000/month off upon 11 month lock-in",
      <>
        ₹2,000/month off + <mark className="ls__mark">first month free</mark>
      </>,
    ],
  },
  { cells: ["Pay from month one", "Month one", "Month two"] },
  {
    cells: [
      "Leave early, lose full deposit",
      "Leave early, lose full deposit",
      "Lock-in breakage fee capped at 21 days of rent",
    ],
  },
  {
    cells: [
      "No savings",
      "₹22,000 saved over the year (~4%)",
      <>
        ₹65,000 saved over the year <mark className="ls__mark">~13%</mark>
      </>,
    ],
  },
];

/**
 * One copy of the comparison table. It renders twice — a dark-text copy
 * over the sketch world and a light-text copy inside the photo clip — kept
 * pixel-identical so the split line slices straight through the type.
 */
function CompareTable({
  mode,
  hot,
  setHot,
}: {
  mode: "sketch" | "photo";
  hot: number;
  setHot: (i: number) => void;
}) {
  return (
    <div className={`ls__table ls__table--${mode}`} aria-hidden={mode === "photo"}>
      <div className="ls__grid">
        <div className="ls__row ls__row--head">
          {COLS.map((c, i) => (
            <span
              key={c}
              className={`ls__cell ls__head${i === FEAT ? " is-feat is-feat-head" : ""}${
                i === WC ? " is-wc" : ""
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        {ROWS.map((row, ri) => (
          <div
            className={`ls__row${ri === ROWS.length - 1 ? " ls__row--save" : ""}${ri === hot ? " is-hot" : ""}`}
            key={ri}
            onMouseEnter={() => setHot(ri)}
            onMouseLeave={() => setHot(-1)}
          >
            {row.cells.map((val, ci) => (
              <span
                key={ci}
                className={`ls__cell${ci === FEAT ? " is-feat" : ""}${
                  ci === WC ? " is-wc" : ""
                }`}
              >
                {val}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The vertical (mobile) copy: the table transposes into three stacked
 * option bands — sketch world on top, watercolour in the middle band,
 * the Flent 11 photograph at the bottom — and the split line sweeps
 * DOWN the stage instead of across it. Rendered twice like the desktop
 * table (dark copy + photo-clipped light copy), pixel-identical.
 */
function CompareBands({ mode }: { mode: "sketch" | "photo" }) {
  return (
    <div
      className={`ls__vbands${mode === "photo" ? " ls__vbands--photo" : ""}`}
      aria-hidden={mode === "photo"}
    >
      {COLS.map((c, i) => (
        <div className={`ls__vband${i === FEAT ? " is-feat" : ""}`} key={c}>
          <h3 className="ls__vband-name">{c}</h3>
          {ROWS.map((row, ri) => (
            <div className="ls__vrow" key={ri}>
              <span className="ls__vrow-value">{row.cells[i]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LockinSplit() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState(-1);
  // one layout per breakpoint — vertical bands + vertical split on phones
  const [vertical, setVertical] = useState(
    () => window.matchMedia("(max-width: 760px)").matches
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const onChange = () => setVertical(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const puck = puckRef.current!;

    const proxy = { v: 0 }; // the reveal edge, % along the split axis
    /* home = 100: the resting stage is the full TRIPTYCH (Figma 383:286 —
       sketch, watercolour and photo each lit in their third); hovering
       pulls the edge back to compare, and release drains home again */
    let rest = 100;

    const axis = vertical ? "--splitv" : "--split";
    const apply = () => stage.style.setProperty(axis, `${proxy.v}%`);

    /* measure the material zone boundaries.
       Horizontal: column left edges. Vertical: band top edges. */
    const measure = () => {
      const s = stage.getBoundingClientRect();
      if (vertical) {
        const bands = stage.querySelectorAll<HTMLElement>(
          ".ls__vbands:not(.ls__vbands--photo) .ls__vband"
        );
        if (bands.length < 3) return;
        const z = (el: HTMLElement) =>
          ((el.getBoundingClientRect().top - s.top) / s.height) * 100;
        stage.style.setProperty("--z1v", `${z(bands[0])}%`);
        stage.style.setProperty("--z2v", `${z(bands[1])}%`);
        stage.style.setProperty(
          "--z3v",
          `${gsap.utils.clamp(20, 85, z(bands[2]))}%`
        );
        return;
      }
      const firstHead = stage.querySelector<HTMLElement>(
        ".ls__table--sketch .ls__row--head .ls__head"
      );
      const wcCell = stage.querySelector<HTMLElement>(".ls__table--sketch .is-wc");
      const featCell = stage.querySelector<HTMLElement>(
        ".ls__table--sketch .is-feat-head"
      );
      if (!firstHead || !wcCell || !featCell) return;
      const z1 =
        ((firstHead.getBoundingClientRect().left - s.left) / s.width) * 100;
      stage.style.setProperty("--z1", `${z1}%`);
      const z2 = ((wcCell.getBoundingClientRect().left - s.left) / s.width) * 100;
      const z3 = gsap.utils.clamp(
        20,
        85,
        ((featCell.getBoundingClientRect().left - s.left) / s.width) * 100
      );
      stage.style.setProperty("--z2", `${z2}%`);
      stage.style.setProperty("--z3", `${z3}%`);
    };

    /* the zones must stay locked to the table's thirds — re-measure as
       late layout settles (webfonts swap, the material images decode, and
       one settle tick), not just on resize. A drifted measurement leaves
       the material seams misaligned with the columns. */
    document.fonts?.ready.then(() => measure()).catch(() => {});
    stage.querySelectorAll<HTMLImageElement>("img").forEach((im) => {
      if (!im.complete)
        im.addEventListener("load", () => measure(), { once: true });
    });
    const settleT = window.setTimeout(measure, 400);

    const ctx = gsap.context(() => {
      measure();
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      /* everything starts dark and the entrance lights the triptych —
         the cursor sweep on desktop, the pinned scroll sweep on phones.
         Reduced motion rests fully lit from the start instead. */
      proxy.v = reduce ? rest : 0;
      apply();

      gsap.from(".ls__head-block > *", {
        opacity: 0,
        y: 22,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
      });

      // the snap BREAK — a MAGNET around the parked pose (the section's
      // bottom edge flush on the viewport's bottom; the section is a
      // 100vh frame, so parked = the whole composition). The zone runs
      // PAST the flush point, so a rest anywhere in the band — arriving,
      // hovering to play with the table, or drifting a little beyond —
      // pulls back to flush from either direction. Only a barely-entered
      // peek or a committed push well past the fold scrolls free.
      // Desktop only — the vertical column free-scrolls.
      if (!vertical) {
        const root = rootRef.current!;
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom 55%", // the band extends 45vh past the flush pose
          snap: {
            snapTo: (v: number, self?: ScrollTrigger) => {
              if (!self) return v;
              const total = (self.end as number) - (self.start as number);
              const vh = window.innerHeight;
              const flush = root.offsetHeight / total; // bottom on the fold
              const enter = (0.33 * vh) / total; // <33vh visible: still free
              const release = flush + (0.3 * vh) / total; // >30vh past: moving on
              return v < enter || v > release ? v : flush;
            },
            inertia: false,
            duration: { min: 0.3, max: 0.65 },
            delay: 0.1,
            ease: "power2.inOut",
          },
        });
      }

      // entrance — one sweep lights the triptych and STAYS (home is the
      // fully-revealed stage). Killed the moment the user takes over.
      // Desktop only: in vertical mode the scroll itself is the reveal,
      // and a self-moving line under a moving page read as two scrolls.
      let lineIntro: gsap.core.Timeline | null = null;
      if (!vertical && !reduce)
        lineIntro = gsap
          .timeline({
            scrollTrigger: { trigger: stage, start: "top 62%" },
            onComplete: () => (lineIntro = null),
          })
          .to(proxy, {
            v: 100,
            duration: 1.6,
            ease: "power2.inOut",
            onUpdate: apply,
          });

      const vTo = gsap.quickTo(proxy, "v", {
        duration: 0.55,
        ease: "power3",
        overwrite: "auto",
        onUpdate: apply,
      });

      const takeOver = () => {
        if (lineIntro) {
          lineIntro.kill();
          lineIntro = null;
        }
      };

      if (vertical) {
        /* ── vertical wiring: the STICKY compare. The stage pins once
           it's centred in the viewport, and roughly one screen of
           scroll sweeps the reveal edge down the bands — the table
           holds still while its materials arrive, so the page scroll
           and the split never read as two competing scrolls.

           Deliberate control lives on the handle riding the rail
           OUTSIDE the frame's right edge — the grip disc: dragging it
           scrubs the line. ONLY that disc owns the touch, so a thumb
           anywhere else (card, rail, page) scrolls as normal. Last
           input wins: the next scroll simply re-takes the line
           (smoothed by the quickTo). ── */
        let gripping = false;
        let hintDone = false;
        const dropHint = () => {
          if (hintDone) return;
          hintDone = true;
          stage.classList.add("is-hovering");
        };

        // the handle waves as the table lands — "this slides"
        let bob: gsap.core.Tween | null = null;
        const stopBob = () => {
          if (!bob) return;
          bob.kill();
          bob = null;
          gsap.to(puck, { y: 0, duration: 0.3, overwrite: "auto" });
        };

        if (!reduce) {
          ScrollTrigger.create({
            trigger: stage,
            // park the card centred (or 12px from the top when it's
            // taller than the screen) and hold it for the sweep
            start: () =>
              `top ${Math.max(
                12,
                (window.innerHeight - stage.offsetHeight) / 2
              )}px`,
            end: () => "+=" + Math.round(window.innerHeight * 0.6),
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: () => {
              if (!bob)
                bob = gsap.to(puck, {
                  y: 9,
                  duration: 0.55,
                  ease: "sine.inOut",
                  repeat: 11,
                  yoyo: true,
                  onComplete: () => (bob = null),
                });
            },
            onUpdate: (self) => {
              if (gripping) return; // the finger owns the line right now
              vTo(self.progress * 100); // the quickTo trail keeps it liquid
              // the hint has done its job once the sweep is nearly home
              if (self.progress > 0.9) dropHint();
            },
          });
        }

        const grip = gripRef.current!;
        const pctFromY = (clientY: number) => {
          const r = stage.getBoundingClientRect();
          return gsap.utils.clamp(0, 100, ((clientY - r.top) / r.height) * 100);
        };
        const onGripDown = (e: PointerEvent) => {
          e.preventDefault();
          gripping = true;
          stopBob();
          dropHint();
          try {
            grip.setPointerCapture(e.pointerId);
          } catch {
            /* capture is an optimisation — the drag works without it */
          }
          vTo(pctFromY(e.clientY));
        };
        const onGripMove = (e: PointerEvent) => {
          if (gripping) vTo(pctFromY(e.clientY));
        };
        const onGripUp = () => {
          gripping = false;
        };
        grip.addEventListener("pointerdown", onGripDown);
        grip.addEventListener("pointermove", onGripMove);
        grip.addEventListener("pointerup", onGripUp);
        grip.addEventListener("pointercancel", onGripUp);

        const onResize = () => measure();
        window.addEventListener("resize", onResize);
        return () => {
          bob?.kill();
          grip.removeEventListener("pointerdown", onGripDown);
          grip.removeEventListener("pointermove", onGripMove);
          grip.removeEventListener("pointerup", onGripUp);
          grip.removeEventListener("pointercancel", onGripUp);
          window.removeEventListener("resize", onResize);
        };
      }

      /* ── horizontal wiring (desktop) — cursor owns the line ── */
      const pxTo = gsap.quickTo(puck, "x", { duration: 0.3, ease: "power3" });
      const pyTo = gsap.quickTo(puck, "y", { duration: 0.3, ease: "power3" });

      const onMove = (e: MouseEvent) => {
        takeOver();
        const r = stage.getBoundingClientRect();
        const pct = gsap.utils.clamp(0, 100, ((e.clientX - r.left) / r.width) * 100);
        vTo(pct);
        pxTo((pct / 100) * r.width); // puck rides the reveal line
        pyTo(e.clientY - r.top);
      };
      const onEnter = () => stage.classList.add("is-hovering");
      const onLeave = () => {
        stage.classList.remove("is-hovering");
        vTo(rest); // drain back to white
      };
      const onResize = () => {
        measure();
        vTo(rest);
      };

      stage.addEventListener("mousemove", onMove);
      stage.addEventListener("mouseenter", onEnter);
      stage.addEventListener("mouseleave", onLeave);
      window.addEventListener("resize", onResize);
      return () => {
        stage.removeEventListener("mousemove", onMove);
        stage.removeEventListener("mouseenter", onEnter);
        stage.removeEventListener("mouseleave", onLeave);
        window.removeEventListener("resize", onResize);
      };
    }, rootRef);

    return () => {
      window.clearTimeout(settleT);
      ctx.revert();
    };
  }, [vertical]);

  return (
    <section className="ls" ref={rootRef}>
      <div className="ls__head-block">
        <h2 className="ls__title">
          Yes, it&rsquo;s a lock-in. Here&rsquo;s what changed.
        </h2>
        <p className="ls__sub">
          Flent&nbsp;11 does not remove the 11-month commitment.
          <br />
          <strong>It changes what that commitment gets you.</strong>
        </p>
      </div>

      <div
        className={`ls__stage${vertical ? " ls__stage--v" : ""}`}
        ref={stageRef}
      >
        {/* the material frame — everything that belongs INSIDE the card.
            On phones it takes the rounded clip so the handle can live
            outside it; on desktop it's a pass-through. */}
        <div className="ls__mat">
          {/* sketch world — the life you'd have without Flent 11 */}
          <div className="ls__sketch" aria-hidden>
            <img className="ls__sketch-base" src={IMG} alt="" />
            <img className="ls__sketch-lines" src={IMG} alt="" />
            <div className="ls__paper" />
          </div>

          {/* watercolour slice — alive only inside the Regular Flent zone */}
          <div className="ls__wc" aria-hidden>
            <img className="ls__wc-color" src={IMG} alt="" />
          </div>

          {/* dark-text copy over the sketch + watercolour */}
          {vertical ? (
            <CompareBands mode="sketch" />
          ) : (
            <CompareTable mode="sketch" hot={hot} setHot={setHot} />
          )}

          {/* photo world — Flent 11, clipped at the split line */}
          <div className="ls__photo-clip" aria-hidden={false}>
            <img className="ls__photo" src={IMG} alt="A furnished Flent home" />
            <div className="ls__photo-tint" />
            {vertical ? (
              <CompareBands mode="photo" />
            ) : (
              <CompareTable mode="photo" hot={hot} setHot={setHot} />
            )}
          </div>
        </div>

        {/* split line + puck (rides the cursor on desktop; on phones it
            marks the scroll-driven line) */}
        <div className="ls__line" aria-hidden />
        <div className="ls__puck" ref={puckRef} aria-hidden>
          {vertical ? (
            <>
              <span>&#9652;</span>
              <span>&#9662;</span>
            </>
          ) : (
            <>
              <span>&#9666;</span>
              <span>&#9656;</span>
            </>
          )}
        </div>
        {/* the grip — the phone's handle: an invisible disc riding with
            the puck; the only surface that owns the touch */}
        {vertical && <div className="ls__grip" ref={gripRef} aria-hidden />}

        <p className="ls__hint">
          {vertical ? "scroll — or slide the handle" : "hover to compare"}
        </p>
      </div>
    </section>
  );
}
