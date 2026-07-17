import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./exit.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Exit — "Wish to leave early? The math is right here." (Figma 241:1451,
   expanded card 18143581). The redesigned calculator: a month bar with a
   draggable exit marker, the MONEY SAVED pin riding it, flanking cards
   for months paid / months pending (loan closed), and the bill as an
   EXPANDABLE deductions card — headline deduction collapsed, the full
   math on click.

   Money model (Flexi Waiver plan — the one plan, no toggle):
     rent (from the journey intro) · term 11 · deposit 3 months
     two months on us ⇒ paid(M) = (M − 2)⁺ × rent, total rent = 9 × rent
     deposit withheld: 21 days of rent, capped at ₹18,000 (in place of
     the 3-month forfeit) · exit fee ₹5,000 flat
     refund = totalRent + deposit − paid − withheld − fee
     pending rent after month M reads ₹0 on you (loan closed).

   Track geometry: tick 1 at frame-x 222, pitch 105.8 (the tick-vector
   grid 241:1472…1482 — the MONTH text nodes drift a few px and are not
   the truth).
   ──────────────────────────────────────────────────────────────────────── */

const TERM = 11;
const FREE_MONTHS = 1; // month one on us — the site's one story
const EXIT_FEE = 5_000; // flat (Figma 18143581 — "Flat fee")
/* the marker's legal stops: no notice in the first two months (floor at
   3) and none past month 9 — later than that you're finishing the term */
const MIN_MONTH = 3;
const MAX_MONTH = 9;

/* bar geometry, frame px */
const BAR_L = 93;
const BAR_R = 1412;
const TICK0 = 222;
const PITCH = 105.8;
const tickX = (m: number) => TICK0 + (m - 1) * PITCH;
/* pointer → month, resolution-independent (rect-relative) */
const TRACK_W = BAR_R - BAR_L;
const DOT0 = TICK0 - BAR_L;

const inr = (n: number) => n.toLocaleString("en-IN");

/* ── the timeline story (Figma 358:2915) — what happens when you leave,
   told over the four moments of an exit. The calculator lives BEHIND it,
   opened by "See the full math". Frame coords: each step's dashed drop
   falls to the line at y 589; tick stems (y 554, h 69) cross it at the
   caption centres. ── */
const STORY = [
  {
    pill: "Give exit notice",
    copy: "The standard 30-day notice. Nothing extra because you’re on Flent 11.",
    x: 174,
    y: 298,
    dropX: 145,
    tickX: 144.5,
    when: "THE DAY YOU GIVE NOTICE",
  },
  {
    pill: "We close your loan",
    copy: "We settle the outstanding amount with Gromor directly. No foreclosure charge. Nothing for you to pay or chase.",
    x: 495,
    y: 348,
    dropX: 471,
    tickX: 470.5,
    when: "WITHIN 7 DAYS",
  },
  {
    pill: "Exit fee is deducted",
    copy: "We deduct 21 days of rent from your deposit as an exit fee. Not the full deposit.",
    x: 811,
    y: 398,
    dropX: 787,
    tickX: 786.5,
    when: "MOVE-OUT",
  },
  {
    pill: "Your balance deposit is returned",
    copy: "The remaining deposit comes back to you within 30 days of your move-out date.",
    x: 1129,
    y: 438,
    dropX: 1105,
    tickX: 1104.5,
    when: "AFTER MOVE-OUT",
  },
];

/* the three pledges under the line (358:3024). The file repeats "No full
   deposit forfeiture." on the third card — clearly a copy-paste slip, so
   the third reads the site's standing CIBIL promise instead. */
const PLEDGES = [
  "No full deposit forfeiture.",
  "No unclear penalties.",
  "No CIBIL reporting.",
];

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function ExitCalc({ rent = 45_000 }: { rent?: number }) {
  const DEPOSIT = 3 * rent;
  const TOTAL_RENT = (TERM - FREE_MONTHS) * rent;
  const WITHHELD = Math.min(18_000, Math.round((rent * 21) / 30 / 100) * 100);

  const [month, setMonth] = useState(MIN_MONTH); // the demo slides it to 7
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false); // blooms the dot's halo
  const [expanded, setExpanded] = useState(false);
  // the story is the section's face; the calculator opens behind
  // "See the full math" and closes back to it
  const [view, setView] = useState<"story" | "math">("story");
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const demoRef = useRef<gsap.core.Tween | null>(null);
  const touchedRef = useRef(false);
  // the math view's entrance + demo, held for the open handler — they
  // used to ride ScrollTriggers; now they play when the view opens
  const mathTlRef = useRef<gsap.core.Timeline | null>(null);
  const runDemoRef = useRef<(() => void) | null>(null);

  const paid = Math.max(0, month - FREE_MONTHS) * rent;
  const pendingMonths = TERM - month;
  const pendingRent = pendingMonths * rent;
  const refund = TOTAL_RENT + DEPOSIT - paid - WITHHELD - EXIT_FEE;

  const X = tickX(month); // the exit marker's frame-x
  const noticeMonth = month - 1;

  /* ── entrance + the head-start demo (1 → 7), killed on first touch ── */
  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);

    const ctx = gsap.context(() => {
      const setInitial = () => {
        if (!touchedRef.current) setMonth(MIN_MONTH);
        gsap.set(q(".ex__head, .ex__stat, .ex__loan, .ex__card"), {
          autoAlpha: 0,
          y: 22,
        });
        gsap.set(q(".ex__pin, .ex__pin-cap, .ex__stem"), { autoAlpha: 0, y: 10 });
        gsap.set(q(".ex__bar"), { autoAlpha: 0 });
      };
      setInitial();

      const tl = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .to(q(".ex__head"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.15)
        .to(q(".ex__bar"), { autoAlpha: 1, duration: 0.5 }, 0.3)
        .to(
          q(".ex__stat, .ex__loan"),
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 },
          0.4
        )
        .to(q(".ex__pin, .ex__pin-cap, .ex__stem"), { autoAlpha: 1, y: 0, duration: 0.5 }, 0.55)
        .to(q(".ex__card"), { autoAlpha: 1, y: 0, duration: 0.55 }, 0.7);

      const runDemo = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setMonth(7);
          return;
        }
        if (touchedRef.current) return;
        demoRef.current?.kill();
        const proxy = { v: MIN_MONTH };
        setMonth(MIN_MONTH);
        demoRef.current = gsap.to(proxy, {
          v: 7,
          duration: 1.4,
          delay: 0.15,
          ease: "power2.inOut",
          onUpdate: () => {
            if (!touchedRef.current) setMonth(Math.round(proxy.v));
          },
        });
      };
      mathTlRef.current = tl;
      runDemoRef.current = runDemo;

      /* ── the story view's entrance — head, then the line and its
         captions; then the focus dot pops onto the first tick and walks
         the line, dealing each moment (drop + pill + note) as it lands;
         pledges + CTA close ── */
      const mark = q(".ex__tl-mark");
      const tickLeft = (i: number) => `calc(var(--u) * ${STORY[i].tickX})`;
      const setStoryInitial = () => {
        gsap.set(q(".ex__shead, .ex__tls, .ex__pledge, .ex__mathcta"), {
          autoAlpha: 0,
          y: 22,
        });
        gsap.set(q(".ex__tl-line, .ex__tl-when, .ex__tl-drop"), {
          autoAlpha: 0,
        });
        gsap.set(mark, {
          autoAlpha: 0,
          left: tickLeft(0),
          xPercent: -50,
          yPercent: -50,
          scale: 0.4,
        });
      };
      setStoryInitial();

      const steps = q(".ex__tls");
      const drops = q(".ex__tl-drop");
      const tlStory = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .to(q(".ex__shead"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.15)
        .to(q(".ex__tl-line, .ex__tl-when"), { autoAlpha: 1, duration: 0.5 }, 0.3)
        .to(mark, { autoAlpha: 1, scale: 1, duration: 0.35 }, 0.55);
      STORY.forEach((_, i) => {
        if (i > 0)
          tlStory.to(mark, {
            left: tickLeft(i),
            duration: 0.4,
            ease: "power2.inOut",
          });
        // a small landing pulse as the step it lit comes up
        tlStory
          .to(mark, { scale: 1.3, duration: 0.14, yoyo: true, repeat: 1 })
          .to(drops[i], { autoAlpha: 1, duration: 0.3 }, "<")
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.45 }, "<");
      });
      tlStory.to(
        q(".ex__pledge, .ex__mathcta"),
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06 },
        "-=0.1"
      );

      ScrollTrigger.create({
        trigger: section,
        start: "top 35%",
        onEnter: () => {
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            tlStory.progress(1);
            return;
          }
          tlStory.restart();
        },
        onLeaveBack: () => {
          // park everything and hand the face back to the story
          demoRef.current?.kill();
          tlStory.pause(0);
          setStoryInitial();
          tl.pause(0);
          setInitial();
          setView("story");
        },
      });

      // the snap BREAK: recapture momentum that dribbles past the journey
      // pin's end so the sheet lands parked at full cover; anything past
      // half this zone scrolls on freely.
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=25%",
        snap: {
          snapTo: (v: number) => (v < 0.5 ? 0 : v),
          inertia: false,
          duration: { min: 0.2, max: 0.45 },
          delay: 0.06,
          ease: "power2.out",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── drag / tap / keys on the bar ── */
  const monthFromClientX = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const local = ((clientX - rect.left) / rect.width) * TRACK_W;
    const frac = (local - DOT0) / PITCH + 1;
    return Math.min(MAX_MONTH, Math.max(MIN_MONTH, Math.round(frac)));
  };

  const takeOver = () => {
    touchedRef.current = true;
    demoRef.current?.kill();
    setTouched(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    setDragging(true);
    takeOver();
    setMonth(monthFromClientX(e.clientX));
    const move = (ev: PointerEvent) => {
      if (draggingRef.current) setMonth(monthFromClientX(ev.clientX));
    };
    const up = () => {
      draggingRef.current = false;
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      takeOver();
      setMonth((m) => Math.max(MIN_MONTH, m - 1));
    }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      takeOver();
      setMonth((m) => Math.min(MAX_MONTH, m + 1));
    }
  };

  /* positions that track the marker are expressed as % of the bar's
     span (the .ex__rail mirrors it per breakpoint), so desktop frame
     units never leak into the phone artboard */
  const pct = (x: number) => ((x - BAR_L) / TRACK_W) * 100;
  const P = pct(X);
  /* the deductions card hugs the pin but stays inside the frame
     (card ≈ 31.5% of the rail wide on desktop) */
  const cardLeftPct = Math.min(Math.max(P - 15.73, 0), 100 - 31.46);

  /* the calculator's entrance replays on every open — it is the reveal
     the CTA promises. The demo re-arms itself (and stays away once the
     tenant has dragged the marker). */
  const openMath = () => {
    setView("math");
    mathTlRef.current?.restart();
    runDemoRef.current?.();
  };

  return (
    <section className="exit" ref={sectionRef}>
      <div className="ex__frame">
        {/* ── the exit story (Figma 358:2915) — the section's face ── */}
        <div
          className={`ex__story${view === "story" ? " is-on" : ""}`}
          aria-hidden={view !== "story"}
        >
          <div className="ex__shead">
            <h2 className="ex__title">
              If life changes, the maths is already on this page.
            </h2>
            <p className="ex__sub">
              Flent 11 is for tenants who intend to stay 11 months. But if
              life changes, you know exactly what happens next.
            </p>
          </div>

          {/* the timeline (Vector 12) with its tick stems + captions */}
          <span className="ex__tl-line" aria-hidden />
          {STORY.map((s) => (
            <div
              key={s.when}
              className="ex__tl-when"
              style={{ left: u(s.tickX) }}
            >
              <span className="ex__tl-stem" aria-hidden />
              <span className="ex__tl-cap">{s.when}</span>
            </div>
          ))}
          {/* you-are-here (Group 2) — the focus dot; the entrance walks it
              tick to tick, dealing each step as it lands (gsap owns its
              left, so no inline position here) */}
          <span className="ex__tl-mark" aria-hidden />

          {/* the four moments, stepping down toward move-out */}
          {STORY.map((s) => (
            <span
              key={`${s.when}-drop`}
              className="ex__tl-drop"
              style={{ left: u(s.dropX), top: u(s.y), height: u(589 - s.y) }}
              aria-hidden
            />
          ))}
          {STORY.map((s) => (
            <div
              key={s.pill}
              className="ex__tls"
              style={{ left: u(s.x), top: u(s.y) }}
            >
              <i className="ex__tls-when">{s.when}</i>
              <span className="ex__tls-pill">{s.pill}</span>
              <p className="ex__tls-copy">{s.copy}</p>
            </div>
          ))}

          {/* the pledges + the way into the calculator (358:3024/3031) */}
          <div className="ex__pledges">
            {PLEDGES.map((p) => (
              <div key={p} className="ex__pledge">
                {p}
              </div>
            ))}
          </div>
          <button type="button" className="ex__mathcta" onClick={openMath}>
            <span className="ex__mathcta-t">See the full math</span>
            <span className="ex__mathcta-s">
              Enter your rent and which month you leave and see how much
              you’d get back
            </span>
            <img className="ex__mathcta-arrow" src="/exit-arrow.svg" alt="" />
          </button>
        </div>

        {/* ── the calculator — nested behind "See the full math" ── */}
        <div
          className={`ex__math${view === "math" ? " is-on" : ""}`}
          aria-hidden={view !== "math"}
        >
        <button
          type="button"
          className="ex__back"
          onClick={() => setView("story")}
        >
          <svg viewBox="0 0 12 12" aria-hidden>
            <path d="M7.5 2.5L4 6l3.5 3.5" />
          </svg>
          Back
        </button>
        {/* ── header (241:1453) ── */}
        <div className="ex__head">
          <h2 className="ex__title">Wish to leave early? The math is right here.</h2>
          <p className="ex__sub">
            Plans change and we are here to support you.{" "}
            <em>Nothing hidden, nothing forfeited.</em>
          </p>
        </div>

        {/* ── flanking stats (269:112 / 269:118 / 269:125) ── */}
        <div className="ex__stat ex__stat--paid">
          <span className="ex__stat-k">
            {month} month{month === 1 ? "" : "s"} paid
          </span>
          <span className="ex__stat-v">
            ₹{inr(paid)}{" "}
            <i>
              ( {month} month{month === 1 ? "" : "s"} )
            </i>
          </span>
        </div>
        <div className="ex__stat ex__stat--pend">
          <span className="ex__stat-k">
            {pendingMonths} month{pendingMonths === 1 ? "" : "s"} pending
          </span>
          <span className="ex__stat-v">
            <em className="ex__stat-zero">₹0 on you</em>{" "}
            <s>₹{inr(pendingRent)}</s>
          </span>
        </div>
        <span className="ex__loan">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 1.5l5 1.8v4c0 3.4-2.1 5.9-5 7.2-2.9-1.3-5-3.8-5-7.2v-4z"
              stroke="rgba(0,100,55,0.75)"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M5.6 8l1.7 1.7 3.1-3.2"
              stroke="rgba(0,100,55,0.75)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Loan closed
        </span>

        {/* ── the month bar (254:2678 + 241:1468) — a frame-level child:
            it owns the pointer, so it must stay out of the inert rail ── */}
        <div
          className={`ex__bar${touched ? " is-touched" : ""}${dragging ? " is-dragging" : ""}`}
          ref={trackRef}
          role="slider"
          aria-label="Month you'd leave"
          aria-valuemin={MIN_MONTH}
          aria-valuemax={MAX_MONTH}
          aria-valuenow={month}
          aria-valuetext={`Month ${month}`}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
        >
          <span
            className="ex__bar-fill"
            style={{ width: `calc(${P}% - 4px)` }}
          />
          <span className="ex__bar-rest" style={{ left: `calc(${P}% + 4px)` }} />
          <span className="ex__bar-line" aria-hidden />
          {/* the journey line (241:1470) — 2px, orange easing to dark as it
              reaches the marker; the gradient rides the width */}
          <span className="ex__bar-grad" style={{ width: `${P}%` }} aria-hidden />
          {Array.from({ length: TERM }, (_, i) => i + 1).map((m) => (
            <i
              key={m}
              className={`ex__tickmark${m === noticeMonth ? " is-notice" : ""}`}
              style={{ left: `${pct(tickX(m))}%` }}
              aria-hidden
            />
          ))}
          <span className="ex__dot" style={{ left: `${P}%` }} aria-hidden />
        </div>

        {/* ── everything that rides the marker lives on the rail ── */}
        <div className="ex__rail" aria-hidden="false">
          <span className="ex__pin-cap" style={{ left: `${P}%` }}>
            Money saved
          </span>
          <div className="ex__pin" style={{ left: `${P}%` }}>
            ₹{inr(refund)}
          </div>
          <span className="ex__stem" style={{ left: `${P}%` }} aria-hidden />

          {/* tick labels — the exit month's slot yields to the big label */}
          {Array.from({ length: TERM }, (_, i) => i + 1).map(
            (m) =>
              m !== month && (
                <span
                  key={m}
                  className={`ex__tick${m > month ? " is-ahead" : ""}`}
                  style={{ left: `${pct(tickX(m))}%` }}
                >
                  Month {m}
                </span>
              )
          )}
          <span
            className="ex__notice"
            style={{ left: `${pct(tickX(noticeMonth))}%` }}
          >
            Gave notice
          </span>
          <span className="ex__month" style={{ left: `${P}%` }}>
            Month {month}
          </span>

        {/* ── the bill — an expandable deductions card (241:1518) ── */}
          <div
            className={`ex__card${expanded ? " is-open" : ""}`}
            style={{ left: `${cardLeftPct}%` }}
          >
          <div className="ex__card-head">
            <span className="ex__card-title">Deductions</span>
            <button
              type="button"
              className="ex__card-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Hide full math" : "See full math"}
              <svg viewBox="0 0 12 12" aria-hidden>
                <path d="M2.5 4.5L6 8l3.5-3.5" />
              </svg>
            </button>
          </div>

          <span className="ex__chip">Flexi Waiver Plan</span>

          {/* collapsed — the headline deduction */}
          <div className="ex__card-a" aria-hidden={expanded}>
            <div className="ex__card-a-clip">
              <p className="ex__waiver">
                21 days rent <s>3 months deposit</s>
              </p>
              <p className="ex__waiver-sub">
                <strong>₹ {inr(WITHHELD)}</strong> + exit fee and damages
              </p>
            </div>
          </div>

          {/* expanded — the full math (Figma 18143581) */}
          <div className="ex__card-b" aria-hidden={!expanded}>
            <div className="ex__card-b-clip">
              <div className="ex__row">
                <span className="ex__row-k">Total rent</span>
                <span className="ex__row-v">
                  ₹{inr(TOTAL_RENT)} <i>( {TERM} months )</i>
                </span>
              </div>
              <div className="ex__row">
                <span className="ex__row-k">Total deposit</span>
                <span className="ex__row-v">
                  ₹{inr(DEPOSIT)} <i>( 3 months )</i>
                </span>
              </div>
              <div className="ex__rule" />
              <div className="ex__row">
                <span className="ex__row-k">Lived rent</span>
                <span className="ex__row-v ex__row-v--ded">
                  -₹{inr(paid)}{" "}
                  <i>
                    ( {month} month{month === 1 ? "" : "s"} )
                  </i>
                </span>
              </div>
              <div className="ex__row">
                <span className="ex__row-k">Witheld deposit</span>
                <span className="ex__row-v ex__row-v--ded">
                  -₹{inr(WITHHELD)}{" "}
                  <i>
                    ( 21 days <s>3 month</s> )
                  </i>
                </span>
              </div>
              <div className="ex__row">
                <span className="ex__row-k">Exit fee</span>
                <span className="ex__row-v ex__row-v--ded">
                  -₹{inr(EXIT_FEE)} <i>( Flat fee )</i>
                </span>
              </div>
              <div className="ex__rule" />
              <div className="ex__total">
                <span>Total refund</span>
                <strong>₹ {inr(refund)}</strong>
              </div>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
