import { createFileRoute } from "@tanstack/react-router";
import { BooksPage } from "@/components/rove/Ledger";

export const Route = createFileRoute("/books")({
  component: BooksPage,
  head: () => ({
    meta: [
      { title: "Books · 8020Ride" },
      {
        name: "description",
        content:
          "Open books for 8020Ride: driver proceeds, employee pay, c-suite salary, nonprofit gifts, political gifts, and profit.",
      },
    ],
  }),
});
