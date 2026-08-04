import { createFileRoute } from "@tanstack/react-router";
import Products from "../pages/Products";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — PricePilot" },
      {
        name: "description",
        content: "Search, filter and sort every product tracked by the PricePilot pricing engine.",
      },
      { property: "og:title", content: "Products — PricePilot" },
      {
        property: "og:description",
        content: "Search, filter and sort every product tracked by the PricePilot pricing engine.",
      },
    ],
  }),
  component: Products,
});
