import { createFileRoute } from "@tanstack/react-router";
import { RoveApp } from "@/components/rove/RoveApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <RoveApp />;
}
