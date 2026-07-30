'use client';

import { useEffect } from 'react';

const GLOBAL_ERROR_STYLES = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: #f7f5f0;
    color: #1f2937;
    font-family: Arial, Helvetica, sans-serif;
  }
  .luxa-global-error {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 24px;
  }
  .luxa-global-error__card {
    width: min(100%, 520px);
    border: 1px solid #d9d5cc;
    background: #fffdfa;
    padding: 32px;
  }
  .luxa-global-error__brand {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #176c57;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .luxa-global-error__mark {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: 6px;
    background: #176c57;
    color: #ffffff;
    font-size: 14px;
    letter-spacing: 0;
  }
  .luxa-global-error h1 {
    margin: 28px 0 12px;
    max-width: 420px;
    font-size: clamp(32px, 7vw, 48px);
    line-height: 1.02;
    letter-spacing: -.045em;
  }
  .luxa-global-error p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.7;
  }
  .luxa-global-error__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 28px;
  }
  .luxa-global-error button {
    display: inline-flex;
    min-height: 46px;
    align-items: center;
    justify-content: center;
    border: 1px solid #176c57;
    border-radius: 6px;
    padding: 0 18px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }
    background: #176c57;
    color: #ffffff;
  }
  .luxa-global-error button.luxa-global-error__secondary {
    background: transparent;
    color: #176c57;
  }
  .luxa-global-error button:focus-visible {
    outline: 3px solid rgba(23, 108, 87, .28);
    outline-offset: 2px;
  }
  @media (max-width: 480px) {
    .luxa-global-error__card { padding: 24px; }
    .luxa-global-error__actions { grid-template-columns: 1fr; }
  }
  @media (prefers-color-scheme: dark) {
    body { background: #161b23; color: #f3f0ea; }
    .luxa-global-error__card {
      border-color: #3e4652;
      background: #1d232d;
    }
    .luxa-global-error p { color: #aab2bf; }
    .luxa-global-error__brand,
    .luxa-global-error button.luxa-global-error__secondary { color: #72d5b4; }
    .luxa-global-error__mark,
    .luxa-global-error button {
      border-color: #72d5b4;
      background: #72d5b4;
      color: #10251e;
    }
    .luxa-global-error button.luxa-global-error__secondary {
      border-color: #4b5a63;
      background: transparent;
    }
  }
`;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Workspace unavailable | Luxa</title>
        <meta
          name="description"
          content="Luxa encountered a temporary workspace interruption."
        />
        <style>{GLOBAL_ERROR_STYLES}</style>
      </head>
      <body>
        <main className="luxa-global-error">
          <section className="luxa-global-error__card">
            <div className="luxa-global-error__brand">
              <span className="luxa-global-error__mark">L</span>
              Luxa protected recovery
            </div>
            <h1>The workspace needs a moment.</h1>
            <p>
              Luxa could not finish loading this view. Your account remains protected;
              retry now or return to the secure entry point.
            </p>
            <div className="luxa-global-error__actions">
              <button type="button" onClick={unstable_retry}>
                Try again
              </button>
              <button
                type="button"
                className="luxa-global-error__secondary"
                onClick={() => window.location.assign('/')}
              >
                Return to Luxa
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
