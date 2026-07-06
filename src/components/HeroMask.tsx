import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./HeroMask.css";

gsap.registerPlugin(ScrollTrigger);

const IMG = "/home.jpg";

/**
 * The 11 boxes are all WINDOWS onto the same full-bleed image — each one is
 * the identical <img> clipped to its own rect (inset in %). Negative space
 * between them is the page background; the photo is only visible THROUGH the
 * boxes. Box #REVEAL_INDEX is the special one that expands to inset(0),
 * filling in the whole picture.
 */
const BOXES = [
  { l: 4, t: 6, w: 19, h: 33 },
  { l: 25, t: 5, w: 21, h: 20 },
  { l: 54, t: 7, w: 18, h: 27 },
  { l: 74, t: 5, w: 22, h: 31 },
  { l: 4, t: 43, w: 17, h: 26 },
  { l: 23, t: 28, w: 15, h: 22 },
  { l: 74, t: 40, w: 22, h: 27 },
  { l: 4, t: 71, w: 20, h: 24 },
  { l: 26, t: 55, w: 22, h: 24 },
  { l: 68, t: 70, w: 28, h: 25 },
  { l: 41, t: 37, w: 22, h: 29 }, // ← the reveal square (centre)
];
const REVEAL_INDEX = BOXES.length - 1;

const insetOf = (b: (typeof BOXES)[number]) => ({
  t: b.t,
  r: 100 - (b.l + b.w),
  b: 100 - (b.t + b.h),
  l: b.l,
});

export default function HeroMask() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const winsRef = useRef<HTMLImageElement[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const scrim = scrimRef.current!;
    const headline = headlineRef.current!;
    const reveal = winsRef.current[REVEAL_INDEX];

    const ctx = gsap.context(() => {
      // reveal window's clip, driven imperatively for solid interpolation
      const clip = insetOf(BOXES[REVEAL_INDEX]);
      const applyClip = () => {
        reveal.style.clipPath = `inset(${clip.t}% ${clip.r}% ${clip.b}% ${clip.l}%)`;
      };
      applyClip();

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "+=640%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1 · the square opens to full WIDTH (a band across the frame)
      tl.to(clip, { r: 0, l: 0, duration: 1.2, onUpdate: applyClip }, 0);

      // 2 · then opens to full HEIGHT — whole image filled in (Component 20)
      tl.to(clip, { t: 0, b: 0, duration: 1.4, onUpdate: applyClip }, 1.2);

      // hold (2.6 → 3.4): sharp image + red headline

      // 3 · settle — image blurs & darkens, headline turns light (Component 21)
      tl.to(reveal, { filter: "blur(16px)", scale: 1.06, duration: 1.3 }, 3.4)
        .to(scrim, { opacity: 0.42, duration: 1.3 }, 3.4)
        .to(headline, { color: "#faf8f4", duration: 1.0 }, 3.6);

      // hold (4.7 → 5.3): Component 21 reads

      // 4 · release — headline lifts away into the next section
      tl.to(
        headline,
        { yPercent: -150, opacity: 0, duration: 1, ease: "power2.in" },
        5.3
      );
    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="mask" ref={wrapRef}>
      <div className="mask__stage" ref={stageRef}>
        {BOXES.map((b, i) => {
          const c = insetOf(b);
          return (
            <img
              key={i}
              className={`mask__win${i === REVEAL_INDEX ? " mask__win--reveal" : ""}`}
              src={IMG}
              alt=""
              aria-hidden
              style={{
                clipPath: `inset(${c.t}% ${c.r}% ${c.b}% ${c.l}%)`,
              }}
              ref={(el) => {
                if (el) winsRef.current[i] = el;
              }}
            />
          );
        })}

        <div className="mask__scrim" ref={scrimRef} aria-hidden />

        <h1 className="mask__headline" ref={headlineRef}>
          stay for 11<br />
          pay for 10
        </h1>
      </div>
    </section>
  );
}
