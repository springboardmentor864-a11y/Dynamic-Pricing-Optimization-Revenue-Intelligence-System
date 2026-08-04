import { createFileRoute } from "@tanstack/react-router";
import Forecast from "../pages/Forecast";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Demand Forecast — PricePilot" },
      {
        name: "description",
        content: "Model-predicted demand, forecast accuracy and period-by-period history.",
      },
      { property: "og:title", content: "Demand Forecast — PricePilot" },
      {
        property: "og:description",
        content: "Model-predicted demand, forecast accuracy and period-by-period history.",
      },
    ],
  }),
  component: Forecast,
});
