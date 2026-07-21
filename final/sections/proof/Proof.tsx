import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./proof.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Proof — "Flent 11 is new. Living with Flent is not." The track record
   behind the offer: centred copy + four editorial stat blocks (dark top
   rules, Ramp-style count-ups) hold a sticky screen while the tenant
   tweets — a loose, rotated scatter — drift up OVER them at their own
   speeds through the scroll runway (the daylight-computer move). Tweet
   assets are pending, so the cards are placeholder frames.
   ──────────────────────────────────────────────────────────────────────── */

/* figures per Figma 398:796 — pre/tail run at full 56u inside the
   gradient; unit words ("stars", "months") step down to 36u */
type Stat = {
  value: number;
  decimals?: number;
  pre?: string;
  tail?: string;
  unit?: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 500, tail: "+", label: "Tenants served" },
  {
    value: 4.8,
    decimals: 1,
    tail: "+",
    unit: "stars",
    label: "Average rating across stays",
  },
  { value: 15, unit: "months", label: "Average stay duration" },
  { value: 25, pre: "₹", tail: " Cr+", label: "Raised since inception" },
];

/* the tweet drift — the scatter is Figma 398:684 verbatim: four cards
   placed loose around the copy, each overlapping the text a little
   (Deepankar over the title's left, Anurag over the sub's right end,
   Supratik across the first stats, Garv on ₹25 Cr+), with the other
   three continuing the same pattern a wave below. edge = the card's
   LEFT edge as a signed px offset from the centre line (design frame
   coords − 756), so the arrangement holds at any viewport. Travels
   (t, viewport-heights swept across the runway) stay near-uniform so
   the scatter drifts as one loose field — anchors are spaced far
   enough that no two cards ever meet — and the short Prakash tweet
   runs fastest through the centre as the finale, still mid-frame at
   the pin's release so it carries the section away. The first screen
   holds NO tweets: every card opens a full viewport below its anchor
   and enters only as the user scrolls. */
/* travels are tuned so the FINAL frame (the pose the section scrolls
   away in) is itself a composition: five cards resting at five
   different heights, every one fully inside the frame — nothing
   straddles the bottom edge, so only the gradient cuts at the
   boundary, never a card. */
/* ml/mw are the phone pose (Figma 422:1261 "iPhone 17 - 12", 402-wide
   artboard, as vw%): the zig-zag hugs the edges — Tweet 2 left (23,
   w248), Tweet 10 right (145, w234), Tweet 9 left (12, w289) — and the
   second wave + finale continue the same alternation. The y anchors and
   travels are shared across breakpoints (both are viewport-relative, so
   the tuned composition holds). */
type Card = {
  src: string;
  edge: number;
  y: number;
  w: number;
  t: number;
  ml: number;
  mw: number;
  my: number;
};
/* my: the phone's own anchor. Phone cards are 58–72vw wide — the
   desktop's paired anchors (7/22, 66/71…) overlap badly at that size.
   The phone runs them SINGLE FILE instead: one card per 36vh of the
   conveyor (pitch > the tallest card at any phone height) in the same
   left/right zig-zag, all sharing ONE travel — spacing between cards
   never changes, so they enter one by one and can never meet. */
const MOBILE_TRAVEL = 2.6;
const TWEETS: Card[] = [
  // the design frame's four (Figma 398:805 / 800 / 801 / 799)
  { src: "/tweet-2.jpg", edge: -694, y: 7, w: 413, t: 1.5, ml: 5.7, mw: 61.7, my: 6 },
  { src: "/tweet-10.jpg", edge: 318, y: 22, w: 385, t: 1.6, ml: 36.1, mw: 58.2, my: 42 },
  { src: "/tweet-9.jpg", edge: -562, y: 66, w: 478, t: 1.5, ml: 3, mw: 71.9, my: 78 },
  { src: "/tweet-11.jpg", edge: 242, y: 71, w: 385, t: 1.62, ml: 38.8, mw: 58.2, my: 114 },
  // the second wave, same grammar, settling at staggered depths
  { src: "/tweet-3.jpg", edge: -650, y: 118, w: 400, t: 1.74, ml: 4.5, mw: 61.7, my: 150 },
  { src: "/tweet-7.jpg", edge: 300, y: 132, w: 390, t: 1.775, ml: 35.6, mw: 60, my: 186 },
  // the finale — through the centre, resting mid-frame at release
  { src: "/tweet-5.jpg", edge: -60, y: 175, w: 430, t: 2.45, ml: 17, mw: 66, my: 222 },
];

export default function Proof() {
  const rootRef = useRef<HTMLElement>(null);
  // one geometry per breakpoint: the phone anchors cards by vw (the
  // 402-frame pose), desktop by px offsets from the centre line
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 860px)").matches
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from(".pr__head > *", {
          opacity: 0,
          y: 22,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: rootRef.current, start: "top 60%" },
        });
        gsap.from(".pr__stat", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: rootRef.current, start: "top 45%" },
        });
      }

      /* count-ups — the numbers roll as the sticky screen settles */
      const nums = gsap.utils.toArray<HTMLElement>(".pr__num", rootRef.current);
      nums.forEach((el) => {
        const value = Number(el.dataset.value);
        const decimals = Number(el.dataset.decimals ?? 0);
        const fmt = (v: number) =>
          decimals
            ? v.toFixed(decimals)
            : Math.round(v).toLocaleString("en-IN");
        if (reduce) {
          el.textContent = fmt(value);
          return;
        }
        const proxy = { v: 0 };
        el.textContent = fmt(0);
        gsap.to(proxy, {
          v: value,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 45%" },
          onUpdate: () => {
            el.textContent = fmt(proxy.v);
          },
        });
      });

      /* the drift — every width (the phone keeps the desktop grammar
         per 422:1261; only the geometry differs — x/width by the render,
         travels by breakpoint). Each card sweeps from below the fold to
         above it, distance scaled by its speed, scrubbed across the
         section's runway. */
      const drift = (travel: (c: Card) => number) => () => {
        const vh = window.innerHeight;
        const cards = gsap.utils.toArray<HTMLElement>(
          ".pr__tweet",
          rootRef.current
        );
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
        cards.forEach((card, i) => {
          // every card opens one full viewport below its anchor (the
          // settled screen shows the copy + stats clean), then the
          // rail rises as one — spacing within a rail never changes
          tl.fromTo(
            card,
            { y: vh },
            { y: vh * (1 - travel(TWEETS[i])), ease: "none" },
            0
          );
        });
      };
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 861px) and (prefers-reduced-motion: no-preference)",
        drift((c) => c.t)
      );
      mm.add(
        "(max-width: 860px) and (prefers-reduced-motion: no-preference)",
        // one shared travel: the single-file conveyor moves as a strip,
        // so the 36vh pitch between cards holds the whole way through
        drift(() => MOBILE_TRAVEL)
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="pr" ref={rootRef}>
      {/* the sticky screen — centred copy + stats hold while the tweet
          scatter drifts over them */}
      <div className="pr__pin">
        <div className="pr__inner">
          <div className="pr__head">
            {/* the flent pill (Figma 398:813) */}
            <img className="pr__brand" src="/proof-flent-pill.svg" alt="flent" />
            <h2 className="pr__title">
              <span className="pr__title-soft">Flent&nbsp;11 is new.</span>
              <br />
              Living with Flent is not.
            </h2>
            <p className="pr__sub">
              Before we built a better lock-in, we spent years building better
              homes. Hundreds of working professionals across Bangalore already
              trust Flent with where they live.
            </p>
          </div>

          <div className="pr__stats">
            {STATS.map((s) => (
              <div className="pr__stat" key={s.label}>
                <p className="pr__stat-value">
                  {s.pre}
                  <span
                    className="pr__num"
                    data-value={s.value}
                    data-decimals={s.decimals ?? 0}
                  >
                    {s.decimals ? s.value.toFixed(s.decimals) : s.value}
                  </span>
                  {s.tail}
                  {s.unit && (
                    <>
                      {" "}
                      <span className="pr__stat-unit">{s.unit}</span>
                    </>
                  )}
                </p>
                <p className="pr__stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* tenant voices — the real tweets */}
        <div className="pr__float" aria-hidden>
          {TWEETS.map((c) => (
            <div
              className="pr__tweet"
              key={c.src}
              style={
                narrow
                  ? { left: `${c.ml}vw`, top: `${c.my}%`, width: `${c.mw}vw` }
                  : {
                      left: `calc(50% + ${c.edge}px)`,
                      top: `${c.y}%`,
                      width: c.w,
                    }
              }
            >
              {/* eager, not lazy: the cards are swept through the viewport
                  by the scroll-driven drift, so a lazy load (which only
                  fires as the card nears view) can't finish before the
                  card passes — on mobile they render as blank frames.
                  Preloading the 7 small JPGs up front avoids that. */}
              <img src={c.src} alt="" decoding="async" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
