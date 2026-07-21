import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./how.css";

gsap.registerPlugin(ScrollTrigger);

/* phones resize the viewport every time the browser chrome slides in or
   out — without this, every such resize re-measures the pinned journey
   MID-READ and the indicator/beat tracking jumps a step. ScrollTrigger
   ignores those mobile chrome resizes entirely (rotations still refresh). */
ScrollTrigger.config({ ignoreMobileResize: true });
/* phone browsers resize the viewport as their address bar collapses —
   without this every such resize re-measures the pinned journey mid-
   scroll and the stage visibly jumps (global config; set once here,
   the section that owns the page's big pin) */
ScrollTrigger.config({ ignoreMobileResize: true });

/* ────────────────────────────────────────────────────────────────────────
   How it works — Figma Page 2 ("Flent-11", node 13:3).
   One shared background image (the sunlit-wall room) that the scroll
   journey dollies across; an intro frame + step frames cross-fade over it,
   and the journey indicator tracks along the bottom. The scroll snaps to
   rest at each step's settled frame.

   The background placements are lifted verbatim from Figma. In each 1512 ×
   982 frame the same image is placed at:

     intro   (16:5)      2019×1132 @ (-95,  -88)  opacity .50
     move-in (33:368)    4581×2314 @ (-2344, -3)  opacity 1 + top scrim
     emi     (252:2352)  2062×1042 @ (-546,  -3)  opacity 1 + blur scrim
     complete (39:309)   room hidden; greenery full bleed

   The base layer is CSS-positioned at the intro placement; each step is a
   translate+scale of that layer (origin top-left).

   LAYERING NOTE: the window's wooden frame (overlay blend) and the ₹0
   pane's white glow must composite against the WALL, but anything inside
   the transformed rig/frame stacking contexts can only blend with siblings
   in there. So they live as stage-level rigs (glow, glass, frame) that
   share the window's transforms.
   ──────────────────────────────────────────────────────────────────────── */

/* the journey's room (updated 2026-07-16 to the start frame's image —
   329:2707: door at the left, crisp tree-shadow wall; the old hazy
   /how-bg.png room is retired) */
const BG = "/how-bg2.jpg";

/* Indian-grouping money formatter (45,000 · 4,95,000) */
export const inr = (n: number) => n.toLocaleString("en-IN");

type Focus = { x: number; y: number; scale: number; opacity: number };

/* TWO renditions of the room share the dollied element (matching the
   file): the door-lit morning (/how-bg2.jpg, 1344×768) carries the intro,
   then dissolves into the olive afternoon (/how-bg3.jpg, 1614×816 — the
   33:369 fill) INSIDE the move-in dive, so the zoom never breaks.
   Focus math for a design node w×h @ (dx,dy):
     scale k = w/2019 · x% = (dx+95)/2019
     door layer (cover in the 1.784 box):  y% = (dy + 88 + 11k − (w/1.75 − h)/2)/1132
     olive layer (own-ratio, top-left):    y% = (dy + 88 − max(0,(w/1.978 − h)/2))/1132 */

/* Figma 329:2687 (journey start, 2026-07-18): room 2285×1286 @ (−478,−152) */
const INTRO_FOCUS: Focus = { x: -18.97, y: -5.43, scale: 1.13175, opacity: 1 };

type Step = {
  id: string;
  when: string;
  /** the mobile frames run shorter captions (iPhone 17 - 4…6) */
  whenM: string;
  title: string;
  body: string;
  focus: Focus;
  /** phone frames crop the room differently — an override dolly pose */
  focusM?: Focus;
  /** Each variant renders its exact Figma frame layout. */
  variant: "financed" | "movein" | "monthly" | "complete";
  /** Journey-indicator colour scheme, matched to the settled backdrop:
      "ink" over the light frames, "white" over the dark ones. */
  tone: "ink" | "white";
};

/* Restructured journey (2026-07-14 Figma pass): the intro's rent input
   retires (the figure edits inline on the move-in sub), the old
   "financed upfront" card-step and "pay monthly" flow-step merge into one
   financing-loop frame, and move-in leads the journey. */
const STEPS: Step[] = [
  {
    id: "movein",
    when: "FIRST MONTH",
    whenM: "FIRST MONTH",
    title: "", // bespoke: base-rent chip + two-line headline (33:368)
    body: "",
    focus: { x: -111.39, y: 7.51, scale: 2.2689, opacity: 1 }, // Figma 33:368 — 4581×2314 @ (−2344,−3), olive layer
    variant: "movein",
    tone: "ink", // the wall reads light at the indicator band
  },
  {
    id: "financed",
    when: "2ND - 11TH MONTH",
    whenM: "FIRST MONTH",
    title: "", // bespoke: headline + Gromor → flent handoff diagram
    body: "",
    // Figma 322:2083 — 2062×1042 @ (−546,−3), the bottom-anchored room
    focus: { x: -22.34, y: 7.51, scale: 1.0213, opacity: 1 },
    variant: "financed",
    tone: "ink",
  },
  {
    id: "monthly",
    when: "2ND - 11TH MONTH",
    whenM: "2-11 MONTHS",
    title: "", // bespoke: headline + tenant → Gromor EMI diagram
    body: "",
    // Figma 322:2152 — identical placement: the camera holds still
    // between the two financing beats; only the story advances
    focus: { x: -22.34, y: 7.51, scale: 1.0213, opacity: 1 },
    variant: "monthly",
    tone: "ink",
  },
  {
    id: "complete",
    when: "END OF 11TH MONTH",
    whenM: "END OF MONTH 11",
    title: "You complete 11 months. You pay for 10.",
    body: "That’s the Flent 11 exchange. You commit to the full stay. We make the terms work harder for you.",
    // Figma 39:309 (2026-07-16 pass) — the camera dives into the room's
    // bottom-right: 3951×1650 anchored bottom-right (−2415, −668). The
    // node carries its OWN darker wide-room fill (/how-bg4.jpg — the
    // 39:310 fill, 1024×429), dissolving in over the olive layer as the
    // window rides the same zoom off the top-left.
    focus: { x: -114.91, y: -51.24, scale: 1.9569, opacity: 1 },
    // iPhone 17 - 6: the phone crop dives deeper into the room's dark
    // right side — the umber evening wall owns the frame (the mobile
    // scrim in the CSS carries the rest of the design's darkness)
    focusM: { x: -160, y: -48, scale: 2.5, opacity: 1 },
    variant: "complete",
    tone: "white",
  },
];

/* the ten EMI cycles — January in focus first, "Next Payment" naming the
   month after; the run closes on "Next Payment November", the stay's
   eleventh month. Each card pays into pane month k+2 (month 1 is free). */
const EMI_MONTHS = [
  ["January", "February"],
  ["February", "March"],
  ["March", "April"],
  ["April", "May"],
  ["May", "June"],
  ["June", "July"],
  ["July", "August"],
  ["August", "September"],
  ["September", "October"],
  ["October", "November"],
] as const;

/* the indicator's intro caption — dot 0 belongs to the journey's start */
const WHEN_START = "START";

/* Journey-indicator dot centres, px in the 1512 frame (Figma 22:283). */
const DOT_X = [230, 578.67, 927.33, 1276];

/* which dot lights for each journey step. dot 0 = START (intro); the two
   financing beats SHARE dot 2 (both Figma frames mark "2ND – 11TH MONTH").
   The inverse (first step per dot) drives click-to-navigate on the dots. */
const DOT_FOR_STEP = [1, 2, 2, 3];

/* ── The pane window (Figma 33:410 — 510×680, 3×4 grid of 170px panes) ──
   Shared by steps 2–4: step 2 shows it zoomed 2.349× (Figma 33:398), step 3
   zooms out to home (935,155), step 4 slides to x 904 and goes glassy.
   Frost/blends are live CSS so they stay crisp through the zoom. Cell (3,2)
   has NO pane — clear glass. */
const WIN = {
  homeX: 935,
  homeY: 155,
  w: 510,
  h: 680,
  // step-2 zoomed placement (Figma 33:398 @ (872.11, 270.72), 2.349×):
  zoom: {
    scale: 1198 / 510,
    xPercent: ((872.11 - 935) / 510) * 100,
    yPercent: ((270.72 - 155) / 680) * 100,
  },
  // journey-start pose (Figma 329:2709 — 410.555 wide @ (1235.72, 175)):
  // the window sits small at the right from the very first frame, then
  // dollies continuously into the month-1 dive.
  intro: {
    scale: 410.555 / 510,
    xPercent: ((1235.72 - 935) / 510) * 100,
    yPercent: ((175 - 155) / 680) * 100,
  },
  // completion pose (Figma 329:2629 — 1198×1597 @ (−568,−907)): the same
  // dive scale as move-in, but exiting top-left so only the window's
  // bottom-right corner (the frosted exit pane) stays on stage.
  corner: {
    scale: 1198.112 / 510,
    xPercent: ((-568 - 935) / 510) * 100,
    yPercent: ((-907 - 155) / 680) * 100,
  },
};

/* The final beat is a held frame: the exit section (margin-top −100vh,
   higher z-index) rides up OVER it — the curtain overlap transition.
   (The pay-upfront act now lives in its own section further down the
   page — final/sections/upfront.) */
const TOTAL_BEATS = 5.5; // 4 steps + the overlap runway, × 100%

/* per-cell [strokeRight, strokeBottom] in Figma px — kept as the grid's
   cell matrix; the strokes themselves render on the mullion layer below */
const PANE_BORDERS: [number, number][][] = [
  [ [5, 5], [5, 5], [0, 5] ],
  [ [5, 5], [5, 5], [0, 5] ],
  [ [5, 5], [5, 5], [0, 3] ],
  [ [5, 0], [3, 0], [0, 0] ],
];

/* Mullion strokes — outside-aligned on the 170 grid (verticals at x
   170/340, horizontals at y 170/340/510), 3px hairlines thinning to 2px
   around the exit pane. The whole grid is ONE svg path: overlapping
   subpaths fill exactly once, so junctions can't crack (independent divs
   round to device pixels separately) or double-paint when translucent. */
const MULL_GRID = [
  "M170 0h3v680h-3z", // vertical 1
  "M340 0h3v510h-3z", // vertical 2
  "M340 510h2v170h-2z", // …thinning beside the exit
  "M0 170h510v3H0z", // horizontal 1
  "M0 340h510v3H0z", // horizontal 2
  "M0 510h340v3H0z", // horizontal 3
  "M340 510h170v2h-170z", // …thinning over the exit
].join(" ");
/* the strokes hugging months 1–2 — lit warm during the upfront act,
   painted over the (near-invisible) hairline grid on their own layer */
const MULL_LIT = ["M170 0h3v170h-3z", "M340 0h3v170h-3z", "M0 170h340v3H0z"].join(" ");
/* the completion window (329:2632) runs 5u strokes with NO exit-pane
   thinning — a full grid swapped in on the final beat (centred on the
   170-lines; one path ⇒ crack-free junctions) */
const MULL_GRID_FINAL = [
  "M167.5 0h5v680h-5z",
  "M337.5 0h5v680h-5z",
  "M0 167.5h510v5H0z",
  "M0 337.5h510v5H0z",
  "M0 507.5h510v5H0z",
].join(" ");
/* label x per column, label top per row — window-local Figma px */
export const LABEL_X = [16, 13, 12];
export const LABEL_Y = [124, 126, 128, 130];

export function PaneWindow({ rent }: { rent: number }) {
  return (
    <div className="how__winclip">
      {/* sharp greenery behind the panes (Figma 33:411) */}
      <img className="how__win-green" src="/how-window-green.png" alt="" aria-hidden />

      {/* pane grid — frost + hover EMI reveal (hover lives on step 3 only) */}
      {PANE_BORDERS.map((row, r) =>
        row.map((_stroke, c) => {
          const idx = r * 3 + c;
          const month = idx + 1;
          const clear = r === 3 && c === 2; // sharp pane, no frost
          const isM1 = idx === 0;
          if (clear)
            /* the exit — clear glass; a door-open marker lands here on the
               final frame (placeholder icon for now) */
            return (
              <div
                key={idx}
                className="how__pane-exit"
                style={{
                  left: `calc(var(--u) * ${c * 170})`,
                  top: `calc(var(--u) * ${r * 170})`,
                }}
                aria-hidden
              >
                {/* clipped slice of the sharp greenery — original quality,
                    never blurred, pixel-aligned with the window's layer */}
                <img className="how__exit-green" src="/how-window-green.png" alt="" />
              </div>
            );
          const isM2 = idx === 1;
          return (
            <div
              key={idx}
              className={`how__pane${isM1 ? " how__pane--m1" : ""}${isM2 ? " how__pane--m2" : ""}`}
              style={{
                left: `calc(var(--u) * ${c * 170})`,
                top: `calc(var(--u) * ${r * 170})`,
              }}
            >
              {/* warm candle-lit wash — upfront act (Figma 151:202/151:203) */}
              {(isM1 || isM2) && (
                <div
                  className={`how__plit${isM2 ? " how__plit--m2" : ""}`}
                  aria-hidden
                />
              )}
              {isM2 && (
                /* month 2 goes free on the upfront offer (Figma 151:220) */
                <div className="how__m2" aria-hidden>
                  <img className="how__m1-flent" src="/how-flent-pane.svg" alt="" />
                  <div className="how__m1 how__m2-block">
                    <span className="how__m1-amt">₹ 0</span>
                    <span className="how__m1-label">month 2</span>
                  </div>
                </div>
              )}
              {isM1 ? (
                /* month 1 — ₹0 (revealed after the window on step 2) +
                   etched flent mark (Figma 35:449 / 36:277) */
                <>
                  <img
                    className="how__m1-flent"
                    src="/how-flent-pane.svg"
                    alt=""
                    aria-hidden
                  />
                  <div className="how__m1">
                    <span className="how__m1-amt">₹ 0</span>
                    <span className="how__m1-label">month 1</span>
                  </div>
                </>
              ) : (
                <>
                  {/* payment flash — pulses as this month's EMI dissolves in */}
                  <span className="how__pflash" data-m={month} aria-hidden />
                  <span
                    className="how__plabel"
                    style={{
                      left: `calc(var(--u) * ${LABEL_X[c]})`,
                      top: `calc(var(--u) * ${LABEL_Y[r]})`,
                    }}
                  >
                    month {month}
                  </span>
                  {/* the rent cycle — lit pane by pane as each EMI card
                      settles here on the monthly beat (322:2189…) */}
                  <span
                    className="how__pamt"
                    data-m={month}
                    style={{
                      left: `calc(var(--u) * ${LABEL_X[c]})`,
                      top: `calc(var(--u) * ${LABEL_Y[r] - 20})`,
                    }}
                    aria-hidden
                  >
                    ₹ {inr(rent)}
                  </span>
                  <BankIcon className="how__pdisc" dataM={month} />
                  {/* hover reveal — EMI + tenant avatar (Figma 36:19 / 39:515) */}
                  <div
                    className="how__preveal"
                    style={{ left: `calc(var(--u) * ${LABEL_X[c]})` }}
                  >
                    <span className="how__preveal-amt">₹ {inr(rent)}</span>
                    <span className="how__preveal-label">month {month}</span>
                  </div>
                  <img
                    className="how__preveal-avatar"
                    src="/how-avatar.png"
                    alt=""
                    aria-hidden
                  />
                </>
              )}
            </div>
          );
        })
      )}

      {/* mullion strokes — their own layer above the glass (a stroke under
          a neighbouring pane's backdrop-filter would smear into the frost);
          overlay-blended with the frosted greenery, like Figma. One path =
          crack-free junctions at any zoom. */}
      <svg
        className="how__mulls"
        viewBox="0 0 510 680"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path className="how__mull-grid" d={MULL_GRID} />
        {/* completion beat: the 5u no-thinning grid takes over — crisp
            full borders around the frosted exit pane */}
        <path className="how__mull-final" d={MULL_GRID_FINAL} />
      </svg>
      <svg
        className="how__mulls how__mulls--lit"
        viewBox="0 0 510 680"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path className="how__mull-lit" d={MULL_LIT} />
      </svg>

      {/* month 1–11 totals — centred in the glass, upfront act only
          (Figma 151:235) */}
      <div className="how__wprice" aria-hidden>
        <span className="how__wprice-label">month 1 - 11</span>
        <span className="how__wprice-amts">
          ₹ {inr(rent * 9)} <s>₹ {inr(rent * 11)}</s>
        </span>
      </div>
    </div>
  );
}

/** The flow wire (174:587/174:758) — white gradient line + arrowhead,
    parametric length so both flows share one drawing. */
/* 252:2420/2436 — the EMI beat's connector: hairline + open chevron,
   solid for the funding drop, dotted for the repayment run. Line centre
   stays at y 3.1367 of the 5.7735 art so the painted-line offsets the
   fin2 wrappers already use keep holding. */
function ArrowWire({
  w,
  dotted,
  dash,
  head = true,
}: {
  w: number;
  dotted?: boolean;
  dash?: string;
  head?: boolean;
}) {
  const y = 3.1367;
  return (
    <svg className="how__tflow-wire" viewBox={`0 0 ${w} 5.7735`} fill="none" aria-hidden>
      <line
        x1="0"
        y1={y}
        x2={head ? w - 4.5 : w}
        y2={y}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray={dash ?? (dotted ? "0.1 4.9" : undefined)}
      />
      {head && (
        <path
          d={`M${w - 6.5} ${y - 2.6}L${w - 1} ${y}L${w - 6.5} ${y + 2.6}`}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/* bank-alt (168:1547) — the little institution mark with the ₹ inside;
   fill rides currentColor (60% opacity baked, per the design) so it
   serves the EMI cards (ink) and the panes (white overlay) alike */
function BankIcon({
  className,
  dataM,
}: {
  className?: string;
  dataM?: number;
}) {
  return (
    <svg
      className={className}
      data-m={dataM}
      viewBox="0 0 14.52 14.592"
      fill="none"
      aria-hidden
    >
      <path
        d="M14.2441 3.648L7.83611 0.144C7.47611 -0.048 7.04411 -0.048 6.68411 0.144L0.276114 3.648C0.0601135 3.768 -0.0358865 4.008 0.0121135 4.248C0.0601135 4.488 0.300114 4.68 0.540114 4.68H1.16411V11.352C0.780114 11.616 0.540114 12.048 0.540114 12.552V13.104C0.540114 13.92 1.21211 14.592 2.02811 14.592H12.4921C13.3081 14.592 13.9801 13.92 13.9801 13.104V12.552C13.9801 12.048 13.7401 11.616 13.3561 11.352V4.68H13.9801C14.2201 4.68 14.4361 4.512 14.5081 4.272C14.5561 4.032 14.4601 3.768 14.2441 3.648ZM7.21211 1.08C7.23611 1.056 7.28411 1.056 7.30811 1.08L11.8681 3.6H2.65211L7.21211 1.08ZM4.50011 11.04V4.68H9.87611V11.064H4.50011V11.04ZM3.42011 4.68V11.064H2.24411V4.68H3.42011ZM12.9241 13.104C12.9241 13.344 12.7321 13.536 12.4921 13.536H2.02811C1.78811 13.536 1.59611 13.344 1.59611 13.104V12.552C1.59611 12.312 1.78811 12.12 2.02811 12.12H12.4921C12.7321 12.12 12.9241 12.312 12.9241 12.552V13.104V13.104ZM12.3001 11.04H10.9561V4.68H12.3001V11.04Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        d="M7.42812 7.3199H6.78012C6.66012 7.3199 6.56412 7.2239 6.56412 7.1039C6.56412 6.9839 6.66012 6.8879 6.78012 6.8879H8.19612C8.48412 6.8879 8.72412 6.6479 8.72412 6.3599C8.72412 6.0719 8.48412 5.8319 8.19612 5.8319H7.86012V5.7119C7.86012 5.4239 7.62012 5.1839 7.33212 5.1839C7.04412 5.1839 6.80412 5.4239 6.80412 5.7119V5.8319C6.08412 5.8319 5.50812 6.4079 5.50812 7.1279C5.50812 7.8479 6.08412 8.4239 6.80412 8.4239H7.45212C7.57212 8.4239 7.66812 8.5199 7.66812 8.6399C7.66812 8.7599 7.57212 8.8559 7.45212 8.8559H6.03612C5.74812 8.8559 5.50812 9.0959 5.50812 9.3839C5.50812 9.6719 5.74812 9.9119 6.03612 9.9119H6.78012V10.0319C6.78012 10.3199 7.02012 10.5599 7.30812 10.5599C7.59612 10.5599 7.83612 10.3199 7.83612 10.0319V9.8399C8.34012 9.6719 8.70012 9.1919 8.70012 8.6159C8.72412 7.8959 8.14812 7.3199 7.42812 7.3199Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  );
}

export function FlowWire({ w, id }: { w: number; id: string }) {
  return (
    <svg className="how__tflow-wire" viewBox={`0 0 ${w} 5.7735`} fill="none" aria-hidden>
      <path
        d={`M${w} 2.88675L${w - 5} 0V5.7735L${w} 2.88675ZM0 2.88675V3.38675H${w - 4.5}V2.88675V2.38675H0V2.88675Z`}
        fill={`url(#${id})`}
      />
      <defs>
        <linearGradient id={id} x1="0" y1="3.38675" x2={String(w)} y2="3.38675" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** The flent app icon (174:585) — black rounded square, white fl mark. */
export default function HowItWorks({
  rent,
  onRentChange,
}: {
  rent: number;
  onRentChange: (rent: number) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const glowRigRef = useRef<HTMLDivElement>(null);
  const frameRigRef = useRef<HTMLDivElement>(null);
  const greenFullRef = useRef<HTMLDivElement>(null);
  const scrimARef = useRef<HTMLDivElement>(null);
  const scrimBRef = useRef<HTMLDivElement>(null);
  const scrimDRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<HTMLDivElement[]>([]);
  const [active, setActive] = useState(-1); // -1 = intro, 0..n = steps
  // the indicator's own (earlier) clock — see the tracker's onUpdate
  const [dotStep, setDotStep] = useState(-1);
  // phone layout? DOT_X spans the 1512 design frame — on the 640-unit
  // mobile frame those coords run past the right edge, so the indicator
  // gets viewport-fitted dot positions instead (12 / 38 / 64 / 90 vw)
  const [mobileInd] = useState(
    () => window.matchMedia("(max-width: 640px)").matches
  );
  // the pane hover-reveal needs a real pointer — on touch, taps would
  // latch :hover and strand the reveal over a pane
  const [canHover] = useState(
    () => window.matchMedia("(hover: hover)").matches
  );
  const dotXs = mobileInd ? [76.42, 238.81, 401.19, 563.58] : DOT_X;
  // the pinned timeline's ScrollTrigger — the break slide's "see how it
  // works" link converts a beat position into a scroll target through it
  const mainSTRef = useRef<ScrollTrigger | null>(null);
  const goToBeat = (beat: number) => {
    const st = mainSTRef.current;
    if (!st) return;
    const t = (beat + 0.42) / TOTAL_BEATS;
    window.scrollTo({
      top: st.start + t * (st.end - st.start),
      behavior: "smooth",
    });
  };
  // clicking a progress dot jumps to that step's settled frame. The START
  // dot (no step maps to it) rewinds to the pinned intro; every other dot
  // goes to the FIRST step that lights it (its settled beat = 0.9 + step).
  const goToDot = (dot: number) => {
    const st = mainSTRef.current;
    if (!st) return;
    const step = DOT_FOR_STEP.indexOf(dot);
    if (step < 0) {
      window.scrollTo({ top: st.start, behavior: "smooth" });
      return;
    }
    goToBeat(0.9 + step);
  };

  /* the rent field — free typing, formatted with Indian grouping. Rent is
     bounded ₹20,000–₹1,00,000: the parent state updates live once the
     typed value is in range (half-typed values never flash through the
     maths) and the text snaps to the clamped figure on commit */
  const RENT_MIN = 20_000;
  const RENT_MAX = 100_000;
  const [rentText, setRentText] = useState(() => inr(rent));
  const onRentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setRentText(digits ? inr(Number(digits)) : "");
    const n = Number(digits);
    if (n >= RENT_MIN) onRentChange(Math.min(RENT_MAX, n));
  };
  const commitRent = () => {
    const raw = Number(rentText.replace(/\D/g, "")) || 45_000;
    const clamped = Math.min(RENT_MAX, Math.max(RENT_MIN, raw));
    onRentChange(clamped);
    setRentText(inr(clamped));
  };
  const onRentKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault(); // a real numeric field: arrows nudge the amount
      const cur = Number(rentText.replace(/\D/g, "")) || 45_000;
      const step = e.shiftKey ? 5_000 : 1_000;
      const next = Math.min(
        RENT_MAX,
        Math.max(RENT_MIN, cur + (e.key === "ArrowUp" ? step : -step))
      );
      setRentText(inr(next));
      onRentChange(next);
    }
  };

  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const bg = bgRef.current!;
    const intro = introRef.current!;
    const rig = rigRef.current!;
    const glowRig = glowRigRef.current!;
    const frameRig = frameRigRef.current!;
    const greenFull = greenFullRef.current!;
    const scrimA = scrimARef.current!;
    const scrimB = scrimBRef.current!;
    const scrimD = scrimDRef.current!;
    const steps = stepRefs.current;
    // glow + frame rigs mirror the window's transforms at stage level so
    // their glow / overlay blend composite against the wall
    const rigs = [rig, glowRig, frameRig];

    /* On phones the window lives bottom-centre in a different box, so the
       Figma zoom placements no longer apply. Both zoomed poses keep the
       top half free for the copy and dive the pane into the free months
       in the BOTTOM half: the window's top edge parks at the half-line
       and the lower months bleed off the bottom of the frame. Same
       transform grammar as WIN (scale from the rig's top-left, offsets
       as % of its unscaled box); offset* metrics ignore transforms, so
       this reads clean before the initial gsap.set below. */
    const mobileLayout = window.matchMedia("(max-width: 640px)").matches;
    const mobilePoses = () => {
      const W = rig.offsetWidth;
      const H = rig.offsetHeight;
      const X = rig.offsetLeft;
      const Y = rig.offsetTop;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // step 2 — dive INTO month one: the free cell itself becomes the
      // subject (~54vw wide), centred, its top just under the half-line;
      // the rest of the grid bleeds off the frame.
      const s1 = Math.min(Math.max((1.28 * vh) / H, 2.4), 3.2);
      const zoom = {
        scale: s1,
        xPercent: ((0.5 * vw - (W * s1) / 6 - X) / W) * 100,
        // the glass rides a touch higher (0.53 → 0.50) so move-in's copy
        // and the month-one cell share the frame evenly
        yPercent: ((0.5 * vh - 0.045 * H * s1 - Y) / H) * 100,
      };
      // completion (iPhone 17 - 6, window 411:678) — the dive renders
      // the window at the design's literal 569.9 frame-px width and
      // parks its bottom-right corner at (309.7, 372.1): exactly the
      // design's four-cell crop, the copy owning the wash below
      const mx = vw / 402;
      const my = vh / 874;
      const s2 = (569.9 * mx) / W;
      const corner = {
        scale: s2,
        xPercent: ((309.7 * mx - W * s2 - X) / W) * 100,
        yPercent: ((372.1 * my - H * s2 - Y) / H) * 100,
      };
      // the onward chevrons centre on the parked EXIT PANE (411:785 —
      // dead-centre of the corner cell), derived from the same pose so
      // they stay centred at any viewport: the rendered pane is a third
      // of the dived window's width, a quarter of its height
      const chev = {
        x: 309.7 * mx - (W * s2) / 6,
        y: 372.1 * my - (H * s2) / 8,
        s: 41.2 * mx,
      };
      /* ── the financing beats' whole column, solved as ONE stack:
         copy → (42) → diagram row → window → (18) → indicator line at
         812. The design's gaps (iPhone 17 - 4/5: sub→row 42, deck→glass
         23) hold at every size; the WINDOW absorbs any squeeze by
         shrinking below its designed 222 width — spacing and legibility
         never give. Copy feet are read via offsets (transform-immune,
         so the steps' hidden y-shift can't skew them). ── */
      const foot = (sel: string) => {
        const el = section.querySelector<HTMLElement>(sel);
        return el ? el.offsetTop + el.offsetHeight : 0;
      };
      const indTop = 812 * my;
      const f3top = Math.max(foot(".how__copy--fin3") + 42, 200 * my);
      const f3subtop = f3top + 344 * mx * 0.239 + 18;
      const montop = Math.max(foot(".how__copy--mon") + 42, 244 * my);
      // the shared rest pose sits below the TALLER beat's stack
      // (fin3 sub ≈ 40 tall + 24 gap; the mon deck runs ≈ 98 + 23 gap)
      const restTopMin = Math.max(f3subtop + 64, montop + 121, 404 * my);
      const s3full = (222 * mx) / W;
      const avail = indTop - 18 - restTopMin;
      const s3 = Math.min(s3full, Math.max((150 * mx) / W, avail / H));
      const restTop = Math.min(restTopMin, indTop - 18 - H * s3);
      // a shrunk window re-centres inside the designed slot
      const restLeft = 83 * mx + (W * (s3full - s3)) / 2;
      const rest = {
        scale: s3,
        xPercent: ((restLeft - X) / W) * 100,
        yPercent: ((restTop - Y) / H) * 100,
      };
      return { zoom, corner, rest, restTop, f3top, f3subtop, montop, chev };
    };
    const MP = mobileLayout ? mobilePoses() : null;
    // CSS reads the solved stack: the flow rows sit exactly where the
    // solver put them, so nothing can overlap by construction
    if (MP) {
      const stack = (m: { restTop: number; f3top: number; f3subtop: number; montop: number }) => {
        section.style.setProperty("--mrest", `${Math.round(m.restTop)}px`);
        section.style.setProperty("--f3top", `${Math.round(m.f3top)}px`);
        section.style.setProperty("--f3subtop", `${Math.round(m.f3subtop)}px`);
        section.style.setProperty("--montop", `${Math.round(m.montop)}px`);
      };
      stack(MP);
      // webfont swap reflows the headlines — restack once settled (the
      // window pose is baked into the timeline; the designed gaps absorb
      // the small drift)
      document.fonts?.ready.then(() => stack(mobilePoses())).catch(() => {});
      // park the onward chevrons dead-centre on the dived exit pane
      gsap.set(section.querySelectorAll(".how__scroll-on"), {
        left: MP.chev.x,
        top: MP.chev.y,
        xPercent: -50,
        yPercent: -50,
        width: MP.chev.s,
        height: MP.chev.s,
      });
    }
    const POSE_ZOOM = MP ? MP.zoom : WIN.zoom;
    const POSE_CORNER = MP ? MP.corner : WIN.corner;

    // snap points get filled in once the timeline is built; the snap
    // callback closes over this array
    const snapPoints: number[] = [];

    const ctx = gsap.context(() => {
      const q = (sel: string) => section.querySelectorAll(sel);

      /* ---- initial states ---- */
      gsap.set(bg, {
        transformOrigin: "0 0",
        xPercent: INTRO_FOCUS.x,
        yPercent: INTRO_FOCUS.y,
        scale: INTRO_FOCUS.scale,
        opacity: INTRO_FOCUS.opacity,
        filter: "blur(0px)",
      });
      gsap.set(intro, { opacity: 1, y: 0 });
      gsap.set(q(".how__bg-b, .how__bg-c"), { opacity: 0 });
      // autoAlpha (not opacity): hidden steps must also drop visibility so
      // they never block the intro's rent input beneath them
      gsap.set(steps, { autoAlpha: 0, y: 28 });
      // window rig(s) are ON STAGE from the first frame (329:2709 — small,
      // far right, month 1 already lit), then dolly continuously into the
      // month-1 dive. --frost scales the pane blur with the zoom (Figma:
      // 5.635px at the small intro pose, 16.445px zoomed, 7px at home)
      // since backdrop-filter ignores ancestor transforms. On phones the
      // window opens at its home box in the bottom half instead.
      const POSE_INTRO = mobileLayout
        ? { scale: 1, xPercent: 0, yPercent: 0 }
        : WIN.intro;
      gsap.set(rigs, {
        transformOrigin: "0 0",
        scale: POSE_INTRO.scale,
        xPercent: POSE_INTRO.xPercent,
        yPercent: POSE_INTRO.yPercent,
        autoAlpha: 1,
      });
      gsap.set(rig, { "--frost": mobileLayout ? "3.83px" : "5.635px" });
      // the intro veil's backdrop blur can't reach the rig in Chromium
      // (the panes' own backdrop-filter output is never re-blurred), so
      // the rig wears the veil's haze itself until the dissolve
      gsap.set(rig, { filter: "blur(2px)" });
      // the veil sits over the window frame's overlay stroke too — the
      // stage-level frame rig can't slide under it, so it wears a touch of
      // the veil's attenuation until the dive lifts it
      gsap.set(frameRig, { autoAlpha: 0.8 });
      gsap.set([scrimA, scrimB], { opacity: 0 });
      gsap.set(scrimD, { autoAlpha: 0 });
      // the candle-lit pieces belong to the upfront section — the shared
      // window keeps them dark here
      gsap.set(q(".how__plit"), { autoAlpha: 0 });
      gsap.set(q(".how__m2"), { autoAlpha: 0, y: 14 });
      gsap.set(q(".how__wprice"), { autoAlpha: 0 });
      // full-bleed greenery: centred cover layer; soft-fade takeover.
      // The container blur is the entry softness — it settles to 0 and the
      // per-copy progressive blur (CSS) remains.
      gsap.set(greenFull, {
        transformOrigin: "50% 50%",
        xPercent: -50,
        yPercent: -50,
        scale: 1.03,
        autoAlpha: 0,
        filter: "blur(12px)",
      });
      // the intro shows a REAL window — plain glass, no monthly markings
      // (329:2709, 2026-07-19 pass); the month furniture arrives with the
      // move-in dive (scrubbed reveal below). The m1 card's white ground
      // and glow ride the is-plain class instead (CSS transitions).
      gsap.set(q(".how__m1, .how__plabel"), { autoAlpha: 0 });
      gsap.set(q(".how__m1"), { y: 0 });
      gsap.set(q(".how__pane--m1 .how__m1-flent"), { autoAlpha: 0 });
      // the financing diagrams assemble on arrival; the panes' rent
      // amounts + no-cost badges light only on the monthly beat
      gsap.set(q(".how__fin3 > *, .how__fin3-sub, .how__mon > *"), { autoAlpha: 0 });
      gsap.set(q(".how__pamt, .how__pdisc"), { autoAlpha: 0 });
      gsap.set(q(".how__scroll-on"), { autoAlpha: 0 });
      // the financing wires draw in on their beats
      gsap.set(q(".how__tflow-wire"), { clipPath: "inset(0 100% 0 0)" });

      const anchors: number[] = [];

      // the frame we last settled on (index into snapPoints). On phones the
      // snap is clamped to ±1 of this, so a fast fling can't blow past the
      // steps — one swipe advances one frame and momentum overshoot is
      // reeled back to the very next step (the story is read in order).
      let settledIdx = 0;
      const nearestIdx = (value: number) => {
        let best = 0;
        for (let i = 1; i < snapPoints.length; i++)
          if (
            Math.abs(snapPoints[i] - value) < Math.abs(snapPoints[best] - value)
          )
            best = i;
        return best;
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${TOTAL_BEATS * 100}%`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          // landing break at each step's settled frame. inertia off so a
          // fast fling still rests at a step instead of coasting ahead —
          // the user is meant to stop at every frame.
          snap: {
            snapTo: (value: number) => {
              if (!snapPoints.length) return value;
              if (mobileLayout) {
                // ── FRAME-BY-FRAME (daylightcomputer-style) ──
                // Any deliberate scroll commits to the ADJACENT frame in
                // that direction — one swipe = one frame. It never snaps
                // back to where it came from (the old "nearest" rule did
                // that whenever a swipe fell short of the next frame's
                // midpoint), and a long fling still only advances one
                // frame. A tiny deadzone keeps a resting settle from
                // drifting off its frame.
                const cur = snapPoints[settledIdx];
                const eps = 0.01;
                if (value > cur + eps)
                  return snapPoints[
                    Math.min(settledIdx + 1, snapPoints.length - 1)
                  ];
                if (value < cur - eps)
                  return snapPoints[Math.max(settledIdx - 1, 0)];
                return cur;
              }
              return snapPoints[nearestIdx(value)];
            },
            inertia: false,
            // a firm, consistent settle so each frame lands cleanly
            duration: mobileLayout
              ? { min: 0.3, max: 0.7 }
              : { min: 0.25, max: 0.7 },
            delay: mobileLayout ? 0.08 : 0.1,
            ease: "power2.out",
            onComplete: () => {
              const st = mainSTRef.current;
              if (st) settledIdx = nearestIdx(st.progress);
            },
          },
        },
      });

      // intro reads first, then lifts away — the veil dissolves with it,
      // handing the room back its full light before the dive. autoAlpha:
      // the lead button must stop existing for clicks once faded.
      tl.to(intro, { autoAlpha: 0, y: -34, duration: 0.5, ease: "power2.in" }, 0.45);
      tl.to(q(".how__iwash"), { autoAlpha: 0, duration: 0.55, ease: "power1.inOut" }, 0.45);
      tl.to(rig, { filter: "blur(0px)", duration: 0.55, ease: "power1.inOut" }, 0.45);
      // hard-clear to none: a resting 0px filter would leave the rig a
      // backdrop root and starve the exit pane's frost of the room behind
      tl.set(rig, { filter: "none" }, 1.01);
      tl.to(frameRig, { autoAlpha: 1, duration: 0.55 }, 0.45);

      STEPS.forEach((step, i) => {
        const anchor = 0.9 + i;
        anchors.push(anchor);

        // dolly the shared background to this step's Figma placement
        // (phones take the step's own crop where one is drawn)
        const focus = (mobileLayout && step.focusM) || step.focus;
        tl.to(
          bg,
          {
            xPercent: focus.x,
            yPercent: focus.y,
            scale: focus.scale,
            opacity: focus.opacity,
            duration: 1,
          },
          anchor - 0.5
        );

        // content in
        tl.to(steps[i], { autoAlpha: 1, y: 0, duration: 0.5 }, anchor - 0.1);

        // content out before the next beat (the exit curtain follows the last)
        tl.to(
          steps[i],
          {
            autoAlpha: 0,
            y: -26,
            // phones clear faster: the shared window's next dolly passes
            // through the diagram band, and a live deck under a moving
            // glass reads as a collision
            duration: mobileLayout ? 0.26 : 0.4,
            ease: "power2.in",
          },
          anchor + 0.55
        );
      });

      // a1 move-in · a2 financed · a3 monthly (camera holds from a2) ·
      // a4 completion
      const [a1, a2, , a4] = anchors;

      // the window dives in BARE — the month sequence, the frost and the
      // ₹0 are dealt on ARRIVAL by the move-in micro (not scrubbed), per
      // the 33:368 storyboard: start-frame glass → months write on →
      // pane one frosts → the first month's gift appears.

      /* ── window rig: on stage from the intro (small, far right), it rides
         the SAME camera move as the room into the month-1 dive — one
         continuous zoom, no fade — then zooms home through the financing
         loop and goes glassy for the completion frame. (Micro animations
         are NOT scrubbed — they play in real time on step arrival, see
         the active-driven effect below.) ── */
      tl.to(
        rigs,
        {
          scale: POSE_ZOOM.scale,
          xPercent: POSE_ZOOM.xPercent,
          yPercent: POSE_ZOOM.yPercent,
          duration: 1,
        },
        a1 - 0.5 // rides the intro→move-in background dolly
      );
      // pane blur at the dive: 16.445 on desktop (329:2634), 8.47 on the
      // phone frame (406:407 — the greens must stay readable at 402w)
      tl.to(
        rig,
        { "--frost": mobileLayout ? "8.47px" : "16.445px", duration: 1 },
        a1 - 0.5
      );
      // the room hands from the door-lit morning to the olive afternoon
      // INSIDE the dive — geometry continuous, texture dissolving mid-air
      tl.to(q(".how__bg-b"), { opacity: 1, duration: 1 }, a1 - 0.5);
      const POSE_REST = MP
        ? MP.rest
        : { scale: 1, xPercent: 0, yPercent: 0 };
      tl.to(
        rigs,
        { ...POSE_REST, duration: 1 },
        a2 - 0.5 // rides the same beat as the background dolly
      );
      // the phone's small panes mush at the desktop frost — the design
      // (iPhone 17 - 5) keeps the resting greens readable
      tl.to(rig, { "--frost": mobileLayout ? "4px" : "7px", duration: 1 }, a2 - 0.5);

      /* ── completion (39:309, 2026-07-16): the camera dives into the
         room's bottom-right — the window rides the SAME zoom off the
         top-left (its bottom-right corner, the frosted exit pane, stays
         on stage) so it reads as one natural zoom into the same image. ── */
      tl.to(
        rigs,
        {
          scale: POSE_CORNER.scale,
          xPercent: POSE_CORNER.xPercent,
          yPercent: POSE_CORNER.yPercent,
          duration: 1,
        },
        a4 - 0.5 // rides the background dolly into the corner
      );
      // the room hands to the completion's darker evening rendition
      // inside the dive (39:310's own fill)
      tl.to(q(".how__bg-c"), { opacity: 1, duration: 1 }, a4 - 0.5);
      // pane frost holds the design's literal 16.445 at the corner dive
      // (329:2634… — the leafy structure stays readable through it).
      // Phone: iPhone 17 - 6's panes carry radius 15.645 ⇒ 7.82px CSS —
      // the leaves keep their bokeh structure instead of smearing flat
      tl.to(
        rig,
        { "--frost": mobileLayout ? "7.82px" : "16.445px", duration: 1 },
        a4 - 0.5
      );

      // dark gradient scrims: move-in's top wash (34:442), the financing
      // loop's blur-graded wash (252:2354 — blur masked to fade with the
      // gradient), completion's deep green wash (39:311)
      tl.to(scrimA, { opacity: 1, duration: 0.5 }, a1 - 0.5);
      tl.to(scrimA, { opacity: 0, duration: 0.5 }, a2 - 0.5);
      // the blur-graded wash holds across BOTH financing beats
      tl.to(scrimD, { autoAlpha: 1, duration: 0.6 }, a2 - 0.5);
      tl.to(scrimD, { autoAlpha: 0, duration: 0.6 }, a4 - 0.5);
      tl.to(scrimB, { opacity: 1, duration: 0.9, ease: "power1.inOut" }, a4 - 0.5);

      // hold the final frame through the overlap runway so beats keep
      // mapping 1:1 to viewport-heights of scroll (the exit section slides
      // over during the hold)
      tl.set({}, {}, TOTAL_BEATS);

      mainSTRef.current = tl.scrollTrigger ?? null;

      // snap targets: intro rest + every settled frame + release
      const total = tl.duration();
      snapPoints.push(0, ...anchors.map((a) => (a + 0.42) / total), 1);

      // active-beat tracking, decoupled from the scrubbed timeline
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${TOTAL_BEATS * 100}%`,
        onUpdate: (self) => {
          const t = self.progress * total;
          // TWO clocks: the INDICATOR flips early (a−0.45, the moment
          // the previous copy starts leaving) so the dots lead the
          // story; the MICRO trigger flips late (a−0.1, the step nearly
          // settled) so arrival animations — and the mon beat's landed
          // payments — are never reset while their step is still on
          // screen
          let dotIdx = -1;
          let idx = -1;
          anchors.forEach((a, i) => {
            if (t >= a - 0.45) dotIdx = i;
            if (t >= a - 0.1) idx = i;
          });
          setDotStep(dotIdx);
          setActive(idx);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* ── micro animations — play in real time when a step is arrived at
     (decoupled from the scrub so the snap can park the scroll while these
     finish). Each entry resets its pieces, so re-visits replay. ── */
  const microRef = useRef<gsap.core.Timeline | null>(null);
  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);
    microRef.current?.kill();
    const m = gsap.timeline({ defaults: { ease: "power2.out" } });
    microRef.current = m;

    // clear pieces a killed mid-sequence timeline may have left behind
    if (active !== 2) {
      // the rent cycles belong to the monthly beat alone
      m.set(q(".how__pamt, .how__pdisc"), { autoAlpha: 0 }, 0);
      gsap.set(q(".how__pflash"), { opacity: 0 });
    }

    /* the window's story pieces — plabels, the m1 frost (held plain by
       .is-m1wait while the labels write on) and the ₹0 card. Settled in
       one stroke for any beat past move-in; cleared back to bare glass
       for the intro. */
    const storyRigs = () =>
      section.querySelectorAll(".how__winrig, .how__glowrig");
    const settleWindowStory = (labelsOn: boolean) => {
      storyRigs().forEach((r) => r.classList.remove("is-m1wait"));
      m.set(q(".how__plabel"), { autoAlpha: labelsOn ? 1 : 0 }, 0)
        .set(q(".how__m1"), { autoAlpha: 1, y: 0 }, 0)
        .set(q(".how__pane--m1 .how__m1-flent"), { autoAlpha: 0.45 }, 0);
    };

    if (active < 0) {
      // intro — the start frame's window is bare glass
      storyRigs().forEach((r) => r.classList.remove("is-m1wait"));
      m.set(q(".how__plabel, .how__m1"), { autoAlpha: 0 }, 0).set(
        q(".how__pane--m1 .how__m1-flent"),
        { autoAlpha: 0 },
        0
      );
    } else if (active === 0) {
      // move-in (33:368 storyboard) — the dive lands on bare glass, the
      // month sequence writes itself on, THEN pane one frosts over and
      // the first month's ₹0 settles onto it
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        settleWindowStory(true);
      } else {
        // phones hide the month labels (display:none) — staggering them
        // would only stall the frost + ₹0 behind ~2s of invisible writing
        const labelsAct = !window.matchMedia("(max-width: 640px)").matches;
        storyRigs().forEach((r) => r.classList.add("is-m1wait"));
        m.set(q(".how__plabel"), { autoAlpha: 0 }, 0)
          .set(q(".how__m1"), { autoAlpha: 0, y: 6 }, 0)
          .set(q(".how__pane--m1 .how__m1-flent"), { autoAlpha: 0 }, 0);
        // 1 · the months write themselves onto the glass, in sequence
        if (labelsAct)
          m.to(
            q(".how__plabel"),
            { autoAlpha: 1, duration: 0.35, stagger: 0.09 },
            0.45
          );
        // 2 · pane one frosts over (the pane's own transition carries it)
        m.add(() => {
          storyRigs().forEach((r) => r.classList.remove("is-m1wait"));
        }, labelsAct ? "+=0.2" : 0.3)
          // 3 · the first month's gift appears on the frost
          .to(
            q(".how__pane--m1 .how__m1-flent"),
            { autoAlpha: 0.45, duration: 0.45 },
            "+=0.4"
          )
          .to(q(".how__m1"), { autoAlpha: 1, y: 0, duration: 0.5 }, "<0.08");
      }
    } else if (active === 1) {
      // financed upfront (322:2083) — Gromor lands, the wire carries the
      // ten months' figure across, flent receives it with a glow; the
      // trade line signs it off
      settleWindowStory(true); // in case move-in was skipped
      m.set(q(".how__fin3 > *, .how__fin3-sub"), { autoAlpha: 0 })
        .set(q(".how__fin3-gromor, .how__fin3-flent"), { y: 12 })
        .set(q(".how__fin3 .how__tflow-wire"), { clipPath: "inset(0 100% 0 0)" })
        .to(q(".how__fin3-gromor"), { autoAlpha: 1, y: 0, duration: 0.45 }, 0.55)
        .to(q(".how__fin3-w1"), { autoAlpha: 1, duration: 0.01 }, 0.95)
        .to(
          q(".how__fin3-w1 .how__tflow-wire"),
          { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power1.inOut" },
          0.95
        )
        .to(q(".how__fin3-amt"), { autoAlpha: 1, duration: 0.4 }, 1.3)
        .to(q(".how__fin3-w2"), { autoAlpha: 1, duration: 0.01 }, 1.6)
        .to(
          q(".how__fin3-w2 .how__tflow-wire"),
          { clipPath: "inset(0 0% 0 0)", duration: 0.35, ease: "power1.inOut" },
          1.6
        )
        .to(
          q(".how__fin3-flent"),
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" },
          1.9
        )
        .to(q(".how__fin3-sub"), { autoAlpha: 1, duration: 0.5 }, 2.35);
    } else if (active === 2) {
      /* monthly no-cost EMI (322:2152) — the diagram assembles, then the
         PAYMENT CYCLE plays out in full: each month's card takes focus,
         pays down the wire, and settles into its own pane in the glass
         (which lights its ₹ and bank mark as the card melts into the
         frost); the deck advances a step and Gromor's received total
         climbs. Ten cycles, January → "Next Payment November" —
         deliberately unhurried, the story is meant to be absorbed. */
      const DEPTHS = [
        { y: 0, s: 1, a: 1, b: 0 },
        { y: 36, s: 0.8, a: 0.55, b: 1.2 },
        { y: 65.9, s: 0.64, a: 0.3, b: 2.2 },
        { y: 89.26, s: 0.512, a: 0.1, b: 3 },
      ];
      const monEl = section.querySelector<HTMLElement>(".how__mon");
      const cards = [
        ...section.querySelectorAll<HTMLElement>(".how__mon-card[data-emi]"),
      ].sort((a, b) => Number(a.dataset.emi) - Number(b.dataset.emi));
      const done = section.querySelector<HTMLElement>(".how__mon-done");
      const gsum = section.querySelector<HTMLElement>(".how__mon-gsum");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // the diagram's local design unit (its --u rescopes on phones)
      const u = monEl ? monEl.getBoundingClientRect().width / 672 : 1;

      /* reset immediately (not via the timeline) so the flight paths can
         be measured from the settled front-slot pose */
      settleWindowStory(true); // in case move-in was skipped
      gsap.set(q(".how__mon > *"), { autoAlpha: 0 });
      gsap.set(q(".how__mon-tenant, .how__mon-gromor"), { y: 12 });
      gsap.set(q(".how__mon .how__tflow-wire"), { clipPath: "inset(0 100% 0 0)" });
      gsap.set(q(".how__pamt"), { autoAlpha: 0, y: 6 });
      gsap.set(q(".how__pdisc"), { autoAlpha: 0, scale: 0.6, transformOrigin: "50% 50%" });
      gsap.set(q(".how__pflash"), { opacity: 0 });
      cards.forEach((c, k) => {
        const d = DEPTHS[Math.min(k, 3)];
        gsap.set(c, {
          x: 0,
          y: d.y * u,
          scale: d.s,
          filter: `blur(${d.b}px)`,
          autoAlpha: 0,
          zIndex: "auto",
        });
      });
      if (done) gsap.set(done, { x: 0, y: 0, scale: 0.92, autoAlpha: 0 });
      if (gsum) gsum.textContent = "₹ 0";

      if (reduce) {
        // the settled story, no motion — every cycle paid, the closing
        // card resting in the front slot
        gsap.set(q(".how__mon > *"), { autoAlpha: 1, y: 0 });
        cards.forEach((c) => gsap.set(c, { autoAlpha: 0 }));
        if (done) gsap.set(done, { autoAlpha: 1, scale: 1 });
        gsap.set(q(".how__mon .how__tflow-wire"), { clipPath: "inset(0 0% 0 0)" });
        gsap.set(q(".how__pamt"), { autoAlpha: 1, y: 0 });
        gsap.set(q(".how__pdisc"), { autoAlpha: 1, scale: 1 });
        if (gsum) gsum.textContent = `₹ ${inr(rent * cards.length)}`;
      } else {
        // ── assembly ──
        m.to(q(".how__mon-tenant"), { autoAlpha: 1, y: 0, duration: 0.45 }, 0.55)
          .to(q(".how__mon-wire"), { autoAlpha: 1, duration: 0.01 }, 0.95)
          .to(
            q(".how__mon-wire .how__tflow-wire"),
            { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" },
            0.95
          );
        cards.slice(0, 4).forEach((c, k) =>
          m.to(c, { autoAlpha: DEPTHS[k].a, duration: 0.4 }, 1.15 + k * 0.12)
        );
        m.to(
          q(".how__mon-gromor"),
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" },
          1.7
        );

        // ── the payment cycles ──
        // one card at a time (never a scatter): the front card drifts toward
        // its pane and DISSOLVES on the way — blur builds and opacity falls
        // so it melts to nothing in the open room, SHORT of the glass, and
        // the window never clips a hard card edge. As it fades, the target
        // pane FLASHES (payment made) and settles showing the ₹ it now holds.
        const STEP = 1.0; // seconds between cycles — barely overlapping
        // phones stack the deck ABOVE the glass — the flight runs on the
        // vertical axis there, not the desktop's sideways drift
        const vertFlight = window.matchMedia("(max-width: 640px)").matches;
        cards.forEach((card, k) => {
          const T = 2.6 + k * STEP;
          const paneMonth = k + 2; // month 1 is the free one
          const amt = section.querySelector<HTMLElement>(`.how__pamt[data-m="${paneMonth}"]`);
          const disc = section.querySelector<HTMLElement>(`.how__pdisc[data-m="${paneMonth}"]`);
          const pane = amt?.closest<HTMLElement>(".how__pane");
          if (!pane) return;
          const flash = pane.querySelector<HTMLElement>(".how__pflash");
          // Desktop: the frame would clip a card that crossed into the
          // window, so it stops SHORT of the glass and dissolves in the
          // open room, capped at the window's NEAR edge while keeping
          // the heading toward the pane. Phones: the deck floats straight
          // ABOVE the glass and the window rig paints OVER the steps, so
          // a diving card slides UNDER the frost and the pane's own
          // backdrop blur soaks it up — no cap needed: it travels the
          // WHOLE way down onto its pane and dissolves there.
          // Aim LAZILY (function-based values, evaluated at each
          // flight's own start), and from the flying card's OWN rect —
          // by then it holds the front slot with the step's entrance
          // y-shift long settled. Measuring either end at micro start
          // baked in ~30px of entrance/dolly offset and the card melted
          // visibly short of its pane.
          const aim = () => {
            const pr = pane.getBoundingClientRect();
            const sr = card.getBoundingClientRect();
            const slotCx = sr.left + sr.width / 2;
            const slotCy = sr.top + sr.height / 2;
            const paneCx = pr.left + pr.width / 2;
            const paneCy = pr.top + pr.height / 2;
            if (vertFlight)
              return {
                dx: paneCx - slotCx,
                // + the scale-origin correction: the flight shrinks to
                // 0.6 around 50% 0, which lifts the rendered centre by
                // (1−0.6)·h/2 — without it the card melts a third high
                dy: paneCy - slotCy + (1 - 0.6) * (sr.height / 2),
              };
            const winLeft = pr.left - ((paneMonth - 1) % 3) * pr.width;
            const capX = Math.min(paneCx, winLeft - pr.width * 0.35);
            const dx = capX - slotCx;
            return { dx, dy: (paneCy - slotCy) * (dx / (paneCx - slotCx)) };
          };

          // the drift + dissolve. Desktop melts FAST — blur builds and
          // opacity drops quickly so the card is gone well before the
          // glass; nothing hard-edged ever reaches the window to be
          // clipped. The phone's card TRAVELS first — it holds visible
          // for most of the dive and only dissolves as it arrives on its
          // pane (the frost soaks up what's left).
          m.to(
            card,
            {
              x: () => aim().dx,
              y: () => aim().dy,
              scale: 0.6,
              // the phone's card stays readable through the dive — the
              // desktop's 20px melt blooms it into a white smear
              filter: `blur(${vertFlight ? 10 : 20}px)`,
              zIndex: 2,
              duration: 0.85,
              ease: "sine.out",
            },
            T
          ).to(
            card,
            { autoAlpha: 0, duration: 0.42, ease: "power1.in" },
            T + (vertFlight ? 0.45 : 0.12)
          );

          // the pane FLASHES as the payment lands — a bright bloom that
          // snaps on and clears fast, then the ₹ it now carries settles
          // in. On phones the landing is when the card actually reaches
          // the pane (~T+0.75), not the desktop's early melt-point.
          const HIT = vertFlight ? 0.72 : 0.48;
          if (flash)
            m.add(() => {
              gsap.fromTo(
                flash,
                { opacity: 1 },
                { opacity: 0, duration: 0.6, ease: "power2.out" }
              );
            }, T + HIT);
          if (amt)
            m.to(amt, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power1.out" }, T + HIT + 0.06);
          if (disc)
            m.to(disc, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power2.out" }, T + HIT + 0.12);

          // Gromor's received total climbs with each payment
          if (gsum)
            m.add(() => {
              gsum.textContent = `₹ ${inr(rent * (k + 1))}`;
              gsap.fromTo(gsum, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: "power2.out" });
            }, T + HIT + 0.18);

          // the deck settles forward the INSTANT this card starts its
          // flight — so the next card pulls into focus immediately behind
          // it, not after it has dissolved. Snappy (0.5s) so the new front
          // card is fully sharp well before its own departure at T+STEP,
          // giving it a clean beat in focus (and never fighting that
          // departure tween, which used to overlap the slow advance).
          for (let j = k + 1; j <= Math.min(k + 4, cards.length - 1); j++) {
            const d = DEPTHS[Math.min(j - k - 1, 3)];
            const next = cards[j];
            m.to(
              next,
              {
                y: d.y * u,
                scale: d.s,
                autoAlpha: d.a,
                filter: `blur(${d.b}px)`,
                duration: 0.5,
                ease: "sine.inOut",
              },
              T + 0.05
            );
          }
        });

        // …and once November's rent is spoken for, the closing card
        // settles into the empty slot: every EMI paid
        if (done)
          m.to(
            done,
            { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.3)" },
            2.6 + (cards.length - 1) * STEP + 1.4
          );
      }
    } else if (active === 3) {
      // completion — the grid rests wordless (labels off); the way
      // onward glows in
      settleWindowStory(false);
      m.set(q(".how__scroll-on"), { autoAlpha: 0 }).to(
        q(".how__scroll-on"),
        { autoAlpha: 1, duration: 0.5 },
        0.9
      );
    }

    return () => {
      m.kill();
    };
    // `rent` is read only for Gromor's running total; it can't change on
    // this beat (the inline field lives on move-in), and re-running the
    // 15s payment cycle on a rent edit would be worse than a stale sum
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // financed shares the FIRST MONTH dot on phones (iPhone 17 - 4).
  // Everything the INDICATOR shows rides the early dotStep clock; the
  // stage's own states (finalCls, micro) stay on the settled `active`.
  const dotMap = mobileInd ? [1, 1, 2, 3] : DOT_FOR_STEP;
  const dotIdx =
    dotStep < 0 ? 0 : dotMap[Math.min(dotStep, dotMap.length - 1)];
  const activeX = dotXs[dotIdx];
  const finalCls = active === 3 ? " is-final" : "";
  const plainCls = active < 0 ? " is-plain" : "";
  const stepIdx = Math.min(Math.max(active, 0), STEPS.length - 1);
  const dotStepIdx = Math.min(Math.max(dotStep, 0), STEPS.length - 1);

  return (
    <section className="how" ref={sectionRef}>
      <div className="how__stage">
        {/* shared background — dollied by scroll. Two renditions ride the
            one transform: the door-lit morning (intro) dissolves into the
            olive afternoon inside the move-in dive. */}
        <div className="how__bg" ref={bgRef}>
          <img src={BG} alt="" aria-hidden />
          <img className="how__bg-b" src="/how-bg3.jpg" alt="" aria-hidden />
          <img className="how__bg-c" src="/how-bg4.jpg" alt="" aria-hidden />
        </div>

        {/* full-bleed greenery — soft takeover on step 4 (Figma 39:383),
            progressive blur: frosted top melting into crisp bokeh below */}
        <div className="how__green-full" ref={greenFullRef} aria-hidden>
          <img className="how__gf-base" src="/how-window-green.png" alt="" />
          <img className="how__gf-blur" src="/how-window-green.png" alt="" />
        </div>

        {/* dark gradient scrims — step 2 (34:442) and steps 3–4 (36:307/39:311) */}
        <div className="how__scrim how__scrim--a" ref={scrimARef} aria-hidden />
        <div className="how__scrim how__scrim--b" ref={scrimBRef} aria-hidden />
        {/* the financing loop's wash — gradient AND its backdrop blur fade
            together via the mask (Figma 252:2354: bg-blur through a
            gradient fill; CSS backdrop-filter needs the mask to match) */}
        <div className="how__scrim how__scrim--d" ref={scrimDRef} aria-hidden />

        {/* ₹0 pane glow — behind the glass, spilling onto the wall (35:447) */}
        <div className={`how__glowrig${finalCls}${plainCls}`} ref={glowRigRef} aria-hidden>
          <div className="how__m1-glow" />
        </div>

        {/* contain-fit 1512×982 design frame — content lives inside */}
        <div className="how__frame">
          {/* step frames (stacked, cross-faded) */}
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`how__step how__step--${step.variant}`}
              ref={(el) => {
                if (el) stepRefs.current[i] = el;
              }}
            >
              {step.variant === "movein" ? (
                /* ── Figma Frame 4 (33:368, 2026-07-19 pass) — white copy,
                   vertically centred at 50%−90: the base-rent chip (still
                   the editable fill-in-the-blank), the two-line headline,
                   the deposit note ── */
                <div className="how__copy how__copy--movein">
                  <label className="how__rentchip" htmlFor="how-rent">
                    Your base rent&nbsp;-&nbsp;
                    <span className="how__rentfield-rupee" aria-hidden>
                      ₹
                    </span>
                    <span className="how__rentfield-sizer">
                      <span aria-hidden>{rentText || "45,000"}</span>
                      <input
                        id="how-rent"
                        className="how__rentfield-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="45,000"
                        size={1}
                        value={rentText}
                        onChange={onRentInput}
                        onBlur={commitRent}
                        onKeyDown={onRentKey}
                        aria-label="Monthly rent in rupees"
                      />
                    </span>
                  </label>
                  <h3 className="how__title">
                    You move-in.
                    <br />
                    <strong>Your first month is on us.</strong>
                  </h3>
                  <p className="how__body">
                    For the first month - you pay nothing! You only pay the
                    standard 3-month deposit to complete your booking.
                  </p>
                </div>
              ) : step.variant === "financed" ? (
                /* ── Figma 322:2083 — financed upfront: Gromor hands the
                   ten months' rent to flent in one piece ── */
                <>
                  <div className="how__copy how__copy--fin3">
                    <h3 className="how__title how__title--fin3">
                      Your remaining 10 months’{" "}
                      <br />
                      rent is financed <strong>upfront</strong>.
                    </h3>
                  </div>
                  <div className="how__fin3" aria-hidden>
                    <div className="how__fin3-gromor">
                      <span className="how__fin3-gtile">
                        <span className="how__fin3-gcrop">
                          <img src="/trust-gromor-logo.png" alt="" />
                        </span>
                      </span>
                      <span className="how__fin3-tlabel">
                        Gromor
                        <br />
                        Finance
                      </span>
                    </div>
                    <span className="how__fin3-w1">
                      <ArrowWire w={116} dash="2 2" head={false} />
                    </span>
                    <div className="how__fin3-amt">
                      <strong>₹ {inr(rent * 10)}</strong>
                      <s>₹ {inr(rent * 11)}</s>
                    </div>
                    <span className="how__fin3-w2">
                      <ArrowWire w={87} dash="2 2" />
                    </span>
                    <div className="how__fin3-flent">
                      <span className="how__fin3-ftile">
                        {/* the flent mark (322:2141) on its glowing tile */}
                        <svg viewBox="56 53 28 34" aria-hidden>
                          <path
                            d="M71.0756 53C62.565 53 57.257 59.8871 59.194 66.6087L56 66.6203V70.9436H59.1997V87H66.5046V70.9436H72.1698V66.5797H69.5786C65.9876 66.5797 63.9135 64.5472 63.9135 61.7076C63.9135 59.3354 66.2761 57.5033 68.953 57.5033C74.9324 57.5033 76.695 62.7442 76.695 62.7442V87H84V59.1903C82.3402 56.9952 77.7692 53 71.0756 53Z"
                            fill="#1b1b1b"
                          />
                        </svg>
                      </span>
                      <span className="how__fin3-tlabel">Flent</span>
                    </div>
                  </div>
                  <p className="how__fin3-sub">
                    We get the rent early; you get month one free.{" "}
                    <strong>That’s the trade working.</strong>
                  </p>
                </>
              ) : step.variant === "monthly" ? (
                /* ── Figma 322:2152 (2026-07-16 redesign) — the tenant pays
                   January's EMI to Gromor; the months to come wait in a
                   receding deck behind it ── */
                <>
                  <div className="how__copy how__copy--mon">
                    <h3 className="how__title how__title--mon">
                      You pay monthly no-cost EMI{" "}
                      <br />
                      <strong>just like your regular rent cycle.</strong>
                    </h3>
                    <p className="how__mon-sub">
                      You repay the financed rent as a no-cost EMI.{" "}
                      <strong>We cover the interest</strong>.
                    </p>
                  </div>
                  <div className="how__mon" aria-hidden>
                    <span className="how__mon-wire">
                      <ArrowWire w={467} dash="2 2" />
                    </span>
                    <div className="how__mon-tenant">
                      <img src="/how-tenant.png" alt="" />
                      <span>Flent Tenant</span>
                    </div>
                    {/* the EMI deck (344:2794…2846) — all ten cycles
                        stacked, January in focus. Reverse DOM order keeps
                        whichever month is EARLIEST painting on top, so the
                        deck stays correct as the micro cycles it forward.
                        Depth poses (y/scale/opacity/blur) are driven by
                        the beat's timeline. */}
                    {EMI_MONTHS.map((_, i) => {
                      const k = EMI_MONTHS.length - 1 - i;
                      const [month, next] = EMI_MONTHS[k];
                      return (
                        <div
                          key={month}
                          className="how__mon-card"
                          data-emi={k}
                        >
                          <span className="how__mon-card-head">
                            Next Payment <strong>{next}</strong>
                          </span>
                          <strong className="how__mon-card-amt">
                            ₹ {inr(rent)}
                          </strong>
                          <span className="how__mon-card-label">
                            {month} Rent EMI
                          </span>
                          <BankIcon className="how__mon-card-bank" />
                        </div>
                      );
                    })}
                    {/* the closing card — rises into the front slot once
                        the last cycle settles into the glass */}
                    <div className="how__mon-card how__mon-done" aria-hidden>
                      <svg
                        className="how__mon-done-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M7.6 12.3l2.9 2.9 5.9-6.3" />
                      </svg>
                      <strong className="how__mon-done-title">
                        EMIs fully paid
                      </strong>
                      <span className="how__mon-done-sub">
                        10 of 10 · ₹ {inr(rent * 10)}
                      </span>
                    </div>
                    <div className="how__mon-gromor">
                      <span className="how__mon-gtile">
                        <span className="how__mon-gcrop">
                          <img src="/trust-gromor-logo.png" alt="" />
                        </span>
                      </span>
                      <span className="how__mon-gname">Gromor</span>
                      <span className="how__mon-gsum">₹ {inr(rent * 2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* ── Figma Frame 6 (39:309) — white copy over full-bleed
                   green; the chevrons walk you on to the exit terms ── */
                <>
                  <div className="how__copy how__copy--scaffold how__copy--complete">
                    <h3 className="how__title">{step.title}</h3>
                    <p className="how__body">{step.body}</p>
                  </div>
                  {/* chevrons-right (329:2661) — a DECORATIVE "onward" hint
                      resting in the frosted exit pane; not clickable, you
                      simply keep scrolling on into the exit terms */}
                  <div className="how__scroll-on" aria-hidden>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 17l5-5-5-5" />
                      <path d="M13 17l5-5-5-5" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* pane window glass — hover armed on step 3 only; glassy white
              (no EMI) once the greenery is full bleed */}
          <div
            className={`how__winrig${active === 2 && canHover ? " is-hoverable" : ""}${finalCls}${plainCls}`}
            ref={rigRef}
          >
            <PaneWindow rent={rent} />
          </div>

        </div>

        {/* wooden frame — INSIDE stroke (Figma 33:412 / 39:471) at stage
            level so its overlay blend melds with the wall's lighting */}
        <div className={`how__framerig${finalCls}`} ref={frameRigRef} aria-hidden>
          <div className="how__winframe" />
        </div>

        {/* the intro's white veil (329:2749) — a STAGE layer so it washes
            the full viewport: the room's bleed, the window (and its
            off-frame overhang) and both blend rigs; its 2px backdrop blur
            fades with the gradient (one mask drives both). The copy and
            indicator ride a twin frame ABOVE it, per the design's layer
            order. It lifts as the journey begins. */}
        <div className="how__iwash" aria-hidden />

        <div className="how__frame how__frame--over">
          {/* intro frame — Figma 329:2687: the commitment reframed, the
              free-month statement over the veiled room. "Here's how it
              works »" leads into the dive. */}
          <div className="how__intro" ref={introRef}>
            <div className="how__intro-copy">
              <p className="how__intro-kicker">
                Flent 11 does not remove the 11-month commitment.{" "}
                <br />
                It changes what that commitment gets you.
              </p>
              <p className="how__intro-state">
                <em>Your first month is free.</em>
                Your rent starts from month two.
              </p>
            </div>
            <button
              type="button"
              className="how__intro-lead"
              onClick={() => goToBeat(0.9)}
            >
              Here’s how it works
              <svg
                className="how__intro-chev"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 17l5-5-5-5" />
                <path d="M13 17l5-5-5-5" />
              </svg>
            </button>
          </div>

          {/* journey indicator — Figma 22:286; colours flip ink/white with
              each step's settled backdrop so the caption, track and dots
              stay legible */}
          <img
            className={`how__mbrand${active >= 0 && STEPS[stepIdx].tone === "white" ? " is-white" : ""}`}
            src="/hero-flent11.svg"
            alt=""
            aria-hidden
          />
          <div
            className={`how__indicator${dotStep < STEPS.length ? " is-live" : ""}${dotStep >= 0 && STEPS[dotStepIdx].tone === "white" ? " is-white" : ""}`}
          >
            <span
              className="how__when"
              style={{
                // on phones the centre clamps inside the margins so the
                // edge dots' captions never wrap against the screen edge
                left: mobileInd
                  ? `clamp(56px, calc(var(--u) * ${activeX}), calc(100vw - 56px))`
                  : `calc(var(--u) * ${activeX})`,
              }}
            >
              {dotStep < 0
                ? WHEN_START
                : mobileInd
                  ? STEPS[dotStepIdx].whenM
                  : STEPS[dotStepIdx].when}
            </span>
            <div className="how__track" />
            {/* width reaches back to the viewport's left edge (50vw − 50%
                spans the contain-fit frame's side margin). Desktop carries
                the design's 8u nub past the dot; the phone frame (405:372
                — Vector 3 w 48 = dot-1 centre) ends EXACTLY on it. */}
            <div
              className="how__progress"
              style={{
                width: `calc(50vw - 50% + var(--u) * ${activeX + (mobileInd ? 0 : 8)})`,
              }}
            />
            {dotXs.map((x, i) => {
              // dot 0 has no step (the intro); the rest label from their
              // first step's caption ("Go to FIRST MONTH", etc.)
              const step = dotMap.indexOf(i);
              const label = step < 0 ? WHEN_START : STEPS[step].when;
              return (
                <button
                  key={i}
                  type="button"
                  className={`how__dot${i === dotIdx && dotStep < STEPS.length ? " is-active" : ""}`}
                  style={{ left: `calc(var(--u) * ${x})` }}
                  onClick={() => goToDot(i)}
                  aria-label={`Go to ${label}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
