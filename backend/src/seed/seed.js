import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Complaint, generateTicketId } from '../models/Complaint.js';

/**
 * Seeds the database with Indian sample data: one admin, several staff across
 * departments, multiple users, and a spread of complaints covering every
 * status so the dashboard, timeline and feedback features are populated.
 *
 * Run with: npm run seed
 */

const PASSWORD = 'password123'; // shared demo password for all seeded accounts

const admin = {
  name: 'Rajesh Kumar',
  email: 'admin@community.in',
  phone: '9876500001',
  role: 'admin',
};

const staffMembers = [
  { name: 'Suresh Nair', email: 'suresh@community.in', phone: '9876500011', department: 'Electrical' },
  { name: 'Anjali Deshmukh', email: 'anjali@community.in', phone: '9876500012', department: 'Plumbing' },
  { name: 'Vikram Singh', email: 'vikram@community.in', phone: '9876500013', department: 'Infrastructure' },
  { name: 'Lakshmi Iyer', email: 'lakshmi@community.in', phone: '9876500014', department: 'Sanitation' },
  { name: 'Mohammed Faizal', email: 'faizal@community.in', phone: '9876500015', department: 'Security' },
];

const users = [
  { name: 'Priya Sharma', email: 'priya@community.in', phone: '9876500021' },
  { name: 'Arjun Reddy', email: 'arjun@community.in', phone: '9876500022' },
  { name: 'Sneha Patil', email: 'sneha@community.in', phone: '9876500023' },
  { name: 'Karthik Menon', email: 'karthik@community.in', phone: '9876500024' },
  { name: 'Divya Krishnan', email: 'divya@community.in', phone: '9876500025' },
];

/**
 * Complaint templates. staffIndex/userIndex reference the arrays above.
 * `flow` is a list of lifecycle steps applied in order to build the timeline.
 */
const complaintTemplates = [
  {
    title: 'Water leakage in Block A corridor',
    description:
      'Continuous water leakage from the ceiling near flat A-204. The corridor floor is always wet and slippery.',
    category: 'Water Leakage',
    location: 'Block A, 2nd Floor',
    priority: 'High',
    userIndex: 0,
    staffIndex: 1,
    flow: ['Assigned', 'Accepted', 'In Progress', 'Resolved'],
    feedback: { rating: 5, comment: 'Fixed quickly and neatly. Thank you!' },
  },
  {
    title: 'Street light not working near main gate',
    description:
      'The street light outside the main gate has been off for a week. It is very dark at night and feels unsafe.',
    category: 'Electrical',
    location: 'Main Gate',
    priority: 'Medium',
    userIndex: 1,
    staffIndex: 0,
    flow: ['Assigned', 'Accepted', 'In Progress'],
  },
  {
    title: 'Overflowing garbage bins behind Block C',
    description:
      'Garbage bins behind Block C have not been cleared for several days. Bad smell and stray animals around.',
    category: 'Sanitation',
    location: 'Block C, rear',
    priority: 'High',
    userIndex: 2,
    staffIndex: 3,
    flow: ['Assigned', 'Accepted'],
  },
  {
    title: 'Broken staircase railing',
    description: 'The railing on the staircase between 1st and 2nd floor of Block B is loose and dangerous.',
    category: 'Infrastructure',
    location: 'Block B staircase',
    priority: 'Urgent',
    userIndex: 3,
    staffIndex: 2,
    flow: ['Assigned'],
  },
  {
    title: 'Main gate CCTV camera is down',
    description: 'The CCTV camera covering the visitor parking has stopped recording since yesterday.',
    category: 'Security',
    location: 'Visitor Parking',
    priority: 'High',
    userIndex: 4,
    staffIndex: 4,
    flow: [], // still Pending
  },
  {
    title: 'Clogged drainage in parking area',
    description: 'Rainwater is not draining in the basement parking, causing water to collect near cars.',
    category: 'Water Leakage',
    location: 'Basement Parking',
    priority: 'Medium',
    userIndex: 0,
    staffIndex: 1,
    flow: ['Assigned', 'Accepted', 'In Progress', 'Resolved'],
    feedback: { rating: 4, comment: 'Resolved but took a couple of days.' },
  },
  {
    title: 'Lift making loud noise',
    description: 'The lift in Block A makes a loud grinding noise between floors. Please inspect urgently.',
    category: 'Maintenance',
    location: 'Block A Lift',
    priority: 'High',
    userIndex: 1,
    staffIndex: 2,
    flow: ['Assigned', 'Accepted'],
  },
  {
    title: 'Power fluctuation in Block D',
    description: 'Frequent voltage fluctuations in Block D are affecting appliances. Needs electrical inspection.',
    category: 'Electrical',
    location: 'Block D',
    priority: 'Medium',
    userIndex: 2,
    staffIndex: 0,
    flow: ['Assigned', 'Accepted', 'In Progress'],
  },
];

const NOTES = {
  Assigned: 'Complaint assigned to responsible staff',
  Accepted: 'Task accepted by staff',
  'In Progress': 'Work started on site',
  Resolved: 'Work completed and verified',
  Rejected: 'Closed without resolution',
};

/** Clears existing data and inserts the sample dataset. */
async function seed() {
  await connectDB();
  console.log('[seed] Clearing existing data...');
  await Promise.all([User.deleteMany({}), Complaint.deleteMany({})]);

  console.log('[seed] Creating users...');
  // create() triggers the password-hashing hook, so pass the plaintext here.
  const adminDoc = await User.create({ ...admin, password: PASSWORD });
  const staffDocs = await User.create(
    staffMembers.map((s) => ({ ...s, password: PASSWORD, role: 'staff' }))
  );
  const userDocs = await User.create(
    users.map((u) => ({ ...u, password: PASSWORD, role: 'user' }))
  );

  console.log('[seed] Creating complaints...');
  for (const tpl of complaintTemplates) {
    const owner = userDocs[tpl.userIndex];
    const staff = staffDocs[tpl.staffIndex];
    const ticketId = await generateTicketId();

    // Build the timeline starting from submission.
    const timeline = [
      {
        status: 'Pending',
        note: 'Complaint submitted',
        changedBy: owner._id,
        changedByName: owner.name,
        at: new Date(),
      },
    ];
    let status = 'Pending';
    let assignedTo = null;
    let resolvedAt = null;

    for (const step of tpl.flow) {
      const actor = step === 'Assigned' ? adminDoc : staff;
      if (step === 'Assigned') assignedTo = staff._id;
      if (step === 'Resolved') resolvedAt = new Date();
      timeline.push({
        status: step,
        note: NOTES[step],
        changedBy: actor._id,
        changedByName: actor.name,
        at: new Date(),
      });
      status = step;
    }

    await Complaint.create({
      ticketId,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      location: tpl.location,
      priority: tpl.priority,
      status,
      createdBy: owner._id,
      assignedTo,
      resolvedAt,
      remarks: status === 'Resolved' ? 'Issue resolved and area cleaned up.' : '',
      timeline,
      feedback: tpl.feedback ? { ...tpl.feedback, at: new Date() } : null,
    });
  }

  console.log('\n[seed] Done. Sample login accounts (password: ' + PASSWORD + ')');
  console.log('  Admin : ' + admin.email);
  console.log('  Staff : ' + staffMembers.map((s) => s.email).join(', '));
  console.log('  Users : ' + users.map((u) => u.email).join(', '));

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
