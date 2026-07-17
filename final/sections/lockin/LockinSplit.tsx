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

const ROWS: { label: string; cells: ReactNode[] }[] = [
  { label: "Security deposit", cells: ["Usually 6+ months", "3 months", "3 months"] },
  {
    label: "Lock-in benefit",
    cells: [
      "Usually none",
      "₹2,000/month lower rent",
      <>
        ₹2,000/month lower rent +{" "}
        <mark className="ls__mark">first month free</mark>
      </>,
    ],
  },
  { label: "First rent payment", cells: ["Month one", "Month one", "Month two"] },
  {
    label: "Early exit",
    cells: [
      "Deposit forfeited",
      "Deposit forfeited",
      "Lock-in breakage fee capped at 21 days of rent",
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
          <span className="ls__cell ls__corner" />
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
            className={`ls__row${ri === hot ? " is-hot" : ""}`}
            key={row.label}
            onMouseEnter={() => setHot(ri)}
            onMouseLeave={() => setHot(-1)}
          >
            <span className="ls__cell ls__rowlabel">{row.label}</span>
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
          {ROWS.map((row) => (
            <div className="ls__vrow" key={row.label}>
              <span className="ls__vrow-label">{row.label}</span>
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
    let rest = 0; // home: everything clean white

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
        const z1 = z(bands[0]);
        stage.style.setProperty("--z1v", `${z1}%`);
        stage.style.setProperty("--z2v", `${z(bands[1])}%`);
        stage.style.setProperty(
          "--z3v",
          `${gsap.utils.clamp(20, 85, z(bands[2]))}%`
        );
        rest = z1;
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
      rest = z1;
    };

    const ctx = gsap.context(() => {
      measure();
      proxy.v = rest;
      apply();

      gsap.from(".ls__head-block > *", {
        opacity: 0,
        y: 22,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
      });

      // entrance tease — one full sweep (revealing all three materials)
      // and back home to white. Killed the moment the user takes over.
      let lineIntro: gsap.core.Timeline | null = gsap
        .timeline({
          scrollTrigger: { trigger: stage, start: "top 62%" },
          onComplete: () => (lineIntro = null),
        })
        .to(proxy, {
          v: 100,
          duration: 1.6,
          ease: "power2.inOut",
          onUpdate: apply,
        })
        .to(proxy, {
          v: () => rest,
          duration: 1.3,
          ease: "power3.inOut",
          onUpdate: apply,
          delay: 0.25,
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
        /* ── vertical wiring: the line rides Y. Touch drags the puck (the
           stage itself keeps native scroll); a tap parks the line where
           you tapped; fine pointers can just hover. ── */
        const pctFromY = (clientY: number) => {
          const r = stage.getBoundingClientRect();
          return gsap.utils.clamp(0, 100, ((clientY - r.top) / r.height) * 100);
        };

        let dragging = false;
        const onPuckDown = (e: PointerEvent) => {
          e.preventDefault();
          takeOver();
          dragging = true;
          stage.classList.add("is-hovering");
          try {
            puck.setPointerCapture(e.pointerId);
          } catch {
            /* capture is an optimisation — dragging works without it */
          }
        };
        const onPuckMove = (e: PointerEvent) => {
          if (dragging) vTo(pctFromY(e.clientY));
        };
        const onPuckUp = () => {
          dragging = false;
          stage.classList.remove("is-hovering");
        };
        puck.addEventListener("pointerdown", onPuckDown);
        puck.addEventListener("pointermove", onPuckMove);
        puck.addEventListener("pointerup", onPuckUp);
        puck.addEventListener("pointercancel", onPuckUp);

        // a tap anywhere on the stage sends the line there
        const onTap = (e: PointerEvent) => {
          if (e.target === puck || puck.contains(e.target as Node)) return;
          takeOver();
          vTo(pctFromY(e.clientY));
        };
        stage.addEventListener("pointerup", onTap);

        // fine pointers (small desktop windows) still get the hover sweep
        const hoverFine = window.matchMedia("(hover: hover)").matches;
        const onMove = (e: MouseEvent) => {
          takeOver();
          vTo(pctFromY(e.clientY));
        };
        const onLeave = () => vTo(rest);
        if (hoverFine) {
          stage.addEventListener("mousemove", onMove);
          stage.addEventListener("mouseleave", onLeave);
        }

        const onResize = () => {
          measure();
          vTo(rest);
        };
        window.addEventListener("resize", onResize);
        return () => {
          puck.removeEventListener("pointerdown", onPuckDown);
          puck.removeEventListener("pointermove", onPuckMove);
          puck.removeEventListener("pointerup", onPuckUp);
          puck.removeEventListener("pointercancel", onPuckUp);
          stage.removeEventListener("pointerup", onTap);
          if (hoverFine) {
            stage.removeEventListener("mousemove", onMove);
            stage.removeEventListener("mouseleave", onLeave);
          }
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

    return () => ctx.revert();
  }, [vertical]);

  return (
    <section className="ls" ref={rootRef}>
      <div className="ls__head-block">
        <p className="ls__eyebrow">What changes</p>
        <h2 className="ls__title">
          Yes, it&rsquo;s a lock-in.
          <br />
          Here&rsquo;s what changed.
        </h2>
        <p className="ls__sub">
          Flent&nbsp;11 does not remove the 11-month commitment. It changes
          what that commitment gets you.
        </p>
      </div>

      <div
        className={`ls__stage${vertical ? " ls__stage--v" : ""}`}
        ref={stageRef}
      >
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

        {/* split line + puck (cursor-ridden on desktop, draggable on touch) */}
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

        <p className="ls__hint">{vertical ? "drag to compare" : "hover to compare"}</p>
      </div>
    </section>
  );
}
