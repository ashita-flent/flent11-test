import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionNav from "./components/SectionNav";
import { SECTIONS } from "./sections/registry";
import { useSmoothScroll } from "./lib/useSmoothScroll";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

const INITIAL: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s.versions[0].id])
);

export default function App() {
  const lenisRef = useSmoothScroll();
  const [selected, setSelected] = useState<Record<string, string>>(INITIAL);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const sectionEls = useRef<Record<string, HTMLDivElement>>({});
  const lastChanged = useRef<string | null>(null);

  // Track which section is at the viewport centre → drives the nav.
  useLayoutEffect(() => {
    const triggers = SECTIONS.map((s) => {
      const el = sectionEls.current[s.id];
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) setActiveSection(s.id);
        },
      });
    }).filter(Boolean) as ScrollTrigger[];

    ScrollTrigger.refresh();
    return () => triggers.forEach((t) => t.kill());
  }, []);

  // On version change: re-measure pinned layouts and snap to that section so
  // the newly picked version is seen from its start.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const sec = lastChanged.current;
      const el = sec ? sectionEls.current[sec] : null;
      if (el && lenisRef.current) {
        lenisRef.current.scrollTo(el, { immediate: true });
      }
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(raf);
  }, [selected, lenisRef]);

  const handleSelectVersion = (sectionId: string, versionId: string) => {
    setSelected((prev) => {
      if (prev[sectionId] === versionId) return prev;
      lastChanged.current = sectionId;
      return { ...prev, [sectionId]: versionId };
    });
  };

  const handleJumpSection = (sectionId: string) => {
    const el = sectionEls.current[sectionId];
    if (el && lenisRef.current) lenisRef.current.scrollTo(el);
  };

  return (
    <main>
      {SECTIONS.map((section) => {
        const version =
          section.versions.find((v) => v.id === selected[section.id]) ??
          section.versions[0];
        const V = version.Component;
        return (
          <div
            key={section.id}
            className="section"
            data-section={section.id}
            ref={(el) => {
              if (el) sectionEls.current[section.id] = el;
            }}
          >
            {/* key forces a clean remount so pinned ScrollTriggers rebuild */}
            <V key={version.id} />
          </div>
        );
      })}

      <SectionNav
        sections={SECTIONS}
        activeSection={activeSection}
        selected={selected}
        onSelectVersion={handleSelectVersion}
        onJumpSection={handleJumpSection}
      />
    </main>
  );
}
