/**
 * The casino table shell: a dark rail framing the felt, a gold masthead, a
 * version stamp. Cards, controls and state arrive in later phases.
 */
export default function App() {
  return (
    <div className="flex h-dvh flex-col gap-5 overflow-hidden bg-rail p-4 text-cream sm:p-8">
      <header className="shrink-0 text-center">
        <h1 className="font-serif text-2xl font-bold tracking-[0.3em] text-gold uppercase sm:text-4xl">
          Video Poker
          <span aria-hidden="true" className="mx-3 text-gold/50">
            ·
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] sm:text-xl">
            Jacks or Better
          </span>
        </h1>
      </header>

      {/* Rail: a bevelled frame that the felt sits inside. */}
      <div className="min-h-0 flex-1 rounded-[2.5rem] bg-rail p-2 shadow-[inset_0_1px_0_rgb(250_246_238/0.07),0_18px_50px_-12px_rgb(0_0_0/0.8)] ring-1 ring-gold/20 sm:p-3">
        <div className="h-full w-full rounded-[2rem] bg-[radial-gradient(ellipse_at_center,var(--color-felt)_35%,var(--color-felt-deep)_100%)] shadow-[inset_0_0_120px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(217_164_65/0.12)]" />
      </div>

      <footer className="shrink-0 text-center text-xs tracking-[0.25em] text-cream/40">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
