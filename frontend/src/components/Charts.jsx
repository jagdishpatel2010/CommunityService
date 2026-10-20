/**
 * Lightweight, dependency-free SVG charts for the admin dashboard. Rolling
 * these by hand (instead of pulling in a charting library) keeps the bundle
 * small and avoids extra installs. All charts animate in via CSS transitions.
 */

// Shared colour palette aligned with the status/priority badge colours so the
// charts read consistently with the rest of the UI.
export const STATUS_COLORS = {
  Pending: '#d98300',
  Assigned: '#2b5ce6',
  Accepted: '#1668c4',
  'In Progress': '#5b3fd1',
  Resolved: '#1a9e5c',
  Rejected: '#d93a46',
};

export const PRIORITY_COLORS = {
  Low: '#8893a8',
  Medium: '#2b5ce6',
  High: '#d98300',
  Urgent: '#d93a46',
};

// A pleasant rotating palette for categories (which have no inherent colour).
const CATEGORY_PALETTE = [
  '#2b5ce6',
  '#1a9e5c',
  '#d98300',
  '#5b3fd1',
  '#0ea5a5',
  '#d93a46',
  '#e8b006',
];

/**
 * Turns a { key: count } map into a sorted array of slices, dropping zeros.
 *
 * @param {Record<string, number>} data - The breakdown map.
 * @param {Record<string, string>} [colors] - Optional fixed colour per key.
 * @returns {{label: string, value: number, color: string}[]}
 */
function toSlices(data, colors) {
  return Object.entries(data || {})
    .filter(([, v]) => v > 0)
    .map(([label, value], i) => ({
      label,
      value,
      color: colors?.[label] || CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }));
}

/**
 * Describes an SVG arc path for a donut segment.
 *
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} r - Radius.
 * @param {number} start - Start angle (degrees).
 * @param {number} end - End angle (degrees).
 * @returns {string} SVG path `d` attribute.
 */
function arcPath(cx, cy, r, start, end) {
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(start));
  const y1 = cy + r * Math.sin(rad(start));
  const x2 = cx + r * Math.cos(rad(end));
  const y2 = cy + r * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/**
 * Donut chart with a centre total and a legend. Ideal for the status split.
 *
 * @param {{title: string, data: Record<string, number>, colors?: Record<string,string>}} props
 */
export function DonutChart({ title, data, colors }) {
  const slices = toSlices(data, colors);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const stroke = 22;

  // Build cumulative angles for each slice.
  let acc = 0;
  const arcs = slices.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return { ...s, start, end };
  });

  return (
    <div className="card">
      <h3 className="chart-title">{title}</h3>
      {total === 0 ? (
        <p className="hint mb-0">No data yet.</p>
      ) : (
        <div className="donut-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
            {/* Track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f6" strokeWidth={stroke} />
            {/* Slices (a full single slice is drawn as a ring to avoid a 360° arc gap) */}
            {arcs.length === 1 ? (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arcs[0].color}
                strokeWidth={stroke}
              />
            ) : (
              arcs.map((a) => (
                <path
                  key={a.label}
                  d={arcPath(cx, cy, r, a.start, a.end)}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                />
              ))
            )}
            {/* Centre total */}
            <text x={cx} y={cy - 2} textAnchor="middle" className="donut-total">
              {total}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" className="donut-sub">
              total
            </text>
          </svg>

          <ul className="legend">
            {slices.map((s) => (
              <li key={s.label}>
                <span className="legend-dot" style={{ background: s.color }} />
                <span className="legend-label">{s.label}</span>
                <span className="legend-value">
                  {s.value}
                  <span className="legend-pct">
                    {' '}({Math.round((s.value / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal bar chart. Good for category/priority breakdowns where labels can
 * be long. Bars animate their width on mount.
 *
 * @param {{title: string, data: Record<string, number>, colors?: Record<string,string>}} props
 */
export function BarChart({ title, data, colors }) {
  const slices = toSlices(data, colors).sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...slices.map((s) => s.value));

  return (
    <div className="card">
      <h3 className="chart-title">{title}</h3>
      {slices.length === 0 ? (
        <p className="hint mb-0">No data yet.</p>
      ) : (
        <div className="hbars">
          {slices.map((s) => (
            <div className="hbar-row" key={s.label}>
              <span className="hbar-label" title={s.label}>{s.label}</span>
              <div className="hbar-track">
                <div
                  className="hbar-fill"
                  style={{ width: `${(s.value / max) * 100}%`, background: s.color }}
                >
                  <span className="hbar-value">{s.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
