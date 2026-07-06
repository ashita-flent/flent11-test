import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./HeroPluck.css";

gsap.registerPlugin(ScrollTrigger);

/** 11 months of a stay — Jan…Nov. The apex (index 5, Jun) is the "free" month. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov",
];
const FREE_INDEX = 5; // Jun — apex of the arc, the one that gets plucked out

export default function HeroPluck() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const stage = stageRef.current!;
    const headline = headlineRef.current!;
    const ghost = ghostRef.current!;
    const boxes = boxesRef.current;
    const free = boxes[FREE_INDEX];
    const others = boxes.filter((_, i) => i !== FREE_INDEX);

    const ctx = gsap.context(() => {
      /* ---- geometry: lay the boxes out on a downward-opening arc ---- */
      let coverScale = 10;
      let travelY = 0;

      const layout = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // box size scales gently with viewport
        const size = Math.max(66, Math.min(vw * 0.072, 116));

        // arc: apex (Jun) near top-centre, Jan / Nov splay to lower corners
        const cx = vw / 2;
        const cy = vh * 0.6;
        const R = Math.min(vw * 0.4, vh * 0.42);

        // sweep 215° -> -35° so index 5 lands at 90° (straight up = apex)
        const START = 215;
        const STEP = 25;

        // positioned by top-left corner (= centre − half) so GSAP scale/rotate
        // pivots cleanly around each box's own centre.
        boxes.forEach((b, i) => {
          const ang = ((START - i * STEP) * Math.PI) / 180;
          const x = cx + R * Math.cos(ang);
          const y = cy - R * Math.sin(ang);
          b.style.width = `${size}px`;
          b.style.height = `${size}px`;
          b.style.left = `${x - size / 2}px`;
          b.style.top = `${y - size / 2}px`;
        });

        // ghost sits exactly on Jun's home slot
        const apexX = cx;
        const apexY = cy - R;
        ghost.style.width = `${size}px`;
        ghost.style.height = `${size}px`;
        ghost.style.left = `${apexX - size / 2}px`;
        ghost.style.top = `${apexY - size / 2}px`;

        // distance Jun must fall to reach dead-centre of the viewport
        travelY = vh / 2 - apexY;
        // scale needed for the box to fully cover the viewport from centre
        coverScale = (Math.max(vw, vh) / size) * 1.15;
      };

      layout();

      /* ---- entrance: boxes settle into the arc, headline rises ---- */
      gsap.set([...boxes, headline], { opacity: 1 });
      gsap.from(boxes, {
        opacity: 0,
        y: 26,
        scale: 0.9,
        duration: 0.9,
        ease: "power3.out",
        stagger: { each: 0.045, from: "center" },
      });
      gsap.from(headline, {
        opacity: 0,
        y: 18,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.15,
      });

      /* ---- scroll-scrubbed choreography (pinned) ---- */
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "+=680%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // A · pluck (0 → 1) — Jun lifts + tilts out; ghost trace fades into its slot
      tl.to(free, { yPercent: -34, rotation: -7, scale: 1.06, duration: 1 }, 0)
        .to(ghost, { opacity: 1, duration: 0.8 }, 0.15);

      // B · travel (1 → 2.6) — Jun drops to dead-centre; the rest recede
      tl.to(
        free,
        { y: travelY, yPercent: 0, rotation: 0, scale: 1.7, duration: 1.6 },
        1
      ).to(
        others,
        { opacity: 0.42, scale: 0.94, duration: 1.3, ease: "power2.out" },
        1
      );

      // C · cover (2.6 → 4.6) — Jun grows to full-bleed; siblings, ghost & tag
      // clear. The headline is untouched here, so it rides on top of the
      // full grey (Component 17).
      tl.to(free, { scale: coverScale, borderRadius: 0, duration: 2 }, 2.6)
        .to(free.querySelector(".box__tag"), { opacity: 0, duration: 0.5 }, 2.6)
        .to(others, { opacity: 0, duration: 0.7 }, 2.6)
        .to(ghost, { opacity: 0, duration: 0.7 }, 2.6);

      // hold (4.6 → 5.7) — full grey + red headline reads (Component 17)

      // D · release (5.7 → 6.7) — headline lifts away; scroll flows on into the
      // next section
      tl.to(
        headline,
        { yPercent: -160, opacity: 0, duration: 1, ease: "power2.in" },
        5.7
      );

      /* ---- responsive relayout ---- */
      const onResize = () => {
        layout();
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, stage);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={wrapRef}>
      <div className="hero__stage" ref={stageRef}>
        <h1 className="hero__headline" ref={headlineRef}>
          stay for 11<br />
          pay for 10
        </h1>

        {/* ghost trace left behind in Jun's slot */}
        <div className="hero__ghost" ref={ghostRef} aria-hidden />

        {MONTHS.map((m, i) => (
          <div
            key={m}
            className={`hero__box${i === FREE_INDEX ? " hero__box--free" : ""}`}
            ref={(el) => {
              if (el) boxesRef.current[i] = el;
            }}
          >
            <span className="box__tag">{m}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
