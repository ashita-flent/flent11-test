import type { ComponentType } from "react";
import OptionPluck from "./OptionPluck";
import OptionPlaceholder from "./OptionPlaceholder";

export type HeroOption = {
  id: string;
  index: string; // display index, e.g. "01"
  label: string;
  Component: ComponentType<{ label?: string }>;
  props?: { label?: string };
};

/**
 * Registry of hero motion concepts. Add a new entry here and it shows up in
 * the bottom switcher automatically. Each option owns its full scroll
 * experience; the switcher remounts them cleanly on change.
 */
export const OPTIONS: HeroOption[] = [
  {
    id: "pluck",
    index: "01",
    label: "Pluck",
    Component: OptionPluck,
  },
  {
    id: "option-2",
    index: "02",
    label: "Option 2",
    Component: OptionPlaceholder,
    props: { label: "Option 02" },
  },
];
