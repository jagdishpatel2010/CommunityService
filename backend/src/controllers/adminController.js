import { Complaint, STATUSES, CATEGORIES } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { requireFields, assertEmail, assertPassword, assertEnum } from '../utils/validate.js';

/**
 * GET /api/admin/stats   (admin only)
 * Aggregated numbers for the admin dashboard: totals, breakdown by status,
 * by category, by priority, recent complaints and average feedback rating.
 */
export const getStats = asyncHandler(async (req, res) => {
  const [total, byStatusAgg, byCategoryAgg, byPriorityAgg, ratingAgg, recent, counts] =
    await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Complaint.aggregate([
        { $match: { 'feedback.rating': { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
      ]),
      Complaint.find()
        .populate([
          { path: 'createdBy', select: 'name' },
          { path: 'assignedTo', select: 'name' },
        ])
        .sort({ createdAt: -1 })
        .limit(5),
      Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'staff' }),
      ]),
    ]);

  // Normalise aggregation arrays into { key: count } maps, filling in zeros.
  const toMap = (arr, keys) => {
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    arr.forEach(({ _id, count }) => {
      if (_id != null) map[_id] = count;
    });
    return map;
  };

  const byStatus = toMap(byStatusAgg, STATUSES);
  res.json({
    total,
    pending: byStatus['Pending'] || 0,
    resolved: byStatus['Resolved'] || 0,
    inProgress: (byStatus['In Progress'] || 0) + (byStatus['Accepted'] || 0),
    byStatus,
    byCategory: toMap(byCategoryAgg, CATEGORIES),
    byPriority: byPriorityAgg.reduce((acc, { _id, count }) => {
      if (_id) acc[_id] = count;
      return acc;
    }, {}),
    avgRating: ratingAgg[0] ? Number(ratingAgg[0].avg.toFixed(2)) : null,
    ratingCount: ratingAgg[0]?.count || 0,
    totalUsers: counts[0],
    totalStaff: counts[1],
    recent,
  });
});

/**
 * GET /api/admin/users   (admin only)
 * Lists accounts, optionally filtered by role via ?role=user|staff|admin.
 */
export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafeObject()) });
});

/**
 * POST /api/admin/staff   (admin only)
 * Creates a staff account with a department.
 */
export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department } = req.body;
  requireFields(req.body, ['name', 'email', 'password', 'department']);
  assertEmail(email);
  assertPassword(password);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw httpError(409, 'An account with this email already exists');

  const staff = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    department,
    role: 'staff',
  });
  res.status(201).json({ user: staff.toSafeObject() });
});

/**
 * PATCH /api/admin/users/:id/active   (admin only)
 * Enables or disables an account. Admins cannot deactivate themselves.
 */
export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') throw httpError(400, 'isActive must be a boolean');
  if (req.params.id === req.user._id.toString()) {
    throw httpError(400, 'You cannot change your own active status');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  user.isActive = isActive;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

/**
 * PATCH /api/admin/users/:id/role   (admin only)
 * Changes a user's role. Admins cannot change their own role.
 */
export const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  assertEnum(role, ['user', 'staff', 'admin'], 'role');
  if (req.params.id === req.user._id.toString()) {
    throw httpError(400, 'You cannot change your own role');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  user.role = role;
  await user.save();
  res.json({ user: user.toSafeObject() });
});

/** GET /api/admin/staff — list of active staff (used for assignment dropdowns). */
export const listStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: 'staff', isActive: true }).sort({ name: 1 });
  res.json({ staff: staff.map((s) => s.toSafeObject()) });
});
