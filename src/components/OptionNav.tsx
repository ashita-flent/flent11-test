import type { HeroOption } from "../options/registry";
import "./OptionNav.css";

type Props = {
  options: HeroOption[];
  active: string;
  onSelect: (id: string) => void;
};

/** Fixed bottom switcher for navigating between hero motion concepts. */
export default function OptionNav({ options, active, onSelect }: Props) {
  return (
    <nav className="optnav" aria-label="Hero concepts">
      <span className="optnav__title">Hero</span>
      <div className="optnav__pills">
        {options.map((o) => {
          const isActive = o.id === active;
          return (
            <button
              key={o.id}
              type="button"
              className={`optnav__pill${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelect(o.id)}
            >
              <span className="optnav__index">{o.index}</span>
              <span className="optnav__label">{o.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
