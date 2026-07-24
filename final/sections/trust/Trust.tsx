import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./trust.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Trust — "Read everything, before you sign anything." (2026-07-17
   pass: all four cards light glass with ink copy; the card rows span
   the site's 1320u column, centred). Four cards on the warm runway:

     row 1 · the financing handoff — Gromor » Flent tiles
           · the no-cost EMI loop  — EMI chip » wire » Gromor, the
             interest absorbed at the flent mark, next payments queued
             as receding ghosts
     row 2 · no blind commitment   — notice timeline + the settlement
             slip breathing past the card's top-right edge
           · the CIBIL dial        — copy leads, 720 draws beneath

   Each visual animates on scroll-in (and replays on re-entry); reduced
   motion gets the settled states.
   ──────────────────────────────────────────────────────────────────────── */

/* the sample slip rows (268:3454 — month-7 upfront exit, verbatim) */
const SLIP_ROWS: {
  k: string;
  v: ReactNode;
  dim?: boolean;
  info?: boolean;
}[] = [
  { k: "Monthly rent", v: <strong>₹45,000</strong> },
  { k: "Paid for", v: "11 months", dim: true },
  { k: "Remaining months", v: "4 months", dim: true },
  {
    k: "Remaining rent",
    v: (
      <>
        <em className="tc__slip-free">₹0 on you</em> <s>₹1,80,000</s>
      </>
    ),
    dim: true,
  },
  { k: "Deposit you paid", v: "₹1,35,000", dim: true },
  {
    k: "Exit fee",
    v: (
      <span className="tc__slip-fee">
        -₹18,000 <i>(21 days rent)</i>
      </span>
    ),
    dim: true,
    info: true,
  },
  {
    k: "Damages",
    v: <span className="tc__slip-fee">-₹1,000</span>,
    dim: true,
    info: true,
  },
];

/* CIBIL dial — the exported Figma layers (grey track + conic-gradient
   arc). The arc spans ~286° with its gap centred at the bottom; the
   draw-on is a conic mask swept from the bottom-left tip. */
const DIAL_FROM = 217; // conic start angle, deg (the arc's lower-left tip)
const DIAL_EXTENT = 286;

/* tiny etched ⓘ beside the deducted rows (268:3477) */
function InfoDot() {
  return (
    <svg className="tc__slip-info" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="4.2" fill="none" strokeWidth="0.9" />
      <line x1="5" y1="4.4" x2="5" y2="7.2" strokeWidth="0.9" />
      <circle cx="5" cy="2.9" r="0.55" stroke="none" />
    </svg>
  );
}

export default function Trust() {
  const rootRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from(".tr__head", {
          opacity: 0,
          y: 22,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        });
        gsap.from(".tc", {
          opacity: 0,
          y: 26,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: ".tr__rows", start: "top 80%" },
        });

        /* card 1 · handoff — the tiles land, then the chevrons carry
           (their travelling pulse is a CSS loop) */
        gsap.from(".tc__tile", {
          scale: 0.8,
          autoAlpha: 0,
          duration: 0.5,
          ease: "back.out(1.5)",
          stagger: 0.14,
          scrollTrigger: { trigger: ".tc--hand", start: "top 72%" },
        });

        /* card 2 · the EMI's journey, one leg at a time; the queued
           payments settle in last as soft-focus ghosts */
        gsap
          .timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: ".tc--emi",
              start: "top 72%",
              toggleActions: "restart none none none",
            },
          })
          .from(".tc__emi-chip", { autoAlpha: 0, y: 14, duration: 0.45 })
          .fromTo(
            ".tc__wire img",
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" },
            "-=0.1"
          )
          .from(
            ".tc__emi-pill",
            { autoAlpha: 0, scale: 0.8, duration: 0.4, ease: "back.out(1.5)" },
            "-=0.3"
          )
          .from(
            ".tc__emi-gromor",
            { autoAlpha: 0, scale: 0.85, duration: 0.4, ease: "back.out(1.4)" },
            "-=0.2"
          )
          .from(
            ".tc__emi-ghost",
            { autoAlpha: 0, y: -8, duration: 0.5, stagger: 0.12 },
            "-=0.1"
          );

        /* card 3 · the dial's arc layer sweeps on (conic mask over the
           exported gradient) while the score rises to 720 */
        const arcImg = rootRef.current!.querySelector<HTMLElement>(".tc__dial-arcimg");
        const sweep = { a: 0 };
        const paintMask = () => {
          if (!arcImg) return;
          const m = `conic-gradient(from ${DIAL_FROM}deg, #000 ${sweep.a}deg, transparent ${sweep.a + 0.5}deg)`;
          arcImg.style.maskImage = m;
          arcImg.style.webkitMaskImage = m;
        };
        const score = { v: 690 };
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".tc--cibil",
              start: "top 72%",
              toggleActions: "restart none none none",
            },
          })
          .fromTo(
            sweep,
            { a: 0 },
            {
              a: DIAL_EXTENT,
              duration: 1.1,
              ease: "power2.inOut",
              onStart: paintMask,
              onUpdate: paintMask,
            }
          )
          .fromTo(
            ".tc__dial-score",
            { y: 10 },
            { y: 0, duration: 1.0, ease: "power2.out" },
            0.15
          )
          .to(
            score,
            {
              v: 720,
              duration: 1.0,
              ease: "power2.out",
              onUpdate: () => {
                if (scoreRef.current)
                  scoreRef.current.textContent = String(Math.round(score.v));
              },
            },
            0.15
          )
          .from(".tc__dial-plus", { autoAlpha: 0, x: -8, duration: 0.4 }, 0.9);

        /* card 4 · the slip slides out of the card's pocket; the notice
           timeline draws beneath it. Replays on re-entry from EITHER
           direction — a missed trigger must never leave the slip flat
           (its resting pose is also baked in CSS as the fallback). */
        gsap
          .timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: ".tc--slip",
              start: "top 72%",
              toggleActions: "restart none restart none",
            },
          })
          .fromTo(
            ".tc__slip",
            { autoAlpha: 0, y: -56, rotation: 16 },
            { autoAlpha: 1, y: 0, rotation: 9.47, duration: 0.7, ease: "power3.out" }
          )
          .fromTo(
            ".tc__notice-line i",
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power1.inOut" },
            "-=0.35"
          )
          .from(".tc__notice-dot--small", { scale: 0, autoAlpha: 0, duration: 0.3 }, "-=0.2")
          .from(
            ".tc__notice-dot--big",
            { scale: 0, autoAlpha: 0, duration: 0.4, ease: "back.out(1.8)" },
            "-=0.1"
          )
          .from(".tc__notice-label", { autoAlpha: 0, y: 4, stagger: 0.08, duration: 0.3 }, "-=0.25");
      }
      // reduced motion: the arc layer simply renders unmasked, settled
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="tr" ref={rootRef}>
      <div className="tr__inner">
        <h2 className="tr__head">
          Read everything{" "}
          <br className="tr__head-br" />
          <em className="tr__head-em">before you sign anything.</em>
        </h2>

        <div className="tr__rows">
          {/* ── row 1 ── */}
          <div className="tr__row tr__row--1">
            {/* 1 · financing handoff — light glass, ink copy */}
            <article className="tc tc--hand">
              <p className="tc__copy">
                Your rent is financed through
                <br />
                <strong>Gromor, an RBI-registered NBFC.</strong>
              </p>
              <span className="tc__tile tc__tile--gromor">
                <span className="tc__gromor-crop">
                  <img src="/trust-gromor-logo.png" alt="" />
                </span>
              </span>
              <svg className="tc__chev" viewBox="0 0 45 48" aria-hidden>
                <path d="M4 34L14 24L4 14" />
                <path d="M18 34L28 24L18 14" />
                <path d="M32 34L42 24L32 14" />
              </svg>
              {/* the black flent mark (268:3355) */}
              <img
                className="tc__tile tc__tile--flent"
                src="/trust-flent-tile.svg"
                alt=""
              />
              <span className="tc__party-name tc__party-name--a">
                Gromor Finance
              </span>
              <span className="tc__party-name tc__party-name--b">Flent</span>
            </article>

            {/* 2 · no-cost EMI loop — glass (268:3359) */}
            <article className="tc tc--emi">
              <p className="tc__copy">
                Your schedule shows <strong>ten no-cost EMIs</strong>, each
                equal to your rent.{" "}
                <strong>Flent covers the financing cost directly with Gromor.</strong>
              </p>

              {/* the wire: chip » gromor, the flent mark riding it */}
              <span className="tc__wire" aria-hidden>
                <img src="/trust-wire.svg" alt="" />
              </span>

              {/* queued payments — receding ghosts (268:3361/3367) */}
              <div className="tc__emi-ghost tc__emi-ghost--mar" aria-hidden>
                <span className="tc__emi-ghost-row">
                  Next Payment <i>5th March</i>
                </span>
                <span className="tc__emi-ghost-amt">₹45,000</span>
              </div>
              <div className="tc__emi-ghost tc__emi-ghost--feb" aria-hidden>
                <span className="tc__emi-ghost-row">
                  Next Payment <i>5th February</i>
                </span>
                <span className="tc__emi-ghost-amt">₹45,000</span>
              </div>

              <div className="tc__emi-chip">
                <span className="tc__emi-chip-label">January Rental EMI</span>
                <span className="tc__emi-chip-amt">₹ 45,000</span>
                <span className="tc__emi-chip-sub">Paid to Flent</span>
              </div>

              {/* the interest is absorbed by Flent — a pill on the wire,
                  the flent mark leading the promise */}
              <span className="tc__emi-pill" aria-hidden>
                {/* the flent mark — black glyph, no tile (matches Figma) */}
                <svg className="tc__emi-pill-logo" viewBox="56 53 28 34">
                  <path
                    d="M71.0756 53C62.565 53 57.257 59.8871 59.194 66.6087L56 66.6203V70.9436H59.1997V87H66.5046V70.9436H72.1698V66.5797H69.5786C65.9876 66.5797 63.9135 64.5472 63.9135 61.7076C63.9135 59.3354 66.2761 57.5033 68.953 57.5033C74.9324 57.5033 76.695 62.7442 76.695 62.7442V87H84V59.1903C82.3402 56.9952 77.7692 53 71.0756 53Z"
                    fill="#111"
                  />
                </svg>
                <span className="tc__emi-pill-text">
                  Flent covers Interest on EMI
                </span>
              </span>

              <div className="tc__emi-gromor">
                <span className="tc__tile tc__tile--solid">
                  <span className="tc__gromor-crop">
                    <img src="/trust-gromor-logo.png" alt="" />
                  </span>
                </span>
                <span className="tc__party-name">Gromor Finance</span>
              </div>
            </article>
          </div>

          {/* ── row 2 — wide commitment card leads, CIBIL closes ── */}
          <div className="tr__row tr__row--2">
            {/* 3 · no blind commitment — light glass, slip breathing past
                the card's top edge */}
            <article className="tc tc--slip">
              <div className="tc__notice" aria-hidden>
                <span className="tc__notice-line">
                  <i />
                </span>
                <i className="tc__notice-dot tc__notice-dot--small" />
                <i className="tc__notice-dot tc__notice-dot--big" />
                <span className="tc__notice-label tc__notice-label--a">
                  Gave notice on
                  <br />
                  month 6
                </span>
                <span className="tc__notice-label tc__notice-label--b">
                  Leaving on
                  <br />
                  month 7
                </span>
              </div>

              <p className="tc__copy tc__copy--slip">
                <strong>No blind commitment.</strong> Repayment schedule,
                breakage terms, and full financing terms are shown upfront.
              </p>

              {/* the sample settlement slip, tucked into the card's pocket
                  (clipped by the card's top edge). The wrapper carries the
                  position; gsap owns the inner's rotation/slide so the two
                  never fight. */}
              <div className="tc__slip-wrap" aria-hidden>
                <div className="tc__slip">
                  <img className="tc__slip-paper" src="/exit-slip-shape.svg" alt="" />
                  <div className="tc__slip-body">
                    <div className="tc__slip-head">
                      <span>Flent 11 exit settlement slip</span>
                      <em>Upfront Plan</em>
                    </div>
                    <div className="tc__slip-rule" />
                    {SLIP_ROWS.map((r) => (
                      <div
                        className={`tc__slip-row${r.dim ? " is-dim" : ""}`}
                        key={r.k}
                      >
                        <span className="tc__slip-k">
                          {r.k}
                          {r.info && <InfoDot />}
                        </span>
                        <span className="tc__slip-v">{r.v}</span>
                      </div>
                    ))}
                    <div className="tc__slip-rule" />
                    <div className="tc__slip-total">
                      <span>Total refund</span>
                      <strong>₹ 2,01,000</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* 4 · CIBIL dial — copy leads, the dial settles beneath */}
            <article className="tc tc--cibil">
              <p className="tc__copy tc__copy--low">
                <strong>Your CIBIL score is not impacted</strong> if EMI is
                paid within 7 days of the due date.
              </p>
              <div className="tc__dial" aria-hidden>
                <img className="tc__dial-trackimg" src="/trust-dial-track.svg" alt="" />
                <span className="tc__dial-arcimg">
                  <i className="tc__dial-paint" />
                </span>
                <span className="tc__dial-score" ref={scoreRef}>
                  720
                </span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
