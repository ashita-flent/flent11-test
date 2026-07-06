import HeroPluck from "./components/HeroPluck";
import { useSmoothScroll } from "./lib/useSmoothScroll";
import "./App.css";

export default function App() {
  useSmoothScroll();

  return (
    <main>
      <HeroPluck />

      {/* Placeholder next section — the full-bleed cover resolves into this.
          Shares the box grey so the hand-off reads as continuous. */}
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
    </main>
  );
}
