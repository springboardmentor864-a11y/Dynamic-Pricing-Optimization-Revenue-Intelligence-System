import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "../pages/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PricePilot Dashboard — Revenue Intelligence" },
      {
        name: "description",
        content:
          "Track revenue trends, demand forecasts and AI pricing recommendations in one dashboard.",
      },
      { property: "og:title", content: "PricePilot Dashboard — Revenue Intelligence" },
      {
        property: "og:description",
        content:
          "Track revenue trends, demand forecasts and AI pricing recommendations in one dashboard.",
      },
    ],
  }),
  component: Dashboard,
});
