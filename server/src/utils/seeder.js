/**
 * HouseMate — Database Seeder
 * Seeds mock data matching the UI spec:
 * House: 12A06 Boys Flat
 * Members: Faizu, Harri, Bala, Athreya, Dhayanandh, Afzal
 *
 * Usage: node src/utils/seeder.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { subDays } = require('date-fns');

const connectDB = require('../config/database');
const User = require('../models/User');
const House = require('../models/House');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const june2026Schedule = require('../data/june2026Schedule');
const { buildTasksFromSchedule } = require('./scheduleTasks');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...\n');

  // ── Clean ──
  await Promise.all([
    User.deleteMany({}),
    House.deleteMany({}),
    Task.deleteMany({}),
    Expense.deleteMany({}),
    Inventory.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data');

  const hashedPw = await bcrypt.hash('password123', 12);

  // ── Users ──
  const usersData = [
    { name: 'Faizu',      email: 'faizu@housemate.app',      points: 240, rank: 2 },
    { name: 'Harri',      email: 'harri@housemate.app',      points: 420, rank: 1 },
    { name: 'Bala',       email: 'bala@housemate.app',       points: 230, rank: 3 },
    { name: 'Athreya',    email: 'athreya@housemate.app',    points: 210, rank: 4 },
    { name: 'Dhayanandh', email: 'dhayanandh@housemate.app', points: 180, rank: 5 },
    { name: 'Afzal',      email: 'afzal@housemate.app',      points: 150, rank: 6 },
  ];

  const users = await User.insertMany(
    usersData.map((u, i) => ({
      ...u,
      password: hashedPw,
      totalPointsEarned: u.points + Math.floor(Math.random() * 50),
      role: i === 0 ? 'admin' : 'member',
      streak: {
        current: i === 0 ? 12 : Math.floor(Math.random() * 15),
        longest: i === 0 ? 15 : Math.floor(Math.random() * 20) + 5,
        lastCompletedDate: subDays(new Date(), 0),
      },
      stats: {
        tasksCompleted: i === 0 ? 24 : Math.floor(Math.random() * 30) + 10,
        assistsGiven:   i === 0 ? 8  : Math.floor(Math.random() * 10),
        swapsInitiated: i === 0 ? 2  : Math.floor(Math.random() * 5),
        tasksSkipped:   i === 0 ? 1  : Math.floor(Math.random() * 3),
      },
      badges: i === 0 ? [{ badgeId: 'first_task' }] : [],
      isActive: true,
    }))
  );

  const [faizu, harri, bala, athreya, dhayanandh, afzal] = users;
  console.log(`✅ Created ${users.length} users`);

  // ── House ──
  const house = await House.create({
    name: '12A06 Boys Flat',
    description: 'NeoPay boys flat — shared chore rotation 🏠',
    inviteCode: '12A06',
    admin: faizu._id,
    maxMembers: 10,
    members: [
      { user: faizu._id,      customRole: 'House Admin',     isActive: true },
      { user: harri._id,      customRole: 'House Champion',  isActive: true },
      { user: bala._id,       customRole: 'Member',          isActive: true },
      { user: athreya._id,    customRole: 'Member',          isActive: true },
      { user: dhayanandh._id, customRole: 'Member',          isActive: true },
      { user: afzal._id,      customRole: 'Weekend Off',     isActive: true },
    ],
    settings: {
      taskRotationEnabled: true,
      reminderTime: '08:00',
      timezone: 'Asia/Kolkata',
      pointsForCompletion: 10,
      pointsForAssist: 15,
      pointsForSickCover: 30,
    },
  });

  // Assign house to all users
  await User.updateMany({ _id: { $in: users.map((u) => u._id) } }, { house: house._id });
  await User.findByIdAndUpdate(faizu._id, { role: 'admin' });
  console.log(`✅ Created house: ${house.name} (Code: ${house.inviteCode})`);

  // ── Tasks (June 2026 rotation) ──
  const userByName = Object.fromEntries(users.map((u) => [u.name, u]));

  const scheduleTasks = buildTasksFromSchedule({
    houseId: house._id,
    createdById: faizu._id,
    userByName,
    schedule: june2026Schedule,
  });

  const marketplaceTasks = [
    {
      house: house._id, createdBy: faizu._id,
      title: 'Sunday Mop', emoji: '🧹', category: 'general',
      assignedTo: null, dueDate: new Date('2026-06-21T12:00:00'),
      points: 25, status: 'unassigned',
      isMarketplace: true, marketplacePostedBy: faizu._id,
    },
    {
      house: house._id, createdBy: bala._id,
      title: 'Toilet Deep Clean', emoji: '🚽', category: 'bathroom',
      assignedTo: null, dueDate: new Date('2026-06-25T12:00:00'),
      points: 35, status: 'unassigned',
      isMarketplace: true, marketplacePostedBy: bala._id,
    },
  ];

  const tasks = await Task.insertMany([...scheduleTasks, ...marketplaceTasks]);
  console.log(`✅ Created ${tasks.length} tasks (${scheduleTasks.length} from June schedule)`);

  // ── Expenses ──
  // const currentMonth = '2026-06';
  // const expenses = await Expense.insertMany([
  //   {
  //     house: house._id, title: 'Monthly Rent', category: 'rent', emoji: '🏠',
  //     amount: 48000, paidBy: faizu._id, month: currentMonth,
  //     splitType: 'equal',
  //     splits: users.map((u) => ({ user: u._id, amount: 8000, isPaid: u._id.equals(faizu._id) })),
  //   },
  //   {
  //     house: house._id, title: 'Groceries', category: 'groceries', emoji: '🛒',
  //     amount: 11500, paidBy: harri._id, month: currentMonth,
  //     splitType: 'equal',
  //     splits: users.map((u) => ({
  //       user: u._id,
  //       amount: parseFloat((11500 / 6).toFixed(2)),
  //       isPaid: u._id.equals(harri._id),
  //     })),
  //   },
  //   {
  //     house: house._id, title: 'Gas Cylinder', category: 'gas', emoji: '🔥',
  //     amount: 1200, paidBy: bala._id, month: currentMonth,
  //     splitType: 'equal',
  //     splits: users.map((u) => ({
  //       user: u._id,
  //       amount: parseFloat((1200 / 6).toFixed(2)),
  //       isPaid: u._id.equals(bala._id),
  //     })),
  //   },
  //   {
  //     house: house._id, title: 'WiFi Bill', category: 'wifi', emoji: '📡',
  //     amount: 999, paidBy: dhayanandh._id, month: currentMonth,
  //     splitType: 'equal',
  //     splits: users.map((u) => ({
  //       user: u._id,
  //       amount: parseFloat((999 / 6).toFixed(2)),
  //       isPaid: u._id.equals(dhayanandh._id),
  //     })),
  //   },
  //   {
  //     house: house._id, title: 'Groceries', category: 'groceries', emoji: '🛒',
  //     amount: 2300, paidBy: faizu._id, month: currentMonth,
  //     splitType: 'equal',
  //     splits: users.map((u) => ({
  //       user: u._id,
  //       amount: parseFloat((2300 / 6).toFixed(2)),
  //       isPaid: u._id.equals(faizu._id),
  //     })),
  //   },
  // ]);
  // console.log(`✅ Created ${expenses.length} expenses`);

  // ── Inventory ──
  // const inventory = await Inventory.insertMany([
  //   {
  //     house: house._id, addedBy: faizu._id,
  //     name: 'Rice', emoji: '🍚', category: 'groceries',
  //     quantity: { current: 2, unit: 'kg', minThreshold: 1, maxCapacity: 10 },
  //     status: 'ok',
  //   },
  //   {
  //     house: house._id, addedBy: faizu._id,
  //     name: 'Cooking Oil', emoji: '🫙', category: 'groceries',
  //     quantity: { current: 1, unit: 'bottle', minThreshold: 1 },
  //     status: 'low',
  //   },
  //   {
  //     house: house._id, addedBy: harri._id,
  //     name: 'Dish Wash Liquid', emoji: '🧴', category: 'cleaning',
  //     quantity: { current: 0, unit: 'bottle', minThreshold: 1 },
  //     stockPercent: 20,
  //     status: 'low',
  //   },
  //   {
  //     house: house._id, addedBy: bala._id,
  //     name: 'Toilet Paper', emoji: '🧻', category: 'toiletries',
  //     quantity: { current: 4, unit: 'rolls', minThreshold: 2 },
  //     status: 'ok',
  //   },
  //   {
  //     house: house._id, addedBy: athreya._id,
  //     name: 'Hand Wash', emoji: '🧼', category: 'toiletries',
  //     quantity: { current: 0, unit: 'bottle', minThreshold: 1 },
  //     stockPercent: 0,
  //     status: 'out_of_stock',
  //     refillRequest: { isRequested: true, requestedBy: athreya._id, requestedAt: new Date() },
  //   },
  //   {
  //     house: house._id, addedBy: faizu._id,
  //     name: 'Salt', emoji: '🧂', category: 'groceries',
  //     quantity: { current: 500, unit: 'g', minThreshold: 100, maxCapacity: 1000 },
  //     status: 'ok',
  //   },
  // ]);
  // console.log(`✅ Created ${inventory.length} inventory items`);

  // ── Notifications ──
  // await Notification.insertMany([
  //   {
  //     house: house._id, recipient: faizu._id, sender: harri._id,
  //     type: 'assist_accepted',
  //     title: 'Help is on the way!',
  //     message: 'Harri accepted your assist request. +15 Points earned.',
  //     isRead: false, data: {},
  //   },
  //   {
  //     house: house._id, recipient: faizu._id, sender: bala._id,
  //     type: 'task_assigned',
  //     title: 'Bala claimed Sunday Mop',
  //     message: 'Bala claimed Sunday Mop from the marketplace.',
  //     isRead: false, data: {},
  //   },
  //   {
  //     house: house._id, recipient: faizu._id, sender: afzal._id,
  //     type: 'task_completed',
  //     title: 'Task Completed',
  //     message: 'Afzal completed Kitchen Cleaning.',
  //     isRead: true, data: {},
  //   },
  //   {
  //     house: house._id, recipient: faizu._id,
  //     type: 'leaderboard_updated',
  //     title: 'Leaderboard Updated',
  //     message: 'Monthly leaderboard has been updated. Check your rank!',
  //     isRead: true, data: {},
  //   },
  // ]);
  // console.log(`✅ Created notifications`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETE\n');
  console.log('🏠 House:    12A06 Boys Flat');
  console.log('🔑 Invite:   12A06');
  console.log(`📅 Schedule: ${june2026Schedule.month} ${june2026Schedule.year} (${scheduleTasks.length} rotation tasks)`);
  console.log('\n👥 Login credentials (all passwords: password123):');
  usersData.forEach((u) => console.log(`   ${u.name.padEnd(12)} → ${u.email}`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
