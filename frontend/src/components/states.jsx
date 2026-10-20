/**
 * Reusable loading / error / empty state components. Centralising them keeps
 * every list and detail screen consistent and satisfies the brief's
 * "Loading, Error & Empty-State Handling" requirement.
 */

/** Full-block spinner with an optional label. */
export function Loading({ label = 'Loading...' }) {
  return (
    <div className="state">
      <div className="spinner" />
      <div>{label}</div>
    </div>
  );
}

/**
 * Error panel with an optional retry button.
 *
 * @param {{message: string, onRetry?: Function}} props
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="state">
      <div className="emoji">⚠️</div>
      <div>{message || 'Something went wrong.'}</div>
      {onRetry && (
        <button className="btn btn-ghost btn-sm mt-16" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Empty-state placeholder.
 *
 * @param {{title?: string, message?: string, action?: React.ReactNode}} props
 */
export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="state">
      <div className="emoji">📭</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {message && <div style={{ marginTop: 4 }}>{message}</div>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  );
}

/** Inline error alert (for form submissions). */
export function AlertError({ children }) {
  if (!children) return null;
  return <div className="alert alert-error">{children}</div>;
}

/** Inline success alert. */
export function AlertSuccess({ children }) {
  if (!children) return null;
  return <div className="alert alert-success">{children}</div>;
}
