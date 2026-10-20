import mongoose from 'mongoose';

export const CATEGORIES = [
  'Water Leakage',
  'Electrical',
  'Infrastructure',
  'Sanitation',
  'Security',
  'Maintenance',
  'Other',
];

export const STATUSES = [
  'Pending', // just submitted, not yet assigned
  'Assigned', // admin assigned to a staff member
  'Accepted', // staff accepted the task
  'In Progress', // staff is actively working
  'Resolved', // work done, awaiting user feedback / closed
  'Rejected', // closed without resolution
];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

/**
 * A single entry in a complaint's status timeline. Captures what changed,
 * when, by whom, and an optional note so the full history is auditable.
 */
const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, trim: true, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/** User feedback captured after a complaint is resolved. */
const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    // Human-friendly ticket id, e.g. CMP-2026-000123. Generated on creation.
    ticketId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, trim: true, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Pending' },

    // Evidence image uploaded by the reporting user (relative path under /uploads).
    image: { type: String, default: '' },
    // Image uploaded by staff proving the work was completed.
    completionImage: { type: String, default: '' },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Free-text remarks added by staff/admin while working the complaint.
    remarks: { type: String, trim: true, default: '' },

    timeline: { type: [timelineEntrySchema], default: [] },
    feedback: { type: feedbackSchema, default: null },

    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);

/**
 * Generates the next sequential ticket id for the current year.
 * Format: CMP-<year>-<6 digit zero-padded counter>.
 *
 * @returns {Promise<string>} A unique ticket id.
 */
export async function generateTicketId() {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;
  // Find the highest existing ticket for this year to continue the sequence.
  const last = await Complaint.findOne({ ticketId: new RegExp(`^${prefix}`) })
    .sort({ ticketId: -1 })
    .select('ticketId')
    .lean();

  let next = 1;
  if (last?.ticketId) {
    const n = parseInt(last.ticketId.slice(prefix.length), 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(6, '0')}`;
}
