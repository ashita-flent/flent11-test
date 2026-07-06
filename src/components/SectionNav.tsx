import type { Section } from "../sections/registry";
import "./SectionNav.css";

type Props = {
  sections: Section[];
  activeSection: string;
  selected: Record<string, string>;
  onSelectVersion: (sectionId: string, versionId: string) => void;
  onJumpSection: (sectionId: string) => void;
};

/**
 * Section-aware bottom nav. Left: a dot per fold (jump to it, active one lit).
 * Right: the current fold's name + its version pills. Everything on the right
 * swaps as you scroll into a different section.
 */
export default function SectionNav({
  sections,
  activeSection,
  selected,
  onSelectVersion,
  onJumpSection,
}: Props) {
  const current =
    sections.find((s) => s.id === activeSection) ?? sections[0];
  const multi = current.versions.length > 1;

  return (
    <nav className="snav" aria-label="Landing page sections">
      <div className="snav__dots">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`snav__dot${s.id === activeSection ? " is-active" : ""}`}
            onClick={() => onJumpSection(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={s.id === activeSection}
            title={s.label}
          />
        ))}
      </div>

      <span className="snav__divider" />

      <span className="snav__section">{current.label}</span>

      <div className={`snav__pills${multi ? "" : " snav__pills--single"}`}>
        {current.versions.map((v) => {
          const isActive = selected[current.id] === v.id;
          return (
            <button
              key={v.id}
              type="button"
              className={`snav__pill${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelectVersion(current.id, v.id)}
              disabled={!multi}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
