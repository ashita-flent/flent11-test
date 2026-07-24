import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PaneWindow, LABEL_X, LABEL_Y, inr } from "../how/HowItWorks";
import "../how/how.css";
import "./upfront.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Upfront — the pay-upfront offer (Figma 207:200, redesigned 2026-07-21).

   The offer sits on the shared cream ground that flows on into the FAQ:
     "Prefer to skip the financing entirely? / Pay upfront and get 2 months off"
   over a rounded PREVIEW CARD — a darkened, blurred crop of the candle-lit
   detail scene with "See how it works →". Clicking it EXPANDS the card to
   full-bleed: the clip opens, the dim clears, and the detail tells its
   story (the tenant pays Flent the discounted upfront price for the whole
   stay). "Not for you? Keep scrolling" walks on.

   The card is a CLIP WINDOW onto one full-scale scene — expanding is just
   the clip opening from the card rect to the whole viewport, so the window
   and its panes never have to scale.
   ──────────────────────────────────────────────────────────────────────── */

/* the preview card's rect, in viewport px, at reveal t (0 collapsed → 1
   full-bleed). Centred on the viewport so the clip opens symmetrically and
   the scene never shifts under it. */
const CARD_W = 1324; // 207:200 · 502:1046
const CARD_H = 809;
const clipAt = (t: number) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // phones keep the OLD full-bleed offer (Figma 418:865) — the scene fills
  // the screen at rest, so there's no card to grow; open just clears the
  // dim. The card-expand is desktop-only.
  if (vw <= 640) return "inset(0px round 0px)";
  const u = Math.min(vw / 1512, vh / 982);
  const cardW = Math.min(CARD_W * u, 0.92 * vw);
  const cardH = Math.min(CARD_H * u, 0.9 * vh);
  const hx = ((vw - cardW) / 2) * (1 - t);
  const vy = ((vh - cardH) / 2) * (1 - t);
  const r = 60 * u * (1 - t);
  return `inset(${vy}px ${hx}px ${vy}px ${hx}px round ${r}px)`;
};

export default function Upfront({ rent }: { rent: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const glowRigRef = useRef<HTMLDivElement>(null);
  const frameRigRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;
  const swapRef = useRef<gsap.core.Timeline | null>(null);
  const hadOpenRef = useRef(false);

  const goOnward = () => {
    const s = sectionRef.current!;
    window.scrollTo({ top: s.offsetTop + s.offsetHeight, behavior: "smooth" });
  };

  /* ── mount: dress the candle-lit window, park the clip collapsed, wire
     the scroll-in reveal + the full-viewport parking snap ── */
  useLayoutEffect(() => {
    const section = sectionRef.current!;
    const scene = sceneRef.current!;
    const rigs = [rigRef.current!, glowRigRef.current!, frameRigRef.current!];
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const ctx = gsap.context(() => {
      const q = (sel: string) => section.querySelectorAll(sel);

      // desktop: the window shows in the preview card (clipped, dark).
      // phone (418:865): the offer is JUST the blurred room — the window
      // arrives with the detail on open.
      // Frame 7 (504:1154) seats the window at x 904 — 31u left of the
      // shared CSS home (935); the shift is static since the SAME scene
      // shows clipped in the preview card.
      const seatRigs = () => {
        const u = Math.min(window.innerWidth / 1512, window.innerHeight / 982);
        gsap.set(rigs, { x: mobile ? 0 : -31 * u });
      };
      seatRigs();
      gsap.set(rigs, { autoAlpha: mobile ? 0 : 1 });
      // the panes read FROSTED per Figma (418:1111) — the 4px mobile value
      // left the greenery crisp; 8.47px matches the how-monthly green frost
      gsap.set(rigRef.current, { "--frost": mobile ? "8.47px" : "16.445px" });
      gsap.set(q(".how__plit, .how__m2, .how__m2-glow, .how__wprice"), {
        autoAlpha: 0,
      });
      gsap.set(q(".how__pamt, .how__pdisc, .how__scroll-on"), { autoAlpha: 0 });
      // the detail's own copy / card / wire wait behind the dim until expand
      gsap.set(q(".how__ustep--b"), { autoAlpha: 0 });

      // clip parked at the collapsed card
      scene.style.clipPath = clipAt(0);

      // scroll-in: the offer copy and the preview card ease up together
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: section,
            start: "top 55%",
            toggleActions: "restart none none none",
          },
        })
        .from(".upf__copy > *", { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.12 })
        .from(".upf__scene", { autoAlpha: 0, y: 24, duration: 0.6 }, 0.1)
        .from(".upf__skip", { autoAlpha: 0, y: 12, duration: 0.5 }, 0.5);

      // gentle parking: the offer is a full-viewport composition — settle it
      // flush when the scroll rests nearby (flush pose computed live so the
      // phone's shifting chrome can't park it short)
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        snap: {
          snapTo: (v: number, self?: ScrollTrigger) => {
            if (!self) return v;
            const total = (self.end as number) - (self.start as number);
            const flushY = section.getBoundingClientRect().top + window.scrollY;
            const flush = (flushY - (self.start as number)) / total;
            const band = (0.45 * window.innerHeight) / total;
            return Math.abs(v - flush) < band ? flush : v;
          },
          inertia: false,
          duration: { min: 0.2, max: 0.5 },
          delay: 0.08,
          ease: "power2.out",
        },
      });

      const onResize = () => {
        seatRigs();
        if (!openRef.current) scene.style.clipPath = clipAt(0);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ── the expand: the card grows to full-bleed, the dim clears, then the
     detail plays its paid-upfront story; closing reverses it ── */
  useLayoutEffect(() => {
    if (!open && !hadOpenRef.current) return;
    if (open) hadOpenRef.current = true;
    const section = sectionRef.current!;
    const scene = sceneRef.current!;
    const q = (sel: string) => section.querySelectorAll(sel);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduce ? 0 : 1;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const u = Math.min(window.innerWidth / 1512, window.innerHeight / 982);
    const rigs = [rigRef.current!, glowRigRef.current!, frameRigRef.current!];

    swapRef.current?.kill();
    document.documentElement.style.overflow = open ? "hidden" : "";
    const clip = { t: open ? 0 : 1 };
    const applyClip = () => (scene.style.clipPath = clipAt(clip.t));
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
    swapRef.current = tl;

    if (open) {
      const labels = q(".how__plabel");
      tl.set(q(".how__m1"), { autoAlpha: 1, y: 0 })
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
        // the headline/body start hidden so they fade in ON CUE with the
        // window, rather than popping in when their container is un-hidden
        .set(q(".how__ustep--b .how__copy--monthly > *"), { autoAlpha: 0, y: 12 })
        // 1 · the offer copy steps aside and the card OPENS to full-bleed
        .to(q(".upf__copy, .upf__skip, .upf__see"), {
          autoAlpha: 0,
          duration: 0.2 * D,
        }, 0)
        .to(clip, {
          t: 1,
          duration: 0.85 * D,
          ease: "power3.inOut",
          onUpdate: applyClip,
        }, 0)
        // desktop (Frame 7 · 504:1150): the room's dim STAYS — the content is
        // raised above it (see .upf.is-open in how.css) so only the room reads
        // dimmed+blurred. Phones lift it to reveal the full-bleed detail.
        .to(q(".upf__dim"), { autoAlpha: mobile ? 0 : 1, duration: 0.6 * D }, 0.15)
        // 1 · TEXT + WINDOW arrive together — the opening pose. Headline/body
        //     and the month window (months 1…11 shown INDIVIDUALLY) read at
        //     once; the gather is held back for the payoff (beat 4).
        .to(q(".how__ustep--b"), { autoAlpha: 1, duration: 0.01 }, 0.35)
        .to(rigs, { autoAlpha: 1, duration: 0.5 * D }, 0.45)
        .to(
          q(".how__ustep--b .how__copy--monthly > *"),
          { autoAlpha: 1, y: 0, duration: 0.45 * D, stagger: 0.1 },
          0.45
        )
        .to(q(".upf__back"), { autoAlpha: 1, duration: 0.3 * D }, 0.7)
        // 2 · the payment card settles in
        .fromTo(
          q(".how__ustep--b .how__fin2-card"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.45 * D },
          1.15
        )
        // 3 · the arrow draws FROM the card TO Flent; the tile lands as it arrives
        .to(
          q(".how__ustep--b .how__tflow-wire"),
          { clipPath: "inset(0 0% 0 0)", duration: 0.65 * D, ease: "power1.inOut" },
          1.6
        )
        .to(
          q(".how__ub-flent"),
          { autoAlpha: 1, scale: 1, duration: 0.35 * D, ease: "back.out(1.4)" },
          2.05
        );
      // 4 · the payoff — DESKTOP only: the months GATHER into the one upfront
      //     payment (every label drifts to the wprice seat and fades as the
      //     "month 1 – 11 / ₹total" block settles in). The PHONE (418:1102)
      //     holds the pre-gather pose — every month stays laid out individually.
      if (!mobile) {
        tl.to(
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
          2.5
        ).to(q(".how__wprice"), { autoAlpha: 1, duration: 0.45 * D }, 3.25);
      }
    } else {
      // collapse: the detail folds away, the card shrinks back to a preview
      tl.to(q(".how__ustep--b, .upf__back"), {
        autoAlpha: 0,
        duration: 0.3 * D,
      }, 0)
        // phones hide the window again for the bare offer; desktop keeps it
        .to(rigs, { autoAlpha: mobile ? 0 : 1, duration: 0.3 * D }, 0)
        .to(q(".upf__dim"), { autoAlpha: 1, duration: 0.5 * D }, 0.1)
        .to(clip, {
          t: 0,
          duration: 0.7 * D,
          ease: "power3.inOut",
          onUpdate: applyClip,
        }, 0.1)
        .to(q(".upf__copy, .upf__skip, .upf__see"), {
          autoAlpha: 1,
          duration: 0.4 * D,
        }, 0.55)
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
    <section
      className={`how upf${open ? " is-open" : ""}`}
      ref={sectionRef}
    >
      {/* the offer copy, on the shared cream ground */}
      <div className="upf__copy">
        <p className="upf__kicker">Have the cash?</p>
        <p className="upf__line">
          Pay upfront{" "}
          <em>
            and stay <span className="upf__off">2 months free</span>
          </em>
        </p>
      </div>

      {/* the scene — one full-scale detail, clipped to the preview card and
          opened to full-bleed on expand */}
      <div className="upf__scene" ref={sceneRef}>
        <div className="how__warmbg" aria-hidden>
          <picture>
            <source media="(max-width: 640px)" srcSet="/upfront-cozy.png" />
            <img src="/how-warm-bg.png" alt="" />
          </picture>
        </div>

        <div className="how__glowrig is-upfront" ref={glowRigRef} aria-hidden>
          <div className="how__m1-glow" />
          <div className="how__m2-glow" />
        </div>

        {/* the detail's copy / tenant card / wire — Figma Frame 7 — and the
            candle-lit window, all in the contain-fit 1512×982 frame */}
        <div className="how__frame">
          <div className="how__step how__ustep--b">
            <div className="how__copy how__copy--scaffold how__copy--monthly">
              <h3 className="how__title">
                No EMIs. No NBFC.
                <br />
                Just you and Flent
              </h3>
              <p className="how__body">
                Pay 9 months of rent upfront. Stay for 11. The 2 free months
                are adjusted in the price before you pay.
              </p>
            </div>
            {/* the dotted lead runs the WHOLE way, tenant → flent, behind the
                card (553:675); drawn left→right by the clipPath tween */}
            <span className="how__ub-wire" aria-hidden>
              <img src="/upfront-wire.svg" className="how__tflow-wire" alt="" />
            </span>
            {/* the tenant, paying upfront (553:676) — avatar + label */}
            <div className="how__ub-tenant" aria-hidden>
              <img src="/how-tenant.png" alt="" />
              <span>You</span>
            </div>
            {/* the payment card (553:704) — the full upfront price for month 1 */}
            <div className="how__fin2-card how__fin2-card--ub">
              {/* mobile (418:1102): the tenant rides INSIDE the card, avatar +
                  label at the top; hidden on desktop (which keeps the outside
                  "You" avatar above) */}
              <div className="how__ub-cardtenant" aria-hidden>
                <img src="/how-tenant.png" alt="" />
                <span>Flent Tenant</span>
              </div>
              <p className="how__ub-cardhead">
                Out-of-pocket payment <strong>before move-in</strong>
              </p>
              <div className="how__fin2-amts">
                ₹ {inr(rent * 9)} <s>₹ {inr(rent * 11)}</s>
              </div>
            </div>
            <span className="how__ub-flent" aria-hidden>
              {/* Frame 7 (553:673) — WHITE tile, BLACK mark, wrapped in an even
                  white glow (the glow lives in .how__ub-flent img's filter) */}
              <img src="/trust-flent-tile.svg" alt="" />
            </span>
          </div>

          <div className="how__winrig is-upfront is-uB" ref={rigRef}>
            <PaneWindow rent={rent} />
          </div>
        </div>

        <div className="how__framerig is-upfront" ref={frameRigRef} aria-hidden>
          <div className="how__winframe" />
        </div>

        {/* the darkening blur that makes the preview read as a teaser */}
        <div className="upf__dim" aria-hidden />

        {/* the invitation, centred in the card */}
        <button type="button" className="upf__see" onClick={() => setOpen(true)}>
          See how it works <span aria-hidden>&rarr;</span>
        </button>

        {/* the way back out of the expanded detail */}
        <button type="button" className="upf__back" onClick={() => setOpen(false)}>
          <span className="upf__back-arrow" aria-hidden />Back
        </button>
      </div>

      <button type="button" className="upf__skip" onClick={goOnward}>
        Not for you? Keep scrolling
      </button>
    </section>
  );
}
