import { router } from "expo-router";

import { EmptyState } from "@/ui/trove";

import { HomeContent } from "./home-content";
import { HomeEmpty } from "./home-empty";
import { HomeSkeleton } from "./home-skeleton";
import type { HomeData } from "./use-home-data";

interface HomeBodyProps {
  readonly home: HomeData;
  readonly empty: boolean;
  readonly onOpenDue: () => void;
  readonly onRetry: () => void;
}

/** What scrolls under the pinned header: first run, loading, unavailable, or the board. */
export function HomeBody({ home, empty, onOpenDue, onRetry }: HomeBodyProps) {
  if (empty) {
    return (
      <HomeEmpty
        currency={home.currency}
        onAddAccount={() => router.push("/accounts/new")}
        onSetUpCategories={() => router.push("/categories/new")}
      />
    );
  }
  if (home.isLoading) return <HomeSkeleton />;
  if (home.isError) {
    return (
      <EmptyState
        actionLabel="Try again"
        icon="warning"
        message="Check your connection and try again."
        onAction={onRetry}
        title="Your overview is unavailable"
      />
    );
  }
  return <HomeContent home={home} onOpenDue={onOpenDue} />;
}
