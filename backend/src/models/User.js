import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Application roles.
 * - user:  reports complaints and tracks them.
 * - staff: works on assigned complaints.
 * - admin: manages everything.
 */
export const ROLES = ['user', 'staff', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, default: '' },
    // Password is always stored hashed (see pre-save hook); never returned by default.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    // For staff members: their area of expertise (e.g. Electrical, Plumbing).
    department: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compares a plaintext candidate password against the stored hash.
 *
 * @param {string} candidate - Plaintext password supplied at login.
 * @returns {Promise<boolean>} True when the password matches.
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Returns a plain object safe to send to clients (no password field).
 *
 * @returns {object} Sanitized user representation.
 */
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);
