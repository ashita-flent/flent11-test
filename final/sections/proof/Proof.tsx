import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./proof.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Proof — "Flent 11 is new. Living with Flent is not." The track record
   behind the offer: four editorial stat blocks (dark top rules, Ramp-
   style count-ups) and a wall of tenant tweets. Tweet assets are pending,
   so the wall holds art-directed placeholder frames at the real aspect
   ratios.
   ──────────────────────────────────────────────────────────────────────── */

type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 500, suffix: "+", label: "Tenants served" },
  { value: 4.8, decimals: 1, suffix: "+", label: "Average rating across stays" },
  { value: 15, suffix: " months", label: "Average stay duration" },
  { value: 25, prefix: "₹", suffix: " Cr+", label: "Raised since inception" },
];

/* the tweet wall — three staggered columns, heights from the design */
const TWEET_COLS: number[][] = [
  [238, 282],
  [268, 262],
  [230, 168],
];

export default function Proof() {
  const rootRef = useRef<HTMLElement>(null);

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
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        });
        gsap.from(".pr__stat", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: ".pr__stats", start: "top 85%" },
        });
        gsap.from(".pr__tweet", {
          opacity: 0,
          y: 30,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: ".pr__wall", start: "top 82%" },
        });
      }

      /* count-ups — each number rolls from 0 as its rule scrolls in */
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
          scrollTrigger: { trigger: ".pr__stats", start: "top 85%" },
          onUpdate: () => {
            el.textContent = fmt(proxy.v);
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="pr" ref={rootRef}>
      <div className="pr__inner">
        <div className="pr__head">
          <p className="pr__eyebrow">Already home</p>
          <h2 className="pr__title">
            Flent&nbsp;11 is new.
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
                {s.prefix}
                <span
                  className="pr__num"
                  data-value={s.value}
                  data-decimals={s.decimals ?? 0}
                >
                  {s.decimals ? s.value.toFixed(s.decimals) : s.value}
                </span>
                {s.suffix}
              </p>
              <p className="pr__stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* tenant voices — real tweets drop into these frames */}
        <div className="pr__wall">
          {TWEET_COLS.map((col, ci) => (
            <div className="pr__col" key={ci}>
              {col.map((h, i) => (
                <div className="pr__tweet" style={{ height: h }} key={i}>
                  <span>Tweet screenshot</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
