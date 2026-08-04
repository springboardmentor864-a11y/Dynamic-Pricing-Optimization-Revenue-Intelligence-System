import { createFileRoute } from "@tanstack/react-router";
import Settings from "../pages/Settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PricePilot" },
      {
        name: "description",
        content: "Configure theme, backend URL, refresh interval and profile information.",
      },
      { property: "og:title", content: "Settings — PricePilot" },
      {
        property: "og:description",
        content: "Configure theme, backend URL, refresh interval and profile information.",
      },
    ],
  }),
  component: Settings,
});
