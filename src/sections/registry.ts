import type { ComponentType } from "react";
import HeroPluck from "../components/HeroPluck";
import HeroMask from "../components/HeroMask";
import HeroCalendar from "../components/HeroCalendar";
import { ExchangeFold, HowFold, TrustFold, CtaFold } from "./folds/Folds";

export type Version = { id: string; label: string; Component: ComponentType };
export type Section = { id: string; label: string; versions: Version[] };

/**
 * The landing page is a stack of sections; each section can hold multiple
 * design versions. The bottom nav is section-aware — it shows the version
 * pills for whichever section is currently in view. Add a version to any
 * section here and it appears in the switcher automatically.
 */
export const SECTIONS: Section[] = [
  {
    id: "hero",
    label: "Hero",
    versions: [
      { id: "pluck", label: "Pluck", Component: HeroPluck },
      { id: "mask", label: "Unmask", Component: HeroMask },
      { id: "calendar", label: "Calendar", Component: HeroCalendar },
    ],
  },
  {
    id: "exchange",
    label: "Exchange",
    versions: [{ id: "v1", label: "V1", Component: ExchangeFold }],
  },
  {
    id: "how",
    label: "How",
    versions: [{ id: "v1", label: "V1", Component: HowFold }],
  },
  {
    id: "trust",
    label: "Trust",
    versions: [{ id: "v1", label: "V1", Component: TrustFold }],
  },
  {
    id: "cta",
    label: "Register",
    versions: [{ id: "v1", label: "V1", Component: CtaFold }],
  },
];
