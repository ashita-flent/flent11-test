import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import "./HeroCalendar.css";

const IMG = "/home.jpg";

/** Grid frame, as % of the viewport (sharp image inside, blur outside). */
const FRAME = { t: 16, r: 12, b: 16, l: 12 };

/** 11 months in a 4×3 grid; the 12th cell stays empty. Month 1 is on us. */
const MONTHS = Array.from({ length: 11 }, (_, i) => ({
  n: i + 1,
  free: i === 0,
}));

export default function HeroCalendar() {
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // entrance — frame fades up, cells stagger in
      gsap.from(".cal__frame", {
        opacity: 0,
        scale: 0.985,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".cal__cell", {
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: { each: 0.05, grid: [3, 4], from: "start" },
        delay: 0.25,
      });
      gsap.from(".cal__tagline", {
        opacity: 0,
        y: 14,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.5,
      });
    }, stageRef);

    return () => ctx.revert();
  }, []);

  const clip = `inset(${FRAME.t}% ${FRAME.r}% ${FRAME.b}% ${FRAME.l}%)`;
  const frameStyle = {
    top: `${FRAME.t}%`,
    left: `${FRAME.l}%`,
    width: `${100 - FRAME.l - FRAME.r}%`,
    height: `${100 - FRAME.t - FRAME.b}%`,
  };

  return (
    <section className="cal">
      <div className="cal__stage" ref={stageRef}>
        {/* blurred, washed surround */}
        <img className="cal__blur" src={IMG} alt="" aria-hidden />
        <div className="cal__wash" aria-hidden />

        {/* sharp image inside the grid frame */}
        <img
          className="cal__sharp"
          src={IMG}
          alt=""
          aria-hidden
          style={{ clipPath: clip }}
        />

        {/* the calendar grid */}
        <div className="cal__frame" style={frameStyle}>
          {MONTHS.map((m) => (
            <div
              key={m.n}
              className={`cal__cell${m.free ? " cal__cell--free" : ""}`}
              tabIndex={0}
            >
              <span className="cal__label">Month {m.n}</span>

              {/* hover card revealing the payment */}
              <div className="cal__card" aria-hidden>
                <span className="cal__card-label">Month {m.n}</span>
                <span className="cal__card-value">
                  {m.free ? "On us" : "₹45,000"}
                </span>
                {m.free && <span className="cal__fold" />}
              </div>
            </div>
          ))}
          {/* 12th cell — empty */}
          <div className="cal__cell cal__cell--empty" aria-hidden />
        </div>

        <p className="cal__tagline">
          stay for 11 · pay for 10
        </p>
      </div>
    </section>
  );
}
