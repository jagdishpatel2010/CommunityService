import { useState, useEffect, useCallback } from 'react';
import { complaintApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';

/**
 * Fetches a role-scoped, filtered list of complaints. The backend decides
 * which complaints the caller may see based on their role, so the same hook
 * powers the user, staff and admin lists.
 *
 * @param {object} filters - { search, category, status, priority }.
 * @returns {{items: object[], loading: boolean, error: string, reload: Function}}
 */
export function useComplaints(filters) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Serialise filters so the effect re-runs only when a value actually changes.
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Drop empty filter values so we don't send blank query params.
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      );
      const data = await complaintApi.list(params);
      setItems(data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
