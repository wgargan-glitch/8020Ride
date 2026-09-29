import { createFileRoute } from "@tanstack/react-router";
import { PoliticsPage } from "@/components/rove/Ledger";

export const Route = createFileRoute("/politics")({
  component: PoliticsPage,
  head: () => ({
    meta: [
      { title: "Gifts to politicians · 8020Ride" },
      {
        name: "description",
        content: "Who 8020Ride has given political money to, how much, and why.",
      },
    ],
  }),
});
