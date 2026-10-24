import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  Freshness,
  LiveEarly,
  LiveRefresh,
  PlainWordsTable,
  Scope,
  SourceRepo,
  SupportEmail,
} from "./code-facts";
import { ImageSlot } from "./image-slot";
import { InSimpleDash } from "./in-simpledash";
import { FreeDays, MonthsFree, PlanFeatures, Price } from "./plan-facts";

/** Every component a content page may use (docs/SPEC.md section 30). */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Callout,
    Card,
    Cards,
    Step,
    Steps,
    Tab,
    Tabs,
    ImageSlot,
    InSimpleDash,
    FreeDays,
    Freshness,
    LiveEarly,
    LiveRefresh,
    MonthsFree,
    PlainWordsTable,
    Scope,
    SourceRepo,
    SupportEmail,
    PlanFeatures,
    Price,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
