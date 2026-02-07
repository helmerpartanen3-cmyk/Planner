export default function Home() {
  return (
    <div className="flex h-full items-center justify-center font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to Clarity
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-zinc-400">
          Your desktop app is ready. Edit{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-zinc-200">
            app/page.tsx
          </code>{" "}
          to get started.
        </p>
        <div className="mt-4 flex gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-zinc-500">Running in Electron</span>
        </div>
      </main>
    </div>
  );
}
