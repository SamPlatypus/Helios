import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Chrome } from "@/components/orrery/chrome";
import { registerOfflineWorker } from "@/lib/solar/register-sw";

const OrreryScene = lazy(() =>
  import("@/components/orrery/scene").then((mod) => ({ default: mod.OrreryScene })),
);

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    registerOfflineWorker();
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0 touch-none overflow-hidden">
        {ready ? (
          <Suspense fallback={null}>
            <OrreryScene />
          </Suspense>
        ) : null}
      </div>
      <Chrome />
    </main>
  );
}
