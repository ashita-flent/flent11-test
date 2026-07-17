import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./HeroSeasons.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Hero — the door-identity opening (Figma storyboard 164:1416 → 164:1385)
   + seasons.

   The doors are a single constant shape at every storyboard beat: a quad
   with vertical sides, a flat bottom, and a top edge that dips toward the
   centre seam by 8.147% of the door's height (81.79/1004, 80/982,
   11.81/145, 5.13/63 in the Figma vectors — same ratio throughout). No
   3D rotation: the "perspective" is drawn into the 2D shape, so the whole
   opening is pure panel choreography — resize + reposition only.

   Beats (each maps to a storyboard frame): full dark cover (164:1416) →
   unlatch: the dip tips into view, doors grow ~2.2% (164:1357) → doors
   slide apart into 96px slats hugging the screen edges (164:1345) → the
   slats fly inward, shrinking into dark 19×145 bars flanking the white
   flent wordmark (164:1362) → the bars slide to the wordmark's right,
   whiten and shrink to 12×63 — the door notch becomes the numeral's flag:
   flent11 (164:1374) → the lockup flies to the brand corner at 0.41×
   scale and match-dissolves into the live brand text (164:1385).

   Scroll only drives the seasons pass (cozy → evening → monsoon →
   bright) — the 11 months rushing by.
   ──────────────────────────────────────────────────────────────────────── */

/** The four Figma frames — one blurred room photo per "season" of the stay. */
const SEASONS = [
  { key: "cozy", src: "/hero-cozy.png", alt: "Sunlit living room" },
  { key: "evening", src: "/hero-evening.png", alt: "Evening living room" },
  { key: "monsoon", src: "/hero-monsoon.png", alt: "Monsoon living room" },
  { key: "bright", src: "/hero-bright.png", alt: "Clear-sky living room" },
];

/* flent wordmark aspect (the SVG is 172×63) */
const LOGO_RATIO = 172 / 63;

/* ── door geometry (Figma storyboard, 1512×982 ref) ──
   The top-edge dip is a constant fraction of door height in every frame. */
const DIP = 0.08147;
/* clip quads — dip always points at the centre seam */
const CLIP_DIP_R = `polygon(0% 0%, 100% ${DIP * 100}%, 100% 100%, 0% 100%)`; // left door
const CLIP_DIP_L = `polygon(0% ${DIP * 100}%, 100% 0%, 100% 100%, 0% 100%)`; // right door
/* lockup metrics in wordmark-height units (Figma frame values / 63) */
const FLANK = { barW: 19 / 63, barH: 145 / 63, gap: 49 / 63 };
const LOCKUP = { barW: 12 / 63, bar1X: 181 / 63, bar2X: 202 / 63 };

export default function HeroSeasons() {
  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const doorsRef = useRef<HTMLDivElement>(null);
  const doorLRef = useRef<HTMLDivElement>(null);
  const doorRRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const photoEls = useRef<HTMLImageElement[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const intro = introRef.current!;
    const doors = doorsRef.current!;
    const doorL = doorLRef.current!;
    const doorR = doorRRef.current!;
    const logo = logoRef.current!;
    const brand = brandRef.current!;
    const headline = headlineRef.current!;
    const sub = subRef.current!;
    const cta = ctaRef.current!;
    const imgs = photoEls.current;

    const ctx = gsap.context(() => {
      /* ---- initial state ---- */
      gsap.set(imgs.slice(1), { opacity: 0 }); // only the cozy frame shows
      gsap.set([brand, headline, sub, cta], { opacity: 0, y: 26 });

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      /* ── the door-identity opening — plays by itself on load ── */
      if (reduced) {
        gsap.set(intro, { display: "none" });
        gsap.set([brand, headline, sub, cta], { opacity: 1, y: 0 });
      } else {
        // the brand is the fly-to target — park it at rest (invisible) so
        // its measured rect is exact
        gsap.set(brand, { y: 0 });

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cx = vw / 2;
        const cy = vh / 2;
        const u = vw / 1512; // Figma design unit

        // wordmark metrics — Figma renders it 63px tall on the 1512 frame
        const logoH = Math.min(76, Math.max(40, vw * (63 / 1512)));
        const logoW = logoH * LOGO_RATIO;
        const logoX = cx - logoW / 2;
        const logoY = cy - logoH / 2;

        // doors closed over the whole stage (164:1416) — exact halves, the
        // dip parked above the viewport so the cover reads as a plain rect
        const closedH = vh * 1.12;
        gsap.set(doorL, { left: 0, top: vh - closedH, width: cx + 1, height: closedH });
        gsap.set(doorR, { left: cx, top: vh - closedH, width: cx + 1, height: closedH });
        gsap.set(logo, {
          left: logoX,
          top: logoY,
          width: logoW,
          height: logoH,
          opacity: 0,
          y: 14,
        });

        const itl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

        // The door journey is ONE keyframed tween per panel — segments hand
        // velocity to each other so nothing parks mid-flow. Two deliberate
        // beats only: a short hold on the flank pose (|flent| — the doors
        // registering as the coming 11) and a longer read on the completed
        // flent11 before it flies to the corner.
        const fBarW = FLANK.barW * logoH;
        const fBarH = FLANK.barH * logoH;
        const fGap = FLANK.gap * logoH;
        const fTop = cy - fBarH / 2;
        const bar1X = logoX + LOCKUP.bar1X * logoH;
        const bar2X = logoX + LOCKUP.bar2X * logoH;
        const lBarW = LOCKUP.barW * logoH;

        // segment timing: 0.3 unlatch → 0.7 glide apart → 1.4 sweep inward
        // → 2.05 flank pose |flent| (hold 0.35) → 2.4 move right, whiten
        // → complete flent11 at 2.95
        itl.to(
          doorL,
          {
            keyframes: [
              // unlatch — the sloped top tips into view, panel swells and
              // accelerates straight into the part (164:1357)
              { left: -17 * u, width: cx + 17 * u + 1, top: 0, height: vh * (1004 / 982), duration: 0.4, ease: "power1.in" },
              // glide apart, decelerating into a 96px slat at the edge (164:1345)
              { left: 0, width: 96 * u, top: 0, height: vh, duration: 0.7, ease: "sine.out" },
              // turn and sweep inward, settling into the flank pose —
              // |flent|, the doors reading as bars (164:1362)
              { left: logoX - fGap - fBarW, top: fTop, width: fBarW, height: fBarH, duration: 0.65, ease: "sine.inOut" },
              // hold the flank read, then take the place on the wordmark's
              // right as the first numeral, whitening as the notch flips
              // into the 1's flag (164:1374)
              { left: bar1X, top: logoY, width: lBarW, height: logoH, backgroundColor: "#ffffff", clipPath: CLIP_DIP_L, duration: 0.55, ease: "power2.inOut", delay: 0.35 },
            ],
          },
          0.3
        );
        itl.to(
          doorR,
          {
            keyframes: [
              { width: cx + 17 * u + 1, top: 0, height: vh * (1004 / 982), duration: 0.4, ease: "power1.in" },
              { left: vw - 96 * u, width: 96 * u, top: 0, height: vh, duration: 0.7, ease: "sine.out" },
              { left: logoX + logoW + fGap, top: fTop, width: fBarW, height: fBarH, duration: 0.65, ease: "sine.inOut" },
              { left: bar2X, top: logoY, width: lBarW, height: logoH, backgroundColor: "#ffffff", duration: 0.55, ease: "power2.inOut", delay: 0.35 },
            ],
          },
          0.3
        );

        // texture rides the flight: soft while airborne, crisp as they
        // become glyphs (the Figma bars carry no blur/noise)
        itl.to(doors, { "--doorblur": "5px", duration: 0.4 }, 0.35);
        itl.set([doorL, doorR], { backgroundImage: "none", backgroundColor: "#120d09" }, 1.4);
        itl.to(doors, { "--doorblur": "0px", duration: 0.35 }, 1.4);

        // the wordmark surfaces mid-sweep, fully in as the bars reach the
        // flank pose — |flent| reads as one composition
        itl.to(logo, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 1.65);

        // flent11 completes at 2.95 — hold the read, then fly to the brand
        // corner, landing exactly on the live lockup markup
        itl.add(() => {
          const b = brand.getBoundingClientRect();
          const s = b.height / logoH;
          const fly = (el: HTMLElement, x: number, y: number, w: number, h: number) =>
            gsap.to(el, {
              left: b.left + (x - logoX) * s,
              top: b.top + (y - logoY) * s,
              width: w * s,
              height: h * s,
              duration: 0.65,
              ease: "power3.inOut",
            });
          fly(logo, logoX, logoY, logoW, logoH);
          fly(doorL, bar1X, logoY, lBarW, logoH);
          fly(doorR, bar2X, logoY, lBarW, logoH);
        }, 3.6);

        // hand off to the identical brand lockup (pixel match, so the swap
        // is invisible) while the content settles under the landing
        itl.to(brand, { opacity: 1, duration: 0.15 }, 4.15);
        itl.to([logo, doorL, doorR], { opacity: 0, duration: 0.15 }, 4.22);
        itl.to(headline, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }, 4.2);
        itl.to(sub, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 4.32);
        itl.to(cta, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 4.44);
        itl.set(intro, { display: "none" }, 4.7);
      }

      /* ---- scroll: the seasons pass (pinned) ---- */
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "+=260%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // the 11 months rush by — cozy → evening → monsoon → bright
      tl.to(imgs[1], { opacity: 1, duration: 0.28 }, 0.5) // evening
        .to(imgs[2], { opacity: 1, duration: 0.28 }, 0.95) // monsoon
        .to(imgs[3], { opacity: 1, duration: 0.28 }, 1.4); // bright

      // hold the last frame, then the pin releases and the hero scrolls up.
      tl.to({}, { duration: 0.6 }, 1.68);
    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="heroS" ref={wrapRef}>
      <div className="heroS__stage" ref={stageRef}>
        {/* blurred room photos, stacked — one per season */}
        <div className="heroS__photos" ref={photosRef}>
          {SEASONS.map((s, i) => (
            <img
              key={s.key}
              className={`heroS__photo heroS__photo--${s.key}`}
              src={s.src}
              alt={s.alt}
              draggable={false}
              ref={(el) => {
                if (el) photoEls.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* film vignette — corner falloff for depth */}
        <div className="heroS__vignette" aria-hidden />

        {/* Rectangle 5 — film grain / noise over the whole frame */}
        <div className="heroS__grain" aria-hidden />

        {/* overlaid content (appears once the doors have opened) */}
        <div className="heroS__content">
          {/* the settled brand IS the lockup the intro builds — wordmark +
              two door-bars (Figma 164:1385) — so the hand-off is a pixel
              match, not a dissolve into different type */}
          <span className="heroS__brand" ref={brandRef} aria-label="flent11">
            <img src="/how-flent.svg" alt="" />
            <i className="heroS__brandBar" aria-hidden />
            <i className="heroS__brandBar" aria-hidden />
          </span>

          <div className="heroS__lower">
            <div className="heroS__headRow">
              <h1 className="heroS__headline" ref={headlineRef}>
                11 month lock-in
                <br />
                finally made <em>worth it</em>
              </h1>
              <a className="heroS__cta" ref={ctaRef} href="#">
                Check Eligibility <span aria-hidden>→</span>
              </a>
            </div>
            <p className="heroS__sub" ref={subRef}>
              Flent 11 adds what tenants should have had all along - savings,
              flexibility, and a little more comfort.
            </p>
          </div>
        </div>

        {/* ── the door-identity opening (Figma 164:1416) ── */}
        <div className="heroI" ref={introRef} aria-hidden>
          {/* the wrapper blurs the doors mid-flight (Figma layer blur 5) —
              blur must rasterise AFTER the clip so the sloped edge softens */}
          <div className="heroI__doors" ref={doorsRef}>
            <div className="heroI__door heroI__door--l" ref={doorLRef} />
            <div className="heroI__door heroI__door--r" ref={doorRRef} />
          </div>
          <img className="heroI__logo" ref={logoRef} src="/how-flent.svg" alt="" />
        </div>
      </div>
    </section>
  );
}
