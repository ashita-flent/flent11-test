import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./exit.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Exit — two faces sharing one grey thread (the line at frame-y 629).

   Face 1 · the story (Figma 383:420 "Frame 18143644"): four moments as
   dark pills stepping down toward move-out, each dropping a dashed stem
   to the line; the "See the full math" pill RESTS ON the line and swipes
   the calculator in from the right.

   Face 2 · the calculator (Figma 316:1755 "Frame 18143589"): the month
   bar's waist runs along the SAME line — the thread never moves while
   the faces swipe left/right around it. Slider + editable rent, the
   total-refund pill riding the marker, deductions card always open.

   Money model (unchanged — computed live, so every figure reconciles):
     rent (shared app state) · term 11 · deposit 3 months · month 1 free
     paid(M) = (M − 1) × rent, total rent = 10 × rent
     withheld: 21 days of rent capped ₹18,000 · exit fee ₹5,000 flat
     refund = totalRent + deposit − paid − withheld − fee

   Track geometry: tick 1 at frame-x 222, pitch 105.8; track waist y 629.
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

/* the shared thread runs at frame-y 629 (.ex__thread) — the story line,
   the track waist and the CTA's centre all sit on it */

/* ── the phone's VERTICAL slider (Figma 416:242) — the thread itself is
   the track: month m's tick crosses it at y = 265 + 43m (slot 0 is the
   track head at the fixed line's top), the marker rides it as a stem →
   bob → refund pill row ── */
const V0 = 265;
const VPITCH = 43;
const vY = (m: number) => V0 + VPITCH * m;
/* the touch band spans month 1..11 tick centres ± half a pitch */
const VBAND_TOP = vY(1) - VPITCH / 2;
const VBAND_H = VPITCH * 11;

const inr = (n: number) => n.toLocaleString("en-IN");

/* ── the exit story (Figma 383:420) — four moments along the thread.
   Pills at staggered heights; dashed drops fall to the solid tick stems
   (y 594–663) crossing the line at 629; captions hang at 677. ── */
const STORY: {
  icon: string;
  iconW: number;
  iconH: number;
  pill: string;
  copy: ReactNode;
  x: number;
  y: number;
  w: number;
  copyW: number;
  dropX: number;
  when: string;
}[] = [
  {
    icon: "/exit-ic-notice.svg",
    iconW: 16,
    iconH: 20,
    pill: "Give exit notice",
    copy: (
      <>
        The standard <strong>30-day notice</strong>. Nothing extra because
        you’re on Flent&nbsp;11.
      </>
    ),
    x: 120,
    y: 285,
    w: 270,
    copyW: 199,
    dropX: 145,
    when: "THE DAY YOU GIVE NOTICE",
  },
  {
    icon: "/exit-ic-close.svg",
    iconW: 20,
    iconH: 20,
    pill: "We close your loan",
    copy: (
      <>
        We settle the outstanding amount with Gromor directly. No foreclosure
        charge. <strong>Nothing for you to pay or chase</strong>.
      </>
    ),
    x: 420,
    y: 335,
    w: 270,
    copyW: 190,
    dropX: 445,
    when: "WITHIN 7 DAYS",
  },
  {
    icon: "/exit-ic-fee.svg",
    iconW: 20,
    iconH: 20,
    pill: "Exit fee is deducted",
    copy: (
      <>
        We deduct <strong>21 days of rent from your deposit</strong> as an
        exit fee. Not the full deposit.
      </>
    ),
    x: 721,
    y: 385,
    w: 270,
    copyW: 221,
    dropX: 745,
    when: "MOVE-OUT",
  },
  {
    icon: "/exit-ic-cash.svg",
    iconW: 20,
    iconH: 16,
    pill: "Your balance deposit returned",
    copy: (
      <>
        The remaining deposit comes back to you <strong>within 30 days</strong>{" "}
        of your move-out date.
      </>
    ),
    x: 1022,
    y: 435,
    w: 357,
    copyW: 230,
    dropX: 1046,
    when: "AFTER MOVE-OUT",
  },
];

/* the three pledges under the line (391:819…845 / phone 413:1025) */
const PLEDGES = [
  "No full deposit forfeiture.",
  "No unclear penalties.",
  "Loan closed after you leave.",
];

const u = (n: number) => `calc(var(--u) * ${n})`;

export default function ExitCalc({
  rent = 45_000,
  onRentChange,
}: {
  rent?: number;
  onRentChange?: (rent: number) => void;
}) {
  const DEPOSIT = 3 * rent;
  const TOTAL_RENT = (TERM - FREE_MONTHS) * rent;
  const WITHHELD = Math.min(18_000, Math.round((rent * 21) / 30 / 100) * 100);

  const [month, setMonth] = useState(MIN_MONTH); // the demo slides it to 7
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false); // blooms the dot's halo
  // the story is the section's face; the calculator swipes in from the
  // right behind "See the full math" and swipes back out
  const [view, setView] = useState<"story" | "math">("story");
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const vbandRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const demoRef = useRef<gsap.core.Tween | null>(null);
  const touchedRef = useRef(false);
  // the math view's entrance + demo, held for the open handler
  const mathTlRef = useRef<gsap.core.Timeline | null>(null);
  const runDemoRef = useRef<(() => void) | null>(null);

  /* the rent field — free typing with Indian grouping, bounded like the
     journey intro's field so half-typed values never flash the maths */
  const RENT_MIN = 20_000;
  const RENT_MAX = 100_000;
  const [rentText, setRentText] = useState(() => inr(rent));
  const onRentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setRentText(digits ? inr(Number(digits)) : "");
    const n = Number(digits);
    if (n >= RENT_MIN) onRentChange?.(Math.min(RENT_MAX, n));
  };
  const commitRent = () => {
    const raw = Number(rentText.replace(/\D/g, "")) || 45_000;
    const clamped = Math.min(RENT_MAX, Math.max(RENT_MIN, raw));
    onRentChange?.(clamped);
    setRentText(inr(clamped));
  };

  const paid = Math.max(0, month - FREE_MONTHS) * rent;
  const pendingMonths = TERM - month;
  const pendingRent = pendingMonths * rent;
  const refund = TOTAL_RENT + DEPOSIT - paid - WITHHELD - EXIT_FEE;

  const X = tickX(month); // the exit marker's frame-x
  const noticeMonth = month - 1;
  const closedMonth = month + 1; // the loan is closed by the next month

  /* ── entrances (story + math) — replayed per open / scroll entry ── */
  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);

    const ctx = gsap.context(() => {
      const setInitial = () => {
        if (!touchedRef.current) setMonth(MIN_MONTH);
        gsap.set(q(".ex__head, .ex__stat, .ex__card"), {
          autoAlpha: 0,
          y: 22,
        });
        gsap.set(q(".ex__pin, .ex__stem, .ex__loanclosed"), {
          autoAlpha: 0,
          y: 10,
        });
        gsap.set(q(".ex__bar"), { autoAlpha: 0 });
      };
      setInitial();

      const tl = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .to(q(".ex__head"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.15)
        .to(q(".ex__bar"), { autoAlpha: 1, duration: 0.5 }, 0.3)
        .to(
          q(".ex__stat"),
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 },
          0.4
        )
        .to(
          q(".ex__pin, .ex__stem, .ex__loanclosed"),
          { autoAlpha: 1, y: 0, duration: 0.5 },
          0.55
        )
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
          delay: 0.55, // begins as the slide-in lands
          ease: "power2.inOut",
          onUpdate: () => {
            if (!touchedRef.current) setMonth(Math.round(proxy.v));
          },
        });
      };
      mathTlRef.current = tl;
      runDemoRef.current = runDemo;

      /* ── the story's entrance — head first, the timeline furniture
         next, then each moment lands with its dashed drop; pledges and
         the CTA close ── */
      const setStoryInitial = () => {
        gsap.set(q(".ex__shead, .ex__tls, .ex__pledge, .ex__mathcta"), {
          autoAlpha: 0,
          y: 22,
        });
        gsap.set(q(".ex__tl-when, .ex__tl-drop"), { autoAlpha: 0 });
      };
      setStoryInitial();

      const steps = q(".ex__tls");
      const drops = q(".ex__tl-drop");
      const tlStory = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });
      if (window.matchMedia("(max-width: 640px)").matches) {
        /* the phone story (413:794) reads top-down: head with the
           way-in right under it, then the vertical timeline's moments
           walk down the line; the safety cards wait past the fold */
        tlStory
          .to(q(".ex__shead"), { autoAlpha: 1, y: 0, duration: 0.5 }, 0.1)
          .to(q(".ex__mathcta"), { autoAlpha: 1, y: 0, duration: 0.45 }, 0.35)
          .to(q(".ex__tl-when"), { autoAlpha: 1, duration: 0.4 }, 0.5)
          .to(steps, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.12 }, 0.5)
          .to(
            q(".ex__pledge"),
            { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08 },
            "-=0.15"
          );
      } else {
        tlStory
          .to(q(".ex__shead"), { autoAlpha: 1, y: 0, duration: 0.6 }, 0.15)
          .to(q(".ex__tl-when"), { autoAlpha: 1, duration: 0.5 }, 0.35);
        STORY.forEach((_, i) => {
          const at = 0.55 + i * 0.16;
          tlStory
            .to(drops[i], { autoAlpha: 1, duration: 0.35 }, at)
            .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.5 }, at);
        });
        tlStory.to(
          q(".ex__pledge, .ex__mathcta"),
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06 },
          "-=0.1"
        );
      }

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

      // the snap BREAK — the section reads as a full page: from parked
      // (top top) through one viewport of scroll, an idle scroll either
      // returns the sheet to parked or hands off decisively to the next
      // section (v=1 ⇒ trust's top at the viewport top). Thresholds lean
      // with the scroll direction so a downward flick commits sooner and
      // an upward one returns sooner. Desktop only — the phone column is
      // a taller free-scrolling flow where page-snapping would fight it.
      if (!window.matchMedia("(max-width: 640px)").matches) {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "+=100%",
          snap: {
            snapTo: (v: number, self?: ScrollTrigger) => {
              const threshold = (self?.direction ?? 1) > 0 ? 0.35 : 0.65;
              return v < threshold ? 0 : 1;
            },
            inertia: false,
            duration: { min: 0.3, max: 0.6 },
            delay: 0.08,
            ease: "power2.inOut",
          },
        });
      } else {
        // phones keep the light recapture: momentum that dribbles past
        // the journey's pin still lands the sheet parked at full cover
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
      }
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

  /* ── the phone's vertical band — drag along the thread ── */
  const monthFromClientY = (clientY: number) => {
    const rect = vbandRef.current!.getBoundingClientRect();
    const ueY =
      VBAND_TOP + ((clientY - rect.top) / rect.height) * VBAND_H;
    return Math.min(
      MAX_MONTH,
      Math.max(MIN_MONTH, Math.round((ueY - V0) / VPITCH))
    );
  };

  const onVPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    setDragging(true);
    takeOver();
    setMonth(monthFromClientY(e.clientY));
    const move = (ev: PointerEvent) => {
      if (draggingRef.current) setMonth(monthFromClientY(ev.clientY));
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

  /* positions that track the marker are expressed as % of the bar's
     span (the .ex__rail mirrors it per breakpoint) */
  const pct = (x: number) => ((x - BAR_L) / TRACK_W) * 100;
  const P = pct(X);
  /* the deductions card hugs the marker but stays inside the frame
     (card 434u ≈ 32.9% of the rail wide on desktop) */
  const cardLeftPct = Math.min(Math.max(P - 16.45, 0), 100 - 32.9);

  /* the calculator rides in FULLY FORMED — the whole face slides as one
     piece so its track visibly picks up the thread; only the demo (the
     marker's walk to month 7) animates once the slide lands */
  const openMath = () => {
    setView("math");
    mathTlRef.current?.progress(1);
    runDemoRef.current?.();
  };

  /* ── the math page is a separate single page on EVERY viewport (phone +
     desktop): opening it parks the section flush and freezes the page until
     Back — you can only return to the exit story, never scroll past it into
     trust. Scrolling onward would strand the story mid-frame behind the
     nested page. overflow:hidden stops native gestures + keyboard + the
     scrollbar; the re-pin catches everything else (momentum hand-offs,
     ScrollTrigger snaps, programmatic scrolls). On desktop with a classic
     scrollbar we reserve its width so hiding it doesn't reflow the page
     (a no-op under Mac's overlay scrollbars, where the width is 0). ── */
  useLayoutEffect(() => {
    if (view !== "math") return;
    const s = sectionRef.current!;
    const topY = Math.round(s.getBoundingClientRect().top + window.scrollY);
    window.scrollTo({ top: topY, behavior: "auto" });
    const root = document.documentElement;
    const sbw = window.innerWidth - root.clientWidth; // classic-scrollbar width
    root.style.overflow = "hidden";
    if (sbw > 0) root.style.paddingRight = `${sbw}px`;
    const repin = () => {
      if (Math.abs(window.scrollY - topY) > 1) window.scrollTo(0, topY);
    };
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("scroll", repin);
    // wheel/touchmove die here so nothing reaches the scroller; the
    // slider's drag rides pointer events, which these don't cancel
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("scroll", repin);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      root.style.overflow = "";
      root.style.paddingRight = "";
    };
  }, [view]);

  return (
    <section className="exit" ref={sectionRef}>
      <div className="ex__frame">
        {/* ── the thread (Vector 12) — one grey line shared by both faces;
            it never moves while the views swipe around it ── */}
        <span className="ex__thread" aria-hidden />

        {/* ── face 1 · the exit story (Figma 383:420) ── */}
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

          {/* dashed drops from each pill down to the thread */}
          {STORY.map((s) => (
            <span
              key={`${s.when}-drop`}
              className="ex__tl-drop"
              style={{
                left: u(s.dropX),
                top: u(s.y + 53),
                height: u(594 - (s.y + 53)),
              }}
              aria-hidden
            />
          ))}

          {/* solid tick stems crossing the thread, captions hanging under
              (on phones they move to the left gutter of the vertical line) */}
          {STORY.map((s, i) => (
            <div
              key={s.when}
              className={`ex__tl-when ex__tl-when--${i}`}
              style={{ left: u(s.dropX) }}
            >
              <span className="ex__tl-stem" aria-hidden />
              <span className="ex__tl-cap">{s.when}</span>
            </div>
          ))}

          {/* the four moments — icon chip on a dark pill, note below */}
          {STORY.map((s, i) => (
            <div
              key={s.pill}
              className={`ex__tls ex__tls--${i}`}
              style={{ left: u(s.x), top: u(s.y), width: u(Math.max(s.w, s.copyW + 60)) }}
            >
              <span className="ex__tls-pill" style={{ width: u(s.w) }}>
                <span className="ex__tls-chip">
                  <img
                    src={s.icon}
                    alt=""
                    style={{ width: u(s.iconW), height: u(s.iconH) }}
                  />
                </span>
                {s.pill}
              </span>
              <p className="ex__tls-copy" style={{ width: u(s.copyW) }}>
                {s.copy}
              </p>
            </div>
          ))}

          {/* the pledges (391:819…) + the way into the calculator — the
              CTA rests ON the thread and swipes the math in */}
          <div className="ex__pledges">
            {PLEDGES.map((p) => (
              <div key={p} className="ex__pledge">
                <span className="ex__pledge-tile">
                  <img src="/exit-ic-shield.svg" alt="" />
                </span>
                {p}
              </div>
            ))}
          </div>
          <button type="button" className="ex__mathcta" onClick={openMath}>
            See the full math
            <img className="ex__mathcta-arrow" src="/exit-ic-arrow.svg" alt="" />
          </button>
        </div>

        {/* ── face 2 · the calculator (Figma 316:1755) ── */}
        <div
          className={`ex__math${view === "math" ? " is-on" : ""}`}
          aria-hidden={view !== "math"}
        >
          <button
            type="button"
            className="ex__back"
            onClick={() => setView("story")}
          >
            <span className="ex__back-arrow" aria-hidden />
            Back
          </button>

          {/* ── header row (394:523) — title + the rent block ── */}
          <div className="ex__head">
            <h2 className="ex__mtitle">
              Slide to the month you wish to leave,{" "}
              <br />
              and see the math work for you
            </h2>
            <div className="ex__rent">
              <div className="ex__rent-row">
                <span className="ex__rent-k">Your monthly rent</span>
                <label className="ex__rent-field">
                  <span>₹</span>
                  <input
                    value={rentText}
                    onChange={onRentInput}
                    onBlur={commitRent}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      e.stopPropagation();
                    }}
                    inputMode="numeric"
                    aria-label="Your monthly rent"
                  />
                </label>
              </div>
              <div className="ex__rent-row">
                <span className="ex__rent-k">
                  Total rent <i>( {TERM} months )</i>
                </span>
                <span className="ex__rent-v">
                  ₹{inr(TOTAL_RENT)} <s>₹{inr(TERM * rent)}</s>
                </span>
              </div>
            </div>
          </div>

          {/* ── the phone's vertical slider (416:242) — the thread IS the
              track: ticks cross it, the marker rides it, the cards float
              beside it. Hidden on desktop; the horizontal rail hides on
              phones. ── */}
          <div className="ex__vslider">
            {/* tick dashes across the line (slot 0 = the track head) */}
            {Array.from({ length: TERM + 1 }, (_, k) => (
              <i
                key={k}
                className="ex__vtick"
                style={{ top: u(V0 + VPITCH * k) }}
                aria-hidden
              />
            ))}

            {/* month labels in the line's left gutter */}
            {Array.from({ length: TERM }, (_, i) => i + 1).map((m) => (
              <span
                key={m}
                className={`ex__vmonth${m === month ? " is-exit" : ""}${m > month ? " is-ahead" : ""}`}
                style={{ top: u(vY(m)) }}
              >
                Month {m}
              </span>
            ))}
            <span className="ex__vtag" style={{ top: u(vY(noticeMonth) + 8) }}>
              Gave notice
            </span>
            {closedMonth <= TERM && (
              <span
                className="ex__vtag ex__vtag--closed"
                style={{ top: u(vY(closedMonth) + 8) }}
              >
                Loan closed
              </span>
            )}

            {/* the drag band riding the thread */}
            <div
              className="ex__vband"
              ref={vbandRef}
              role="slider"
              aria-label="Month you'd leave"
              aria-valuemin={MIN_MONTH}
              aria-valuemax={MAX_MONTH}
              aria-valuenow={month}
              aria-valuetext={`Month ${month}`}
              tabIndex={0}
              onPointerDown={onVPointerDown}
              onKeyDown={onKeyDown}
            />

            {/* the marker — stem off the line, the bob, the refund pill */}
            <span className="ex__vstem" style={{ top: u(vY(month)) }} aria-hidden />
            <span className="ex__vdot" style={{ top: u(vY(month)) }} aria-hidden />
            <div className="ex__vpin" style={{ top: u(vY(month)) }}>
              <span>Total refund</span>
              <strong>₹{inr(refund)}</strong>
            </div>

            {/* deductions — above the marker once it's past mid-track,
                below it early on. Anchored by the marker line (top = vY)
                and offset by transform per side, so its BOTTOM always
                clears the refund pill by a fixed gap no matter how tall
                the card renders (the px-floored mobile type grows it) */}
            <div
              className={`ex__vcard${month >= 6 ? " is-above" : ""}`}
              style={{ top: u(vY(month)) }}
            >
              <span className="ex__vcard-title">Deductions</span>
              <div className="ex__vrow">
                <span className="ex__vrow-k">Total deposit</span>
                <span className="ex__vrow-v">
                  ₹{inr(DEPOSIT)} <i>( 3 months )</i>
                </span>
              </div>
              <div className="ex__vrule" />
              <div className="ex__vrow">
                <span className="ex__vrow-k">Lived rent</span>
                <span className="ex__vrow-v ex__vrow-v--ded">
                  -₹{inr(paid)}{" "}
                  <i>
                    ( {month} month{month === 1 ? "" : "s"} )
                  </i>
                </span>
              </div>
              <div className="ex__vrow">
                <span className="ex__vrow-k">Witheld deposit</span>
                <span className="ex__vrow-v ex__vrow-v--ded">
                  -₹{inr(WITHHELD)}{" "}
                  <i>
                    ( <em>21 days only</em> <s>3 month</s> )
                  </i>
                </span>
              </div>
              <div className="ex__vrow">
                <span className="ex__vrow-k">Exit fee</span>
                <span className="ex__vrow-v ex__vrow-v--ded">
                  -₹{inr(EXIT_FEE)} <i>( Flat fee )</i>
                </span>
              </div>
            </div>

            {/* the flanking chips — paid above, pending below the track */}
            <div className="ex__vchip ex__vchip--paid">
              <span className="ex__vchip-k">
                {month} month{month === 1 ? "" : "s"} paid
              </span>
              <span className="ex__vchip-v">
                ₹{inr(paid)}{" "}
                <i>
                  ( {month} month{month === 1 ? "" : "s"} )
                </i>
              </span>
            </div>
            <div className="ex__vchip ex__vchip--pend">
              <span className="ex__vchip-k">
                {pendingMonths} month{pendingMonths === 1 ? "" : "s"} pending
              </span>
              <span className="ex__vchip-v">
                <em>₹0 on you</em> <s>₹{inr(pendingRent)}</s>
              </span>
            </div>
          </div>

          {/* ── flanking stats (316:1789 / 316:1795) ── */}
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

          {/* ── the month bar (316:1847) — its waist rides the thread ── */}
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
            {/* the journey line (Vector 3) — 2px, orange easing dark */}
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

          {/* ── everything riding the marker lives on the rail ── */}
          <div className="ex__rail" aria-hidden="false">
            {/* the total-refund pill (316:1850) above the marker */}
            <div className="ex__pin" style={{ left: `${P}%` }}>
              <span>Total refund</span>
              <strong>₹{inr(refund)}</strong>
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
            {closedMonth <= TERM && (
              <span
                className="ex__loanclosed"
                style={{ left: `${pct(tickX(closedMonth))}%` }}
              >
                Loan closed
              </span>
            )}
            <span className="ex__month" style={{ left: `${P}%` }}>
              Month {month}
            </span>

            {/* ── the deductions card (316:1802) — always open ── */}
            <div className="ex__card" style={{ left: `${cardLeftPct}%` }}>
              <span className="ex__card-title">Deductions</span>
              <div className="ex__card-rows">
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
                      ( <em>21 days only</em> <s>3 month</s> )
                    </i>
                  </span>
                </div>
                <div className="ex__row">
                  <span className="ex__row-k">Exit fee</span>
                  <span className="ex__row-v ex__row-v--ded">
                    -₹{inr(EXIT_FEE)} <i>( Flat fee )</i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
