/**
 * Small presentational helpers shared across screens: status/priority badges,
 * a star rating display, formatted dates and a simple modal.
 */

/**
 * Coloured badge for a complaint status.
 *
 * @param {{status: string}} props
 */
export function StatusBadge({ status }) {
  // CSS class names cannot contain spaces, so "In Progress" -> "InProgress".
  const cls = `badge badge-${(status || '').replace(/\s/g, '')}`;
  return <span className={cls}>{status}</span>;
}

/**
 * Coloured badge for a priority level.
 *
 * @param {{priority: string}} props
 */
export function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

/**
 * Renders a 1-5 star rating.
 *
 * @param {{value: number}} props
 */
export function Stars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span className="stars" title={`${value} / 5`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  );
}

/**
 * Formats an ISO date string for display.
 *
 * @param {string} iso - ISO date.
 * @returns {string} Localised date-time.
 */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Basic modal dialog.
 *
 * @param {{title: string, onClose: Function, children: React.ReactNode}} props
 */
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
