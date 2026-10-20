import { useState } from 'react';
import { complaintApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { AlertError } from './states.jsx';

/**
 * Lets the complaint owner rate a resolved complaint (1-5) with an optional
 * comment. Calls back to the parent with the updated complaint on success.
 *
 * @param {{complaintId: string, onUpdated: Function}} props
 */
export default function FeedbackForm({ complaintId, onUpdated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const { complaint } = await complaintApi.feedback(complaintId, { rating, comment });
      onUpdated(complaint, 'Thank you for your feedback!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mt-16">
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Rate the resolution</h3>
      <AlertError>{error}</AlertError>

      <form onSubmit={submit}>
        {/* Interactive star picker */}
        <div
          className="stars"
          style={{ cursor: 'pointer', fontSize: 26 }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              aria-label={`${n} star`}
            >
              {(hover || rating) >= n ? '★' : '☆'}
            </span>
          ))}
        </div>

        <div className="field mt-16">
          <label htmlFor="comment">Comment (optional)</label>
          <textarea
            id="comment"
            className="textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the service?"
          />
        </div>

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
