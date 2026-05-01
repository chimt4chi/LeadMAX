/**
 * Seed Script
 * Creates sample users, bank accounts, and demonstrates a payment.
 * Run: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./connection');
const User = require('../models/user.model');
const BankAccount = require('../models/bankAccount.model');
const Transaction = require('../models/transaction.model');
const RefreshToken = require('../models/refreshToken.model');

async function seed() {
  await connectDB();

  console.log('\n🌱 Seeding database...');

  // Clear existing data
  await Transaction.destroy({ where: {}, truncate: true });
  await RefreshToken.destroy({ where: {}, truncate: true });
  await BankAccount.destroy({ where: {}, truncate: true });
  await User.scope('withPassword').destroy({ where: {}, truncate: true });

  const password = await bcrypt.hash('Password1', 12);

  // ── Create Users ──────────────────────────────────────────────────────────
  const alice = await User.scope('withPassword').create({
    name: 'Alice Johnson',
    email: 'alice@leadmax.com',
    phone: '+91 9876543210',
    password,
  });

  const bob = await User.scope('withPassword').create({
    name: 'Bob Smith',
    email: 'bob@leadmax.com',
    phone: '+91 9123456789',
    password,
  });

  console.log('✅ Created users: Alice, Bob');

  // ── Create Bank Accounts ──────────────────────────────────────────────────
  const aliceAcc1 = await BankAccount.create({
    userId:            alice.id,
    accountNumber:     'ALICE001',
    bankName:          'State Bank of India',
    accountHolderName: 'Alice Johnson',
    balance:           10000.00,
  });

  const aliceAcc2 = await BankAccount.create({
    userId:            alice.id,
    accountNumber:     'ALICE002',
    bankName:          'HDFC Bank',
    accountHolderName: 'Alice Johnson',
    balance:           5000.00,
  });

  const bobAcc1 = await BankAccount.create({
    userId:            bob.id,
    accountNumber:     'BOB001',
    bankName:          'ICICI Bank',
    accountHolderName: 'Bob Smith',
    balance:           2000.00,
  });

  console.log('✅ Created bank accounts for Alice and Bob');

  console.log('\n🎉 Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 SEED DATA SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Alice  | ID: ${alice.id} | email: alice@leadmax.com`);
  console.log(`   Account 1: ${aliceAcc1.id} | Balance: ₹10,000`);
  console.log(`   Account 2: ${aliceAcc2.id} | Balance: ₹5,000`);
  console.log(`👤 Bob    | ID: ${bob.id} | email: bob@leadmax.com`);
  console.log(`   Account 1: ${bobAcc1.id} | Balance: ₹2,000`);
  console.log('\n🔑 Password for both users: Password1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
