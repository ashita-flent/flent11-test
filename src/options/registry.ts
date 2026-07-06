import type { ComponentType } from "react";
import OptionPluck from "./OptionPluck";
import OptionMask from "./OptionMask";

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
    id: "mask",
    index: "02",
    label: "Unmask",
    Component: OptionMask,
  },
];
