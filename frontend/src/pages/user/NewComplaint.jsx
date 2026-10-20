import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintApi } from '../../api/services.js';
import { getErrorMessage } from '../../api/client.js';
import { AlertError } from '../../components/states.jsx';

/**
 * Create-complaint form with validation and an optional evidence image.
 * On success it navigates to the new complaint's detail page.
 */
export default function NewComplaint() {
  const navigate = useNavigate();

  const [options, setOptions] = useState({ categories: [], priorities: [] });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'Medium',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load category/priority options for the dropdowns.
  useEffect(() => {
    complaintApi
      .options()
      .then((o) => setOptions({ categories: o.categories, priorities: o.priorities }))
      .catch(() => {});
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /** Validates the selected file is an image under 5 MB, then previews it. */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    setErrors((prev) => ({ ...prev, image: undefined }));
    if (!file) {
      setImage(null);
      setPreview('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image must be smaller than 5 MB' }));
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  /** Field-level validation; returns true when the form is valid. */
  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    else if (form.title.trim().length < 5) next.title = 'Title is too short';
    if (!form.description.trim()) next.description = 'Description is required';
    else if (form.description.trim().length < 10)
      next.description = 'Please describe the issue in more detail';
    if (!form.category) next.category = 'Please choose a category';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0 && !errors.image;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Build multipart form data so the optional image is included.
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);

      const { complaint } = await complaintApi.create(fd);
      navigate(`/complaints/${complaint._id}`, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>New Complaint</h1>
          <div className="page-sub">Describe the issue and attach a photo if you can</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <AlertError>{serverError}</AlertError>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              className="input"
              value={form.title}
              onChange={update}
              placeholder="e.g. Water leakage in Block A corridor"
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              value={form.description}
              onChange={update}
              placeholder="Explain what the problem is, where, and since when..."
            />
            {errors.description && (
              <div className="field-error">{errors.description}</div>
            )}
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                className="select"
                value={form.category}
                onChange={update}
              >
                <option value="">Select a category</option>
                {options.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <div className="field-error">{errors.category}</div>}
            </div>

            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="select"
                value={form.priority}
                onChange={update}
              >
                {options.priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              className="input"
              value={form.location}
              onChange={update}
              placeholder="e.g. Block A, 2nd Floor"
            />
          </div>

          <div className="field">
            <label htmlFor="image">Evidence photo (optional)</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="input"
              onChange={handleFile}
            />
            {errors.image && <div className="field-error">{errors.image}</div>}
            {preview && <img src={preview} alt="Preview" className="evidence-img" />}
          </div>

          <div className="row mt-16">
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
