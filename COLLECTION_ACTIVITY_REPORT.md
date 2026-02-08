# Collection Activity Report System

## Overview

The Collection Activity Report tracks all actions taken by collection agents to recover debts. This comprehensive system provides insights into agent performance, action effectiveness, account status changes, and overall collection activity trends.

---

## Database Schema

### Table 1: `performed_action_types`

**Purpose:** Lookup table for different types of collection actions

```sql
CREATE TABLE performed_action_types (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Default Action Types:**
1. Phone Call
2. Email Sent
3. SMS Sent
4. Letter Sent
5. Payment Received
6. Promise to Pay
7. Field Visit
8. Legal Action
9. Account Review
10. Status Change
11. Note Added
12. Settlement Offer
13. Dispute Filed
14. Callback Scheduled
15. Voicemail Left

---

### Table 2: `performed_actions`

**Purpose:** Main table tracking every collection action performed

```sql
CREATE TABLE performed_actions (
  p_action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES debtor_records(id),
  user_id integer REFERENCES agents(id),
  type_id integer NOT NULL REFERENCES performed_action_types(id),
  date_done timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  notes text,
  outcome text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Key Fields:**
- `p_action_id` - Unique identifier for the action
- `account_id` - Links to debtor_records (which debtor)
- `user_id` - Links to agents (which agent performed the action)
- `type_id` - Links to performed_action_types (what type of action)
- `date_done` - When the action was performed
- `description` - Detailed description of what was done
- `outcome` - Result of the action (Successful, No Response, Follow-up Required)
- `metadata` - Additional flexible data storage (JSONB)

**Indexes:**
- `idx_performed_actions_account_id` - Fast lookups by account
- `idx_performed_actions_user_id` - Agent performance queries
- `idx_performed_actions_date_done` - Time-based analysis
- `idx_performed_actions_type_id` - Filter by action type

---

### Table 3: `account_status_history`

**Purpose:** Track changes in account status over time

```sql
CREATE TABLE account_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES debtor_records(id),
  old_status text,
  new_status text NOT NULL,
  changed_by integer REFERENCES agents(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  p_action_id uuid REFERENCES performed_actions(p_action_id),
  created_at timestamptz DEFAULT now()
);
```

**Key Fields:**
- `account_id` - Links to debtor_records
- `old_status` - Previous account status
- `new_status` - New account status after change
- `changed_by` - Agent who made the change
- `changed_at` - When status was changed
- `reason` - Reason for status change
- `p_action_id` - Optional link to the action that caused the change

**Indexes:**
- `idx_account_status_history_account_id` - Fast account lookups
- `idx_account_status_history_changed_at` - Time-based queries
- `idx_account_status_history_changed_by` - Agent performance

---

## Table Relationships

```
┌──────────────────┐
│ debtor_records   │
│ (existing)       │
└────────┬─────────┘
         │
         │ 1:N (one debtor → many actions)
         │
         ▼
┌───────────────────────┐        ┌─────────────────────┐
│ performed_actions     │◄───────│ performed_action_   │
│                       │  N:1   │ types (lookup)      │
└───────┬───────────────┘        └─────────────────────┘
        │
        │ 1:1 (optional)
        │
        ▼
┌───────────────────────┐
│ account_status_       │
│ history               │
└───────────────────────┘
        ▲
        │
        │ N:1 (many changes → one agent)
        │
┌───────┴───────┐
│ agents        │
│ (existing)    │
└───────────────┘
```

---

## Data Columns Used in Report

| Column | Table | Description | Dependencies |
|--------|-------|-------------|--------------|
| p_action_id | performed_actions | Primary key for the action | None |
| date_done | performed_actions | Date the action was performed | None |
| description | performed_actions | Description of the action taken | None |
| type_id | performed_actions | Type of action performed | performed_action_types.id |
| name | performed_action_types | Name of the action type | None |
| user_id | performed_actions | ID of user who performed action | agents.id |
| USERNAME | agents | Username of the agent | None |
| account_id | performed_actions | ID of the account | debtor_records.id |
| STATUS | debtor_records | Current status of account | None |
| OLD_STATUS | account_status_history | Previous status | None |
| NEW_STATUS | account_status_history | New status after change | None |

---

## Report Features

### 1. Overview Metrics

**KPI Cards:**
- **Total Actions** - Total number of collection actions performed
- **Successful Actions** - Number of actions with successful outcome
- **Active Agents** - Number of agents performing collections
- **Status Changes** - Total account status updates

### 2. Activity Trend Chart

**Line Chart** showing daily collection activity volume over the last 30 days
- X-axis: Date
- Y-axis: Number of actions
- Helps identify activity patterns and trends

### 3. Actions by Type

**Bar Chart** breaking down actions by type:
- Phone Call
- Email Sent
- SMS Sent
- Payment Received
- Promise to Pay
- etc.

Shows which action types are most commonly used.

### 4. Actions by Outcome

**Pie Chart** showing distribution of outcomes:
- Successful
- No Response
- Follow-up Required

Visualizes overall effectiveness of collection efforts.

### 5. Agent Performance Table

**Interactive Table** showing:
- Agent Name
- Total Actions
- Successful Actions
- Success Rate (%)

Color-coded badges:
- Green: ≥ 70% success rate
- Yellow: 50-69% success rate
- Red: < 50% success rate

### 6. Status Changes Table

**Table** showing most common status transitions:
- From Status → To Status
- Number of occurrences

Examples:
- "New" → "In Progress"
- "In Progress" → "Payment Plan"
- "Payment Plan" → "Settled"

### 7. Recent Actions Table

**Detailed table** of latest collection activities:
- Date
- Action Type
- Agent Name
- Account Name
- Description
- Outcome

Shows real-time collection activity.

---

## Service Layer

### `collectionActivityService.ts`

**Key Functions:**

#### `getPerformedActions(limit?: number)`
Fetches all performed actions with joined data from agents, action types, and debtors.

```typescript
const actions = await getPerformedActions(100);
// Returns: PerformedAction[]
```

#### `getActionTypes()`
Fetches all active action types.

```typescript
const types = await getActionTypes();
// Returns: ActionType[]
```

#### `getStatusHistory(limit?: number)`
Fetches account status change history.

```typescript
const history = await getStatusHistory(50);
// Returns: StatusHistory[]
```

#### `getCollectionActivityMetrics()`
Comprehensive metrics calculation including:
- Total actions and success rate
- Actions grouped by type
- Actions grouped by agent
- Actions grouped by outcome
- Status change patterns
- Activity trends (30-day history)

```typescript
const metrics = await getCollectionActivityMetrics();
// Returns: CollectionActivityMetrics
```

#### `recordPerformedAction(...)`
Records a new collection action.

```typescript
await recordPerformedAction(
  accountId,
  userId,
  typeId,
  description,
  outcome,
  notes
);
```

#### `recordStatusChange(...)`
Records an account status change.

```typescript
await recordStatusChange(
  accountId,
  oldStatus,
  newStatus,
  changedBy,
  reason,
  actionId
);
```

---

## Sample Data

The system comes pre-populated with 50 sample actions across 10 debtors, including:

**Action Distribution:**
- Phone calls with various outcomes
- Email communications
- SMS messages
- Payment receipts
- Status changes
- Follow-up activities

**Sample Status Changes:**
- 20 status transitions across different states
- New → In Progress
- In Progress → Payment Plan
- Payment Plan → Settled
- Various other transitions

---

## Usage Examples

### Recording a Phone Call

```typescript
import { recordPerformedAction } from '../services/collectionActivityService';

// Agent makes a phone call
await recordPerformedAction(
  'debtor-uuid-123',          // accountId
  45,                         // userId (agent ID)
  1,                          // typeId (1 = Phone Call)
  'Called debtor to discuss payment options',
  'Successful',               // outcome
  'Debtor agreed to payment plan' // notes
);
```

### Recording a Status Change

```typescript
import { recordStatusChange } from '../services/collectionActivityService';

// Change account status
await recordStatusChange(
  'debtor-uuid-123',          // accountId
  'In Progress',              // oldStatus
  'Payment Plan',             // newStatus
  45,                         // changedBy (agent ID)
  'Debtor committed to payment arrangement',
  'action-uuid-456'           // optional p_action_id
);
```

### Querying Metrics

```typescript
import { getCollectionActivityMetrics } from '../services/collectionActivityService';

const metrics = await getCollectionActivityMetrics();

console.log(`Total Actions: ${metrics.totalActions}`);
console.log(`Success Rate: ${metrics.successRate.toFixed(1)}%`);
console.log(`Top Agent: ${metrics.actionsByAgent[0].agent_name}`);
```

---

## SQL Query Examples

### Get actions for a specific account

```sql
SELECT
  pa.date_done,
  pat.name as action_type,
  pa.description,
  pa.outcome,
  a.first_name || ' ' || a.last_name as agent_name
FROM performed_actions pa
JOIN performed_action_types pat ON pa.type_id = pat.id
LEFT JOIN agents a ON pa.user_id = a.id
WHERE pa.account_id = 'debtor-uuid-123'
ORDER BY pa.date_done DESC;
```

### Get agent performance summary

```sql
SELECT
  a.first_name || ' ' || a.last_name as agent_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE pa.outcome = 'Successful') as successful_actions,
  ROUND(
    (COUNT(*) FILTER (WHERE pa.outcome = 'Successful')::numeric / COUNT(*) * 100),
    2
  ) as success_rate
FROM performed_actions pa
JOIN agents a ON pa.user_id = a.id
GROUP BY a.id, agent_name
ORDER BY success_rate DESC;
```

### Get most common action types

```sql
SELECT
  pat.name,
  COUNT(*) as count,
  ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM performed_actions) * 100), 2) as percentage
FROM performed_actions pa
JOIN performed_action_types pat ON pa.type_id = pat.id
GROUP BY pat.id, pat.name
ORDER BY count DESC;
```

### Track status flow

```sql
SELECT
  old_status,
  new_status,
  COUNT(*) as transitions
FROM account_status_history
GROUP BY old_status, new_status
ORDER BY transitions DESC;
```

---

## Accessing the Report

Navigate to: **Reports Dashboard → Collection Activity Report tab**

The report displays:
1. **Real-time metrics** - Updated as actions are recorded
2. **Interactive charts** - Visual representations of activity
3. **Performance tables** - Agent and action analysis
4. **Historical trends** - 30-day activity timeline
5. **Recent activity log** - Latest collection actions

---

## Security & RLS Policies

All tables have Row Level Security (RLS) enabled with policies:

**performed_action_types:**
- Authenticated users can view all action types
- Authenticated users can insert new action types

**performed_actions:**
- Authenticated users can view all actions
- Authenticated users can insert actions
- Users can update their own actions

**account_status_history:**
- Authenticated users can view all history
- Authenticated users can insert history records

These policies ensure data access is properly controlled while allowing collection agents to perform their duties.

---

## Performance Considerations

### Indexes Ensure Fast Queries
- All foreign keys are indexed
- Date fields are indexed for time-based queries
- Common query patterns are optimized

### JSONB for Flexibility
- `metadata` field uses JSONB for flexible data storage
- Allows adding custom fields without schema changes
- Can store integration data from external systems

### Efficient Joins
- Service layer performs joins at database level
- Reduces round trips between application and database
- Leverages PostgreSQL's query optimizer

---

## Future Enhancements

Potential additions to the system:

1. **AI-powered insights** - Predict best action types per debtor
2. **Campaign tracking** - Link actions to marketing campaigns
3. **Automated workflows** - Trigger actions based on rules
4. **Integration APIs** - Connect with external collection systems
5. **Real-time notifications** - Alert managers of important events
6. **Mobile app integration** - Record actions from mobile devices
7. **Voice recording storage** - Link call recordings to actions
8. **Email thread tracking** - Full email conversation history
9. **Document attachments** - Store letters, agreements, etc.
10. **Performance gamification** - Leaderboards and achievements

---

## Conclusion

The Collection Activity Report provides a comprehensive view of all collection activities, enabling:

- **Performance tracking** - Monitor agent effectiveness
- **Process optimization** - Identify what works best
- **Accountability** - Complete audit trail of all actions
- **Strategic planning** - Make data-driven decisions
- **Compliance** - Full documentation of collection efforts

All data is stored securely with proper RLS policies and optimized for fast querying.
