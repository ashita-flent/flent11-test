import "./folds.css";

/* Placeholder landing-page folds — light editorial, ~100vh each. These stand
   in until each fold gets its own designed version(s). Copy follows the Flent
   rules: never "loan", months-off not %, "you pay Flent, never a bank". */

export function ExchangeFold() {
  return (
    <section className="fold fold--light">
      <div className="fold__inner">
        <p className="fold__eyebrow">The Flent&nbsp;11 exchange</p>
        <h2 className="fold__title">
          You complete eleven&nbsp;months.
          <br />
          You pay for ten.
        </h2>
        <p className="fold__body">
          One month, handed back to you — while you stay for the whole
          experience. No percentages, no fine print. Just a month on us.
        </p>
      </div>
    </section>
  );
}

export function HowFold() {
  return (
    <section className="fold fold--warm">
      <div className="fold__inner">
        <p className="fold__eyebrow">How it works</p>
        <h2 className="fold__title">
          Pay your rent monthly.
          <br />
          The first month is on us.
        </h2>
        <p className="fold__body">
          Your rent runs as a no-cost EMI from month two, and month one is
          simply free. You pay Flent, never a bank.
          <br />
          <span className="fold__note">[ Placeholder — fold to be designed ]</span>
        </p>
      </div>
    </section>
  );
}

export function TrustFold() {
  return (
    <section className="fold fold--dark">
      <div className="fold__inner">
        <p className="fold__eyebrow">Peace of mind</p>
        <h2 className="fold__title fold__title--light">
          Capped exit. CIBIL-safe.
          <br />
          No surprises.
        </h2>
        <p className="fold__body fold__body--dim">
          One month's notice, a capped exit fee, and your discount honoured. If
          life changes, you're never trapped — and never reported to a bank.
          <br />
          <span className="fold__note">[ Placeholder — fold to be designed ]</span>
        </p>
      </div>
    </section>
  );
}

export function CtaFold() {
  return (
    <section className="fold fold--light">
      <div className="fold__inner">
        <p className="fold__eyebrow">By invitation</p>
        <h2 className="fold__title">
          Your favourite Flent home,
          <br />
          now at a discount.
        </h2>
        <p className="fold__body">
          Three of five slots left. No obligation · CIBIL-safe.
        </p>
        <button className="fold__cta" type="button">
          Register your interest
        </button>
      </div>
    </section>
  );
}
