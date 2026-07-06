import "./OptionPlaceholder.css";

/** Reserved slot for a hero concept still being set up. */
export default function OptionPlaceholder({ label }: { label?: string }) {
  return (
    <section className="placeholder">
      <div className="placeholder__inner">
        <p className="placeholder__eyebrow">{label ?? "Next concept"}</p>
        <h2 className="placeholder__headline">Being set&nbsp;up.</h2>
        <p className="placeholder__body">
          This hero flow is on the way. Use the switcher below to jump back to
          the options that are ready.
        </p>
      </div>
    </section>
  );
}
