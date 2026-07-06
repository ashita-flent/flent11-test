import HeroCalendar from "../components/HeroCalendar";

/**
 * Option 3 — "calendar grid".
 * The home seen through an 11-month ledger: hover any month to reveal its
 * payment; Month 1 is on us.
 */
export default function OptionCalendar() {
  return (
    <>
      <HeroCalendar />

      <section className="next">
        <div className="next__inner">
          <p className="next__eyebrow">The Flent&nbsp;11 exchange</p>
          <h2 className="next__headline">
            Eleven months on the wall.
            <br />
            One of them is ours.
          </h2>
          <p className="next__body">
            Every month at ₹45,000 — except the first, which is on us. Stay for
            eleven, pay for ten. That's the whole trick, and it isn't one.
          </p>
        </div>
      </section>
    </>
  );
}
