import { createFileRoute } from "@tanstack/react-router";
import Recommendations from "../pages/Recommendations";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Pricing Recommendations — PricePilot" },
      {
        name: "description",
        content: "AI-suggested price moves ranked by expected revenue impact and status.",
      },
      { property: "og:title", content: "Pricing Recommendations — PricePilot" },
      {
        property: "og:description",
        content: "AI-suggested price moves ranked by expected revenue impact and status.",
      },
    ],
  }),
  component: Recommendations,
});
