# Contactability Reporting Database Schema

## Overview
The contactability reporting system uses 3 main tables that work together to track, aggregate, and analyze contact attempts across all communication channels.

## Table Relationships

```
┌─────────────────┐
│ debtor_records  │
│ (existing)      │
└────────┬────────┘
         │
         │ 1:N (one debtor has many contact attempts)
         │
         ▼
┌─────────────────────────┐
│  contact_attempts       │◄─────┐
│  (tracks each contact)  │      │
└─────────┬───────────────┘      │
          │                       │
          │ triggers              │ 1:1 (summary for each debtor)
          │ auto-update           │
          ▼                       │
┌─────────────────────────────┐  │
│ contact_outcomes_summary    │──┘
│ (aggregated metrics)        │
└─────────────────────────────┘

┌──────────────┐
│   agents     │
│  (existing)  │
└──────┬───────┘
       │
       │ 1:N (one agent makes many contact attempts)
       │
       └──────────► contact_attempts
```

---

## Table 1: `contact_attempts`

**Purpose:** Records every single contact attempt made to debtors across all channels

### Schema
```sql
CREATE TABLE contact_attempts (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  debtor_id uuid NOT NULL REFERENCES debtor_records(id) ON DELETE CASCADE,
  csv_upload_id uuid REFERENCES csv_uploads(id) ON DELETE SET NULL,
  agent_id integer REFERENCES agents(id) ON DELETE SET NULL,

  -- Contact Details
  channel text NOT NULL CHECK (channel IN ('phone', 'email', 'sms', 'whatsapp', 'other')),
  contact_number text,
  attempt_timestamp timestamptz NOT NULL DEFAULT now(),

  -- Outcome Tracking
  outcome text NOT NULL CHECK (outcome IN (
    'connected', 'no_answer', 'busy', 'voicemail', 'wrong_number',
    'disconnected', 'email_bounced', 'email_opened', 'email_clicked',
    'email_delivered', 'sms_delivered', 'sms_failed', 'opt_out',
    'callback_requested', 'promise_to_pay', 'dispute', 'refused'
  )),
  duration_seconds integer CHECK (duration_seconds >= 0),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);
```

### Indexes (for performance)
```sql
CREATE INDEX idx_contact_attempts_debtor_id ON contact_attempts(debtor_id);
CREATE INDEX idx_contact_attempts_timestamp ON contact_attempts(attempt_timestamp);
CREATE INDEX idx_contact_attempts_outcome ON contact_attempts(outcome);
CREATE INDEX idx_contact_attempts_channel ON contact_attempts(channel);
CREATE INDEX idx_contact_attempts_agent_id ON contact_attempts(agent_id);
CREATE INDEX idx_contact_attempts_debtor_channel ON contact_attempts(debtor_id, channel);
```

### Key Relationships
- **debtor_id** → Links to `debtor_records` (each attempt belongs to one debtor)
- **csv_upload_id** → Links to `csv_uploads` (tracks which batch this debtor came from)
- **agent_id** → Links to `agents` (tracks who made the contact)

---

## Table 2: `contact_outcomes_summary`

**Purpose:** Stores pre-calculated metrics for each debtor for fast reporting

### Schema
```sql
CREATE TABLE contact_outcomes_summary (
  -- Primary Key (one record per debtor)
  debtor_id uuid PRIMARY KEY REFERENCES debtor_records(id) ON DELETE CASCADE,

  -- Attempt Counts by Channel
  total_attempts integer DEFAULT 0,
  phone_attempts integer DEFAULT 0,
  email_attempts integer DEFAULT 0,
  sms_attempts integer DEFAULT 0,

  -- Success Metrics
  successful_contacts integer DEFAULT 0,

  -- Timing
  last_contact_date timestamptz,        -- Last SUCCESSFUL contact
  last_attempt_date timestamptz,         -- Last attempt (any outcome)

  -- Intelligence
  best_channel text,                     -- Channel with highest success rate
  best_time_slot text,                   -- Best time of day (future enhancement)
  contact_score numeric(5,2) CHECK (contact_score >= 0 AND contact_score <= 100),

  -- Tracking
  updated_at timestamptz DEFAULT now()
);
```

### Key Relationships
- **debtor_id** → Links 1:1 with `debtor_records` (each debtor has exactly one summary)

---

## Table 3: `debtor_records` (Existing)

**Purpose:** Core debtor information

### Relevant Fields
```sql
-- From existing schema
id uuid PRIMARY KEY
name text
phone text
email text
address text
score integer
amount numeric
... (other fields)
```

---

## How Data Flows Through the System

### 1. Recording a Contact Attempt
```sql
-- Agent makes a phone call
INSERT INTO contact_attempts (
  debtor_id,
  agent_id,
  channel,
  outcome,
  duration_seconds
) VALUES (
  'debtor-uuid',
  123,
  'phone',
  'connected',
  245
);
```

### 2. Automatic Summary Update (via Trigger)
After inserting a contact attempt, a trigger automatically:

```sql
-- Trigger function runs automatically
CREATE TRIGGER update_contact_outcomes_summary_trigger
  AFTER INSERT OR UPDATE ON contact_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_outcomes_summary();
```

The trigger function:
1. **Counts all attempts** for that debtor
2. **Breaks down by channel** (phone/email/sms)
3. **Identifies successful contacts** (connected, email_opened, callback_requested, etc.)
4. **Calculates best channel** (highest success rate)
5. **Computes contact score** using formula:
   ```
   Base Score = (successful_contacts / total_attempts) × 70
   Recency Bonus = 30 points (if contacted in last 7 days)
                 = 15 points (if contacted in last 30 days)
                 = 0 points (otherwise)
   Final Score = min(100, Base Score + Recency Bonus)
   ```
6. **Updates the summary table** with all calculated metrics

### 3. Reporting Queries

**Get overall metrics:**
```sql
-- Total attempts and success rate
SELECT
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE outcome IN ('connected', 'email_opened', 'callback_requested')) as successful,
  AVG(contact_score) as avg_score
FROM contact_attempts ca
JOIN contact_outcomes_summary cos ON ca.debtor_id = cos.debtor_id;
```

**Channel performance:**
```sql
-- Success rate by channel
SELECT
  channel,
  COUNT(*) as attempts,
  COUNT(*) FILTER (WHERE outcome IN ('connected', 'email_opened', 'email_clicked')) as successful,
  (COUNT(*) FILTER (WHERE outcome IN ('connected', 'email_opened')) * 100.0 / COUNT(*)) as success_rate
FROM contact_attempts
GROUP BY channel;
```

**Time-of-day analysis:**
```sql
-- Best time to contact
SELECT
  CASE
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 6 AND 11 THEN 'morning'
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 12 AND 16 THEN 'afternoon'
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 17 AND 20 THEN 'evening'
    ELSE 'night'
  END as time_slot,
  COUNT(*) as attempts,
  COUNT(*) FILTER (WHERE outcome = 'connected') as successful
FROM contact_attempts
WHERE channel = 'phone'
GROUP BY time_slot;
```

**Agent performance:**
```sql
-- Top performing agents
SELECT
  a.first_name || ' ' || a.last_name as agent_name,
  COUNT(*) as attempts,
  COUNT(*) FILTER (WHERE ca.outcome IN ('connected', 'callback_requested')) as successful,
  (COUNT(*) FILTER (WHERE ca.outcome IN ('connected')) * 100.0 / COUNT(*)) as success_rate
FROM contact_attempts ca
JOIN agents a ON ca.agent_id = a.id
GROUP BY a.id, agent_name
ORDER BY success_rate DESC
LIMIT 5;
```

**Debtor contactability score:**
```sql
-- Get debtors with best/worst contactability
SELECT
  dr.name,
  dr.phone,
  dr.email,
  cos.total_attempts,
  cos.successful_contacts,
  cos.contact_score,
  cos.best_channel,
  cos.last_contact_date
FROM debtor_records dr
JOIN contact_outcomes_summary cos ON dr.id = cos.debtor_id
ORDER BY cos.contact_score DESC;
```

---

## How the Frontend Service Uses This

The `contactabilityService.ts` queries these tables to build comprehensive metrics:

```typescript
// 1. Fetch all contact attempts with agent details
SELECT ca.*, a.first_name, a.last_name
FROM contact_attempts ca
LEFT JOIN agents a ON ca.agent_id = a.id

// 2. Fetch summary data for scores
SELECT contact_score FROM contact_outcomes_summary

// 3. Calculate metrics in JavaScript:
//    - Group by channel
//    - Group by time of day
//    - Group by outcome
//    - Group by agent
//    - Calculate trends (last 7/30/90 days)
```

---

## Success Outcomes Definition

These outcomes are considered "successful contacts":
- `connected` - Phone call answered
- `email_opened` - Email was opened
- `email_clicked` - Email link was clicked
- `callback_requested` - Debtor requested callback
- `promise_to_pay` - Payment promise made

All other outcomes (no_answer, busy, voicemail, wrong_number, etc.) are unsuccessful attempts.

---

## Key Design Decisions

### Why Two Tables?

**contact_attempts (detailed log)**
- Every single contact is recorded
- Never deleted (audit trail)
- Allows detailed analysis by time, agent, channel
- Can be queried for trends over time

**contact_outcomes_summary (aggregated metrics)**
- Fast lookups for reporting
- Pre-calculated scores
- One record per debtor (efficient)
- Auto-updates via triggers (no manual calculation needed)

### Why Automatic Triggers?

- **Consistency**: Summary is always up-to-date
- **Performance**: No need to calculate on every report view
- **Simplicity**: Frontend just reads pre-calculated values
- **Real-time**: Updates happen immediately after contact

### Why Store Both Channels and Best Channel?

- **contact_attempts.channel**: What was actually used for each attempt
- **contact_outcomes_summary.best_channel**: Computed "recommendation" based on success rates
- This lets agents see which channel works best for each debtor

---

## Example Data Flow

### Scenario: Agent calls a debtor

```
1. Agent makes call → System records:
   ┌─────────────────────────────────────┐
   │ contact_attempts INSERT             │
   │ - debtor_id: abc-123               │
   │ - agent_id: 45                     │
   │ - channel: 'phone'                 │
   │ - outcome: 'connected'             │
   │ - duration_seconds: 180            │
   └─────────────────────────────────────┘
                    ↓
2. Trigger fires automatically
                    ↓
3. Function calculates for debtor abc-123:
   - Total attempts: 8 → 9
   - Phone attempts: 4 → 5
   - Successful: 3 → 4
   - Success rate: 37.5% → 44.4%
   - Contact score: 32 → 46 (improved!)
   - Best channel: 'email' → 'phone' (now phone is better)
                    ↓
4. Updates summary table:
   ┌─────────────────────────────────────┐
   │ contact_outcomes_summary UPDATE     │
   │ - debtor_id: abc-123               │
   │ - total_attempts: 9                │
   │ - phone_attempts: 5                │
   │ - successful_contacts: 4           │
   │ - contact_score: 46.00             │
   │ - best_channel: 'phone'            │
   │ - last_contact_date: NOW()         │
   └─────────────────────────────────────┘
                    ↓
5. Report dashboard refreshes → Shows updated metrics
```

---

## Performance Considerations

### Indexes Ensure Fast Queries
- Query by debtor: `idx_contact_attempts_debtor_id`
- Time-based analysis: `idx_contact_attempts_timestamp`
- Filter by outcome: `idx_contact_attempts_outcome`
- Channel analysis: `idx_contact_attempts_channel`
- Agent performance: `idx_contact_attempts_agent_id`

### Summary Table Eliminates Expensive Calculations
Without summary table, each report would need to:
```sql
-- SLOW: Calculate for every debtor on every page load
SELECT debtor_id, COUNT(*), calculate_score(...), find_best_channel(...)
FROM contact_attempts
GROUP BY debtor_id
-- This gets slower as data grows!
```

With summary table:
```sql
-- FAST: Just read pre-calculated values
SELECT * FROM contact_outcomes_summary;
-- Always fast, regardless of data size!
```

---

## Future Enhancements

The schema supports adding:
- **best_time_slot**: Calculate optimal contact time per debtor
- **metadata field**: Store additional context (call recordings, email content, etc.)
- **Swordfish integration**: Link to external data enrichment
- **AI predictions**: Store predicted success likelihood
- **Campaign tracking**: Add campaign_id to track marketing initiatives
