'use client'

// Last-resort error screen (only used if the root layout itself crashes).
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: '#666', maxWidth: 320 }}>
          The app could not start. Please try again. If it keeps happening, check the Supabase keys in your environment variables.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
