import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./lockin-cards.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Lock-in — CARD version (Figma 443:407, replaces the cursor-split
   table). One full-viewport composition: the loft photo runs full
   bleed with a PROGRESSIVE white veil at the top (blur radius 100 → 4
   easing down its 358u band) carrying the heading; three cards compare
   the worlds —

   1 · Typical Bangalore Rental: a gradient glass card (transparent →
       white downward, backdrop blur 44 gated by that fill per Figma's
       alpha semantics ⇒ the room clears at the top of the card and
       frosts toward its foot), neutral hairline icons.
   2 · Regular Flent Lock-in: even glass (white 0.8 + blur 24), green
       check rows.
   3 · Flent 11: solid white, the photo art bleeding in at the top
       right, Medium rows, the green "First month free" pill.

   Phone: the same three cards stack as full-width scrollable blocks
   under the heading, on the same veiled photo.
   ──────────────────────────────────────────────────────────────────────── */

type Row = { icon: string; text: React.ReactNode; pill?: string };
type Col = {
  key: string;
  title: React.ReactNode;
  rows: Row[];
};

const IC = {
  rupee: "/lc-ic-rupee.svg",
  cash: "/lc-ic-cash.svg",
  lockopen: "/lc-ic-lockopen.svg",
  upload: "/lc-ic-upload.svg",
  trenddown: "/lc-ic-trenddown.svg",
  check: "/lc-ic-check.svg",
};

const COLS: Col[] = [
  {
    key: "typical",
    title: "Typical Bangalore Rental",
    rows: [
      { icon: IC.rupee, text: "1 month rent as brokerage" },
      { icon: IC.cash, text: "6+ months rent as deposit" },
      { icon: IC.lockopen, text: "No lock-in benefit" },
      { icon: IC.upload, text: "Pay from month one" },
      { icon: IC.trenddown, text: "Leave early, lose full deposit" },
    ],
  },
  {
    key: "regular",
    title: "Regular Flent Lock-in",
    rows: [
      { icon: IC.check, text: "No brokerage" },
      { icon: IC.check, text: "3 months rent as deposit" },
      { icon: IC.check, text: "₹2,000/month off upon 11 month lock-in" },
      { icon: IC.upload, text: "Pay from month one" },
      { icon: IC.check, text: "Leave early, lose full deposit" },
    ],
  },
  {
    key: "f11",
    title: "Flent 11",
    rows: [
      { icon: IC.check, text: "No brokerage" },
      { icon: IC.check, text: "3 months rent as deposit" },
      { icon: IC.check, text: "₹2,000/month off +", pill: "First month free" },
      { icon: IC.check, text: "Pay from month two" },
      {
        icon: IC.check,
        text: (
          <>
            Lock-in breakage fee capped at{" "}
            <strong>21 days of rent</strong>
          </>
        ),
      },
    ],
  },
];

export default function LockinCards() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = rootRef.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from(".lc__head > *", {
          opacity: 0,
          y: 22,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: "top 60%" },
        });
        gsap.from(".lc__card", {
          opacity: 0,
          y: 30,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: "top 45%" },
        });
      }

      // full-viewport parking (desktop): when the scroll rests nearby,
      // settle the composition flush — same grammar as the upfront break
      if (!window.matchMedia("(max-width: 760px)").matches) {
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          snap: {
            snapTo: (v: number, self?: ScrollTrigger) => {
              if (!self) return v;
              const total = (self.end as number) - (self.start as number);
              const flushY =
                section.getBoundingClientRect().top + window.scrollY;
              const flush = (flushY - (self.start as number)) / total;
              const band = (0.4 * window.innerHeight) / total;
              return Math.abs(v - flush) < band ? flush : v;
            },
            inertia: false,
            duration: { min: 0.2, max: 0.5 },
            delay: 0.08,
            ease: "power2.out",
          },
        });
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="lc" ref={rootRef}>
      {/* the loft, full bleed and SHARP. A progressive blur rides the top
          band (strong behind the heading, ramping to sharp by the card
          line — Figma's gradient blur), then a white wash lifts the
          heading for legibility. */}
      <img className="lc__bg" src="/lockin-bg.jpg" alt="" aria-hidden />
      <div className="lc__blur" aria-hidden>
        <span className="lc__blur-layer lc__blur-layer--1" />
        <span className="lc__blur-layer lc__blur-layer--2" />
        <span className="lc__blur-layer lc__blur-layer--3" />
      </div>
      <span className="lc__veil" aria-hidden />

      <div className="lc__frame">
        <div className="lc__head">
          <h2 className="lc__title">
            Yes, it&rsquo;s a lock-in. Here&rsquo;s what changed.
          </h2>
          <p className="lc__sub">
            Flent&nbsp;11 does not remove the 11-month commitment.
            <br />
            <strong>It changes what that commitment gets you.</strong>
          </p>
        </div>

        <div className="lc__cards">
          {COLS.map((col) => (
            <div key={col.key} className={`lc__card lc__card--${col.key}`}>
              {col.key === "f11" && (
                <img
                  className="lc__card-art"
                  src="/lockin-f11-art.png"
                  alt=""
                  aria-hidden
                />
              )}
              <h3 className="lc__card-title">{col.title}</h3>
              <ul className="lc__rows">
                {col.rows.map((row, i) => (
                  <li key={i} className="lc__row">
                    <img className="lc__row-ic" src={row.icon} alt="" />
                    <span className="lc__row-text">{row.text}</span>
                    {row.pill && <span className="lc__pill">{row.pill}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
