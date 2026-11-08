import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <main className="h-dvh overflow-y-auto bg-bg px-5 py-8 text-fg">
      <article className="mx-auto flex w-full max-w-md flex-col gap-5 pb-16">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted">Helios</p>
          <h1 className="font-display text-2xl">Privacy</h1>
        </header>
        <p className="text-base leading-relaxed text-muted">
          Helios is an offline orrery. It does not create an account, and it does not send location, contacts, or
          usage data anywhere.
        </p>
        <p className="text-base leading-relaxed text-muted">
          Orbital elements and planet facts are stored in the app itself. Display choices such as speed and labels
          stay in local storage on this device. The simulation clock starts from your device’s date so “today” matches
          the real sky; that date is not uploaded.
        </p>
        <p className="text-base leading-relaxed text-muted">
          After the first load, a service worker can open the app without a network. That cache stays on the device.
          The installable manifest is what a Play Store wrapper (Trusted Web Activity) uses; no extra tracking is added
          for that.
        </p>
        <Link
          to="/"
          className="mt-2 flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-base text-fg"
        >
          Back to the orrery
        </Link>
      </article>
    </main>
  );
}
