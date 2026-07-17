import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@fontsource/fraunces/300-italic.css";
import "./register.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Register — the closing argument, now a moment instead of a button.
   One centred statement, then an expression-of-interest paper the visitor
   actually SIGNS — draw with the pointer (or type a name, which renders
   in a script hand) — and the eligibility check arms only once signed.
   Below it, the scarcity meter: eleven slots a month, most already
   stamped. Slot numbers are a temporary visual until real availability
   is wired in. Footer carries the wordmark and legal links.
   ──────────────────────────────────────────────────────────────────────── */

const SLOTS = 11;
const TAKEN = 7; // temporary — July's claimed slots
const MONTH = "July";
/* hand-stamp rotations so the taken marks don't read machine-set */
const STAMP_ROT = [-6, 4, -3, 7, -8, 2, 5];

type Stroke = { x: number; y: number }[];

export default function Register() {
  const rootRef = useRef<HTMLElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const liveRef = useRef<Stroke | null>(null);

  const [inked, setInked] = useState(false);
  const [typed, setTyped] = useState("");
  const [sent, setSent] = useState(false);

  const armed = inked || typed.trim().length > 1;

  /* ---- the ink — pointer drawing with midpoint smoothing ---- */
  const drawAll = () => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    if (!canvas || !pad) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = pad.getBoundingClientRect();
    if (canvas.width !== Math.round(width * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#22201c";
    const all = liveRef.current
      ? [...strokesRef.current, liveRef.current]
      : strokesRef.current;
    for (const s of all) {
      if (s.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length - 1; i++) {
        const mx = (s[i].x + s[i + 1].x) / 2;
        const my = (s[i].y + s[i + 1].y) / 2;
        ctx.quadraticCurveTo(s[i].x, s[i].y, mx, my);
      }
      const last = s[s.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawAll();
    window.addEventListener("resize", drawAll);
    return () => window.removeEventListener("resize", drawAll);
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPadDown = (e: React.PointerEvent) => {
    if (sent) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    liveRef.current = [point(e)];
  };

  const onPadMove = (e: React.PointerEvent) => {
    if (!liveRef.current) return;
    liveRef.current.push(point(e));
    drawAll();
  };

  const onPadUp = () => {
    const s = liveRef.current;
    liveRef.current = null;
    if (!s) return;
    if (s.length > 3) {
      strokesRef.current.push(s);
      setInked(true);
    }
    drawAll();
  };

  const clearAll = () => {
    strokesRef.current = [];
    liveRef.current = null;
    setInked(false);
    setTyped("");
    drawAll();
  };

  /* ---- entrance ---- */
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".rg__stage > *", {
        opacity: 0,
        y: 26,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: rootRef.current, start: "top 62%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="rg" ref={rootRef}>
      <div className="rg__stage">
        <h2 className="rg__title">
          You were going to commit anyway.
          <br />
          Commit on better terms.
        </h2>
        <p className="rg__sub">
          Sign below to check if you qualify for Flent&nbsp;11.
        </p>

        {/* ── the expression-of-interest paper ── */}
        <div className={`rg__paper${sent ? " is-sent" : ""}`}>
          <div className="rg__paper-head">
            <span className="rg__paper-title">
              Flent&nbsp;11 · Expression of interest
            </span>
            <span className="rg__paper-chip">No obligation</span>
          </div>

          <div className="rg__paper-terms">
            <p>Eleven-month stay, month one on us.</p>
            <p>Ten payments, each exactly your rent.</p>
            <p>Exit anytime — fee capped at 21 days.</p>
          </div>

          <div className="rg__sign-label">Sign here</div>
          <div
            className="rg__pad"
            ref={padRef}
            role="img"
            aria-label="Signature pad — draw your signature with your mouse or finger"
            onPointerDown={onPadDown}
            onPointerMove={onPadMove}
            onPointerUp={onPadUp}
            onPointerCancel={onPadUp}
          >
            {/* typed names render in the script hand under the ink */}
            {!inked && typed.trim() && (
              <span className="rg__script" aria-hidden>
                {typed.trim()}
              </span>
            )}
            {!inked && !typed.trim() && (
              <span className="rg__pad-hint" aria-hidden>
                draw your signature
              </span>
            )}
            <canvas ref={canvasRef} className="rg__canvas" aria-hidden />
            <span className="rg__pad-x" aria-hidden>
              ✗
            </span>
          </div>

          <div className="rg__type-row">
            <label className="rg__type-label" htmlFor="rg-name">
              or type your full name
            </label>
            <input
              id="rg-name"
              className="rg__type-input"
              type="text"
              value={typed}
              disabled={sent}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Aarav Sharma"
              autoComplete="name"
            />
          </div>

          <div className="rg__paper-foot">
            <button
              type="button"
              className={`rg__clear${armed && !sent ? " is-live" : ""}`}
              onClick={clearAll}
              tabIndex={armed && !sent ? 0 : -1}
            >
              Clear
            </button>
            <button
              type="button"
              className="rg__cta"
              disabled={!armed || sent}
              onClick={() => setSent(true)}
            >
              {sent ? "You're in — we'll reach out" : "Check eligibility"}
              {!sent && (
                <span className="rg__cta-arrow" aria-hidden>
                  &rarr;
                </span>
              )}
            </button>
          </div>

          {/* received stamp — lands once the paper is signed & sent */}
          <span className="rg__stamp" aria-hidden>
            Received
          </span>
        </div>

        {/* ── scarcity — the eleven monthly slots ── */}
        <div className="rg__slots" role="img" aria-label={`${SLOTS - TAKEN} of ${SLOTS} ${MONTH} slots left`}>
          <p className="rg__slots-label">
            Eleven slots open every month.{" "}
            <strong>
              {MONTH} has {SLOTS - TAKEN} left.
            </strong>
          </p>
          <div className="rg__slots-row">
            {Array.from({ length: SLOTS }, (_, i) => {
              const taken = i < TAKEN;
              return (
                <span
                  key={i}
                  className={`rg__slot${taken ? " is-taken" : ""}`}
                >
                  <i className="rg__slot-n">{i + 1}</i>
                  {taken && (
                    <svg
                      className="rg__slot-x"
                      viewBox="0 0 24 24"
                      style={{ transform: `rotate(${STAMP_ROT[i]}deg)` }}
                    >
                      <path d="M5 5.5C9 9 14 15 19 19M19 5.5C15 10 9.5 15 5 19" />
                    </svg>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="rg__footer">
        <span className="rg__wordmark">Flent</span>
        <nav className="rg__links" aria-label="Footer">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Contact</a>
        </nav>
      </footer>
    </section>
  );
}
