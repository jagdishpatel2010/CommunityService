import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { requireFields, assertEmail, assertPassword } from '../utils/validate.js';

/**
 * POST /api/auth/register
 * Registers a new end user. Role is forced to 'user' here; staff and admin
 * accounts are created only by an administrator (see userController).
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  requireFields(req.body, ['name', 'email', 'password']);
  assertEmail(email);
  assertPassword(password);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw httpError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: 'user',
  });

  const token = signToken({ id: user._id, role: user.role });
  res.status(201).json({ token, user: user.toSafeObject() });
});

/**
 * POST /api/auth/login
 * Authenticates any role and returns a JWT plus the sanitized user profile.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);

  // Password is select:false on the model, so request it explicitly here.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    // Same message for both cases to avoid user enumeration.
    throw httpError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw httpError(403, 'Your account has been deactivated');

  const token = signToken({ id: user._id, role: user.role });
  res.json({ token, user: user.toSafeObject() });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

/**
 * PUT /api/auth/me
 * Updates the current user's own profile (name/phone, optional password).
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password) {
    assertPassword(password);
    user.password = password; // re-hashed by the pre-save hook
  }
  await user.save();
  res.json({ user: user.toSafeObject() });
});
