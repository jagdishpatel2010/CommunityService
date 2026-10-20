import { useEffect, useState } from 'react';
import { complaintApi } from '../api/services.js';

/**
 * Search + category/status/priority filter toolbar. Lifts filter state up via
 * onChange. Debounces the free-text search so we don't fire a request on every
 * keystroke.
 *
 * @param {{filters: object, onChange: Function}} props
 */
export default function ComplaintFilters({ filters, onChange }) {
  const [options, setOptions] = useState({ categories: [], statuses: [], priorities: [] });
  const [searchText, setSearchText] = useState(filters.search || '');

  // Load enum options once for the dropdowns.
  useEffect(() => {
    complaintApi
      .options()
      .then(setOptions)
      .catch(() => {}); // non-fatal; dropdowns just stay empty
  }, []);

  // Debounce search input -> propagate after the user pauses typing.
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchText !== (filters.search || '')) {
        onChange({ ...filters, search: searchText });
      }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="toolbar">
      <div className="field grow">
        <label>Search</label>
        <input
          className="input"
          placeholder="Search by ticket, title or description..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Category</label>
        <select
          className="select"
          value={filters.category || ''}
          onChange={(e) => set('category', e.target.value)}
        >
          <option value="">All</option>
          {options.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Status</label>
        <select
          className="select"
          value={filters.status || ''}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">All</option>
          {options.statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Priority</label>
        <select
          className="select"
          value={filters.priority || ''}
          onChange={(e) => set('priority', e.target.value)}
        >
          <option value="">All</option>
          {options.priorities.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
