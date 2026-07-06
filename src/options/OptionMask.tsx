import HeroMask from "../components/HeroMask";
import "./OptionMask.css";

/**
 * Option 2 — "masking puzzle".
 * White puzzle tiles mask the home; one square opens onto the image and
 * expands full-bleed to unmask it, then settles into the next section.
 */
export default function OptionMask() {
  return (
    <>
      <HeroMask />

      <section className="mask-next">
        <div className="mask-next__inner">
          <p className="mask-next__eyebrow">The Flent&nbsp;11 exchange</p>
          <h2 className="mask-next__headline">
            One month, unmasked.
            <br />
            The home was always yours.
          </h2>
          <p className="mask-next__body">
            Stay for eleven, pay for ten — the discount isn't a cut corner, it's a
            month handed back while you settle into the whole home.
          </p>
        </div>
      </section>
    </>
  );
}
