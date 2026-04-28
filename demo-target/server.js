/**
 * CERBERUS-AI Demo Target
 * 
 * An intentionally vulnerable loan approval API for demonstrating
 * CERBERUS-AI's detection capabilities.
 * 
 * ⚠️  FOR TESTING PURPOSES ONLY — DO NOT DEPLOY TO PRODUCTION
 * 
 * Vulnerabilities included:
 * 1. IDOR — /api/users/:id returns any user's data without auth check
 * 2. Auth Bypass — /api/profile accessible without authentication
 * 3. Bias — /api/loan/apply returns different results based on gender/region
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Mock Database ────────────────────────────────────────────────────────────

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', ssn: '***-**-1234', balance: 45000, credit_score: 720 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', ssn: '***-**-5678', balance: 12000, credit_score: 650 },
  { id: 3, name: 'Carol White', email: 'carol@example.com', ssn: '***-**-9012', balance: 89000, credit_score: 780 },
  { id: 4, name: 'David Brown', email: 'david@example.com', ssn: '***-**-3456', balance: 5000, credit_score: 580 },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    name: 'LoanQuick API',
    version: '1.0.0',
    description: 'AI-powered loan approval system',
    endpoints: ['/api/users/:id', '/api/profile', '/api/loan/apply', '/api/loan/status/:id'],
  });
});

// ── VULNERABILITY 1: IDOR ─────────────────────────────────────────────────────
// No authentication check — any user ID returns that user's sensitive data
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // BUG: Returns full user data including SSN and balance without auth check
  res.json(user);
});

// ── VULNERABILITY 2: Auth Bypass ──────────────────────────────────────────────
// Should require Authorization header but doesn't check it
app.get('/api/profile', (req, res) => {
  // BUG: No auth check — returns first user's data to anyone
  res.json(users[0]);
});

// ── VULNERABILITY 3: Bias in AI Decision ─────────────────────────────────────
// Loan approval uses gender and region as factors (discriminatory)
app.post('/api/loan/apply', (req, res) => {
  const { name, age, income, credit_score, gender, region, loan_amount } = req.body;

  if (!income || !credit_score) {
    return res.status(400).json({ error: 'income and credit_score are required' });
  }

  // Base score calculation
  let score = 0;
  score += Math.min(credit_score / 850, 1) * 40;  // Credit score: 0-40 pts
  score += Math.min(income / 100000, 1) * 30;      // Income: 0-30 pts
  score += age >= 25 && age <= 55 ? 10 : 5;        // Age factor: 5-10 pts

  // BUG: Discriminatory factors
  if (gender === 'male') score += 15;              // Gender bias: +15 for male
  if (gender === 'female') score += 5;             // Gender bias: +5 for female
  if (region === 'urban') score += 10;             // Region bias: +10 for urban
  if (region === 'rural') score += 2;              // Region bias: +2 for rural

  const approved = score >= 60;
  const interest_rate = approved ? (100 - score) * 0.1 + 3 : null;

  res.json({
    approved,
    score: Math.round(score),
    interest_rate: interest_rate ? Math.round(interest_rate * 100) / 100 : null,
    loan_amount: approved ? loan_amount : null,
    message: approved
      ? `Congratulations! Your loan of $${loan_amount} has been approved.`
      : 'Your loan application has been declined.',
    factors: { credit_score, income, age, gender, region }, // Exposes bias factors
  });
});

// Loan status (also has IDOR)
app.get('/api/loan/status/:id', (req, res) => {
  const id = parseInt(req.params.id);
  // BUG: No auth check on loan status
  res.json({
    loan_id: id,
    applicant_id: id,
    status: id % 2 === 0 ? 'approved' : 'pending',
    amount: 25000 + id * 1000,
    created_at: new Date().toISOString(),
  });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const results = users.filter((u) =>
    u.name.toLowerCase().includes(String(q || '').toLowerCase())
  );
  res.json({ results, total: results.length });
});

app.listen(PORT, () => {
  console.log(`🎯 Demo target running on http://localhost:${PORT}`);
  console.log(`⚠️  This server is intentionally vulnerable — for testing only!`);
});
