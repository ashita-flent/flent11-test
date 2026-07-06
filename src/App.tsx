import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import OptionNav from "./components/OptionNav";
import { OPTIONS } from "./options/registry";
import { useSmoothScroll } from "./lib/useSmoothScroll";
import "./App.css";

export default function App() {
  const lenisRef = useSmoothScroll();
  const [active, setActive] = useState(OPTIONS[0].id);

  const current = OPTIONS.find((o) => o.id === active) ?? OPTIONS[0];
  const Current = current.Component;

  // Reset to the top and re-measure whenever the active option changes, so
  // each pinned scroll experience starts clean.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [active, lenisRef]);

  return (
    <main>
      {/* key forces a clean remount → old ScrollTriggers revert, new ones build */}
      <Current key={current.id} {...current.props} />

      <OptionNav options={OPTIONS} active={active} onSelect={setActive} />
    </main>
  );
}
