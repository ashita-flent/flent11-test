import HeroPluck from "../components/HeroPluck";

/**
 * Option 1 — "pluck one month out".
 * The hero plus the section its full-bleed cover resolves into.
 */
export default function OptionPluck() {
  return (
    <>
      <HeroPluck />

      <section className="next">
        <div className="next__inner">
          <p className="next__eyebrow">The Flent&nbsp;11 exchange</p>
          <h2 className="next__headline">
            You complete eleven&nbsp;months.
            <br />
            You pay for ten.
          </h2>
          <p className="next__body">
            One month, lifted out and handed back to you — while you stay for the
            whole experience. No percentages, no fine print. Just a month on us.
          </p>
        </div>
      </section>
    </>
  );
}
