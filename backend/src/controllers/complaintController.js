import {
  Complaint,
  generateTicketId,
  CATEGORIES,
  STATUSES,
  PRIORITIES,
} from '../models/Complaint.js';
import { User } from '../models/User.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { requireFields, assertEnum } from '../utils/validate.js';

/** Fields populated for client responses so names/emails are readable. */
const POPULATE = [
  { path: 'createdBy', select: 'name email phone' },
  { path: 'assignedTo', select: 'name email department' },
];

/**
 * Appends a timeline entry describing a status change and keeps the
 * complaint's current status in sync.
 *
 * @param {object} complaint - The complaint document.
 * @param {string} status - New status value.
 * @param {object} actor - The user performing the change.
 * @param {string} [note] - Optional human-readable note.
 */
function pushTimeline(complaint, status, actor, note = '') {
  complaint.status = status;
  complaint.timeline.push({
    status,
    note,
    changedBy: actor._id,
    changedByName: actor.name,
    at: new Date(),
  });
}

/**
 * POST /api/complaints
 * Any authenticated user creates a complaint. An optional evidence image is
 * handled by the upload middleware (req.file).
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, location, priority } = req.body;
  requireFields(req.body, ['title', 'description', 'category']);
  assertEnum(category, CATEGORIES, 'category');
  if (priority) assertEnum(priority, PRIORITIES, 'priority');

  const ticketId = await generateTicketId();
  const complaint = await Complaint.create({
    ticketId,
    title,
    description,
    category,
    location: location || '',
    priority: priority || 'Medium',
    status: 'Pending',
    image: req.file ? `/uploads/${req.file.filename}` : '',
    createdBy: req.user._id,
    timeline: [
      {
        status: 'Pending',
        note: 'Complaint submitted',
        changedBy: req.user._id,
        changedByName: req.user.name,
      },
    ],
  });

  const populated = await complaint.populate(POPULATE);
  res.status(201).json({ complaint: populated });
});

/**
 * GET /api/complaints
 * Returns complaints scoped to the caller's role, with search + filtering:
 * - user:  only their own complaints
 * - staff: only complaints assigned to them
 * - admin: all complaints
 * Query params: search, category, status, priority, page, limit.
 */
export const listComplaints = asyncHandler(async (req, res) => {
  const { search, category, status, priority } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (req.user.role === 'user') filter.createdBy = req.user._id;
  else if (req.user.role === 'staff') filter.assignedTo = req.user._id;

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    // Case-insensitive match on ticket id, title or description.
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [{ ticketId: re }, { title: re }, { description: re }];
  }

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
});

/**
 * GET /api/complaints/:id
 * Returns a single complaint. Users may only view their own; staff only those
 * assigned to them; admins may view any.
 */
export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(POPULATE);
  if (!complaint) throw httpError(404, 'Complaint not found');

  assertCanView(req.user, complaint);
  res.json({ complaint });
});

/**
 * Authorization helper: throws 403 unless the user may view the complaint.
 *
 * @param {object} user - The requesting user.
 * @param {object} complaint - The target complaint.
 */
function assertCanView(user, complaint) {
  if (user.role === 'admin') return;
  const ownerId = complaint.createdBy?._id?.toString() || complaint.createdBy?.toString();
  const assigneeId =
    complaint.assignedTo?._id?.toString() || complaint.assignedTo?.toString();
  if (user.role === 'user' && ownerId === user._id.toString()) return;
  if (user.role === 'staff' && assigneeId === user._id.toString()) return;
  throw httpError(403, 'You are not allowed to view this complaint');
}

/**
 * PUT /api/complaints/:id/assign   (admin only)
 * Assigns a complaint to a staff member and optionally sets priority.
 */
export const assignComplaint = asyncHandler(async (req, res) => {
  const { staffId, priority } = req.body;
  requireFields(req.body, ['staffId']);

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw httpError(404, 'Complaint not found');

  const staff = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
  if (!staff) throw httpError(400, 'Selected staff member is invalid');

  complaint.assignedTo = staff._id;
  if (priority) {
    assertEnum(priority, PRIORITIES, 'priority');
    complaint.priority = priority;
  }
  pushTimeline(complaint, 'Assigned', req.user, `Assigned to ${staff.name}`);
  await complaint.save();

  res.json({ complaint: await complaint.populate(POPULATE) });
});

/**
 * PUT /api/complaints/:id/priority   (admin only)
 * Updates the priority without changing assignment.
 */
export const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  requireFields(req.body, ['priority']);
  assertEnum(priority, PRIORITIES, 'priority');

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw httpError(404, 'Complaint not found');

  complaint.priority = priority;
  await complaint.save();
  res.json({ complaint: await complaint.populate(POPULATE) });
});

/**
 * PUT /api/complaints/:id/status   (staff for own assignments, admin for any)
 * Drives the work lifecycle: Accepted -> In Progress -> Resolved / Rejected.
 * Staff may upload a completion image when resolving.
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, remarks } = req.body;
  requireFields(req.body, ['status']);
  assertEnum(status, STATUSES, 'status');

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw httpError(404, 'Complaint not found');

  // Staff can only update complaints assigned to them.
  if (req.user.role === 'staff') {
    const assigneeId = complaint.assignedTo?.toString();
    if (assigneeId !== req.user._id.toString()) {
      throw httpError(403, 'This complaint is not assigned to you');
    }
  }

  if (remarks !== undefined) complaint.remarks = remarks;
  if (req.file) complaint.completionImage = `/uploads/${req.file.filename}`;
  if (status === 'Resolved') complaint.resolvedAt = new Date();

  pushTimeline(complaint, status, req.user, note || '');
  await complaint.save();

  res.json({ complaint: await complaint.populate(POPULATE) });
});

/**
 * POST /api/complaints/:id/feedback   (owner only, after resolution)
 * Lets the reporting user rate the resolution 1-5 with an optional comment.
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  requireFields(req.body, ['rating']);
  const numeric = Number(rating);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    throw httpError(400, 'Rating must be an integer between 1 and 5');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw httpError(404, 'Complaint not found');

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw httpError(403, 'Only the complaint owner can give feedback');
  }
  if (complaint.status !== 'Resolved') {
    throw httpError(400, 'Feedback can only be given after resolution');
  }

  complaint.feedback = { rating: numeric, comment: comment || '', at: new Date() };
  await complaint.save();
  res.json({ complaint: await complaint.populate(POPULATE) });
});

/** GET /api/complaints/meta/options — enum values for building forms/filters. */
export const getOptions = asyncHandler(async (req, res) => {
  res.json({ categories: CATEGORIES, statuses: STATUSES, priorities: PRIORITIES });
});
