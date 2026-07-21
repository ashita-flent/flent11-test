import { useState } from "react";
import HeroPill from "./sections/hero/HeroPill";
import LockinCards from "./sections/lockin/LockinCards";
import HowItWorks from "./sections/how/HowItWorks";
import Upfront from "./sections/upfront/Upfront";
import ExitCalc from "./sections/exit/ExitCalc";
import Trust from "./sections/trust/Trust";
import Proof from "./sections/proof/Proof";
import Faq from "./sections/faq/Faq";
import Footer from "./sections/footer/Footer";

/**
 * The final Flent site. Sections stack top-to-bottom and are added one at a
 * time — the keyhole → seasons hero, the scroll-driven "how it works"
 * journey, the exit calculator, then the closing run: trust cards, the
 * lock-in split comparison, the pay-upfront break (click-open detail),
 * social proof, FAQ, and the puzzle footer (which closes with the legal
 * bar). Keep the order here matching the page flow.
 */
export default function App() {
  // The tenant's monthly rent — set on the journey's intro slide; every ₹
  // figure downstream derives from it (journey steps, upfront act, exit calc)
  const [rent, setRent] = useState(45_000);

  return (
    <main>
      <HeroPill />
      <HowItWorks rent={rent} onRentChange={setRent} />
      <div className="exit-trust-wash">
        <ExitCalc rent={rent} onRentChange={setRent} />
        <Trust />
      </div>
      <LockinCards />
      <Upfront rent={rent} />
      <Faq />
      <Proof />
      <Footer />
    </main>
  );
}
