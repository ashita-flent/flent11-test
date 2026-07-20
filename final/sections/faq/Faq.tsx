import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./faq.css";

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   FAQ — "Questions you should ask before choosing Flent 11." The hard
   questions, asked the way a tenant would ask them, answered in the same
   plain numbers as the rest of the page. Answers follow the money model
   everywhere else on the site: 10 EMIs each exactly the rent (month one
   free) or 9 months upfront (two free), Gromor NBFC financing, CIBIL-safe
   within 7 days, 30-day notice, exit fee capped at 21 days of rent.
   One item open at a time; the first ships open.
   ──────────────────────────────────────────────────────────────────────── */

type Item = { q: string; a: string[] };

const ITEMS: Item[] = [
  {
    q: "Is Flent 11 still an 11-month lock-in?",
    a: [
      "Yes.",
      "Flent 11 is built for tenants who intend to stay for 11 months. The difference is that your commitment comes with better terms — first month free, no-cost monthly payments, and a defined early-exit process.",
    ],
  },
  {
    q: "What exactly is free?",
    a: [
      "On the monthly plan, month one: you move in and pay nothing until month two. On the upfront plan, months one and two are both free — you pay for nine months and stay for eleven.",
    ],
  },
  {
    q: "How does the monthly plan work?",
    a: [
      "You pay nothing in month one. From month two, your rent runs as ten equal monthly payments — each exactly your rent, paid to Flent, never a bank. The interest line on your schedule reads zero.",
    ],
  },
  {
    q: "Is this a loan?",
    a: [
      "Your rent is financed through Gromor, an RBI-registered NBFC — that is what makes the free month possible. Your experience stays simple: ten payments, each exactly your rent, with the financing cost settled by Flent directly. You see the full financing terms before you sign.",
    ],
  },
  {
    q: "Will this affect my CIBIL score?",
    a: [
      "Not if you pay on time — and there is a guardrail even if you slip. Your score is not impacted as long as an EMI is paid within 7 days of its due date. A completed schedule reads as a clean repayment record.",
    ],
  },
  {
    q: "What happens if I miss an EMI?",
    a: [
      "You have a 7-day window after the due date with no CIBIL impact. We remind you before every due date, and if something has gone wrong, the Flent team works it out with you. The late terms are printed in your schedule before you sign — not discovered after.",
    ],
  },
  {
    q: "Do I pay anything before moving in?",
    a: [
      "Only the security deposit — three months' rent, the same as any Flent home. Your first rent payment lands in month two.",
    ],
  },
  {
    q: "What if I need to leave before 11 months?",
    a: [
      "Give 30 days' notice and hand back the keys. The settlement math is fixed: one exit fee capped at 21 days of rent, actual damages if any, and the rest — deposit included — reaches your account within 30 days of move-out. The calculator above shows the exact numbers for any month.",
    ],
  },
  {
    q: "What happens to my loan if I exit early?",
    a: [
      "It closes when you leave. Flent settles the remaining financing with Gromor directly — nothing stays open in your name, and the remaining months' rent is ₹0 on you.",
    ],
  },
  {
    q: "What if the home becomes unavailable?",
    a: [
      "If a home has to leave the platform mid-stay, we move you to a comparable Flent home on the same terms — or unwind the plan with no exit fee and a full settlement. You are never left holding a schedule for a home you cannot live in.",
    ],
  },
  {
    q: "Can I pay upfront instead?",
    a: [
      "Yes. Pay nine months at move-in and stay eleven — months one and two are free, and there is no financing involved at all.",
    ],
  },
  {
    q: "Why does the upfront route get one more free month?",
    a: [
      "Because there is nothing to finance. With no schedule to run, the cost Flent would have settled with Gromor comes back to you as a second free month.",
    ],
  },
  {
    q: "When do I see the final terms?",
    a: [
      "Before you sign anything. Repayment schedule, breakage terms, and the full financing agreement are shown upfront — in the same plain numbers you have seen on this page.",
    ],
  },
];

export default function Faq() {
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".fq__title", {
        opacity: 0,
        y: 22,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
      });
      gsap.from(".fq__item", {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
        scrollTrigger: { trigger: ".fq__list", start: "top 80%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="fq" ref={rootRef}>
      <div className="fq__inner">
        <h2 className="fq__title">
          {/* the space before the break matters: phones hide the <br>
              (see faq.css) and the words must not fuse */}
          Questions you should ask{" "}
          <br />
          before choosing Flent&nbsp;11.
        </h2>

        <div className="fq__list">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`fq__item${isOpen ? " is-open" : ""}`} key={item.q}>
                <button
                  type="button"
                  className="fq__q"
                  aria-expanded={isOpen}
                  aria-controls={`fq-a-${i}`}
                  id={`fq-q-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="fq__toggle" aria-hidden>
                    <svg viewBox="0 0 16 16" fill="none">
                      <path className="fq__toggle-v" d="M8 2.5v11" />
                      <path d="M2.5 8h11" />
                    </svg>
                  </span>
                </button>
                <div
                  className="fq__a"
                  id={`fq-a-${i}`}
                  role="region"
                  aria-labelledby={`fq-q-${i}`}
                >
                  <div className="fq__a-clip">
                    <div className="fq__a-body">
                      {item.a.map((p, pi) => (
                        <p key={pi}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
