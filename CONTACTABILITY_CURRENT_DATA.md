# Current Contactability Data in Your Database

## Summary Statistics

Your Swordfish database now contains:

- **250 contact attempts** across 50 debtors
- **103 successful contacts** (41.2% success rate)
- **Average contact score: 41.74** out of 100
- Contact attempts span **60 days** of historical data

---

## Database Tables

### Table 1: `contact_attempts` (250 records)

**Sample Data:**
```
┌────────────────────┬──────────────────┬────────────────┬─────────┬──────────────────┬─────────────────────┐
│ Debtor Name        │ Agent Name       │ Channel        │ Outcome │ Timestamp        │ Duration (seconds)  │
├────────────────────┼──────────────────┼────────────────┼─────────┼──────────────────┼─────────────────────┤
│ Unknown Debtor     │ Leena Alugodhi   │ phone          │ sms_del │ 2026-02-08 10:48 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ phone          │ clicked │ 2026-02-07 19:56 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ email          │ deliver │ 2026-02-07 19:47 │ null                │
│ Unknown Kaovere    │ Leena Alugodhi   │ phone          │ wrong_# │ 2026-02-07 12:02 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ sms            │ clicked │ 2026-02-07 05:02 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ phone          │ callbck │ 2026-02-06 23:10 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ email          │ no_ansr │ 2026-02-06 05:53 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ email          │ callbck │ 2026-02-06 04:42 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ email          │ deliver │ 2026-02-05 16:01 │ null                │
│ Unknown Debtor     │ Leena Alugodhi   │ sms            │ sms_del │ 2026-02-05 06:37 │ null                │
└────────────────────┴──────────────────┴────────────────┴─────────┴──────────────────┴─────────────────────┘
```

### Table 2: `contact_outcomes_summary` (50 records)

**Top Scoring Debtors:**
```
┌────────────────┬───────────────┬───────┬───────┬───────┬───────┬───────────┬───────┬──────────────┬────────────────────┐
│ Debtor Name    │ Phone         │ Email │ Total │ Phone │ Email │ SMS       │ Succ. │ Score        │ Best Channel       │
│                │               │       │ Attmp │ Attmp │ Attmp │ Attmp     │ Cntct │              │                    │
├────────────────┼───────────────┼───────┼───────┼───────┼───────┼───────────┼───────┼──────────────┼────────────────────┤
│ Unknown Debtor │ 814770216     │ null  │ 5     │ 1     │ 3     │ 1         │ 4     │ 86.00        │ phone              │
│ Unknown Debtor │ null          │ null  │ 5     │ 0     │ 0     │ 5         │ 3     │ 72.00        │ sms                │
│ Unknown Debtor │ null          │ max@  │ 5     │ 2     │ 1     │ 2         │ 3     │ 72.00        │ email              │
│ Unknown Debtor │ 813401987     │ null  │ 5     │ 1     │ 1     │ 3         │ 4     │ 71.00        │ phone              │
│ Unknown Debtor │ null          │ null  │ 5     │ 2     │ 2     │ 1         │ 4     │ 71.00        │ phone              │
│ Unknown Debtor │ null          │ null  │ 5     │ 2     │ 2     │ 1         │ 4     │ 71.00        │ phone              │
│ Unknown Debtor │ null          │ mias@ │ 5     │ 1     │ 3     │ 1         │ 4     │ 71.00        │ phone              │
│ Unknown Debtor │ 813992181     │ null  │ 5     │ 1     │ 1     │ 3         │ 2     │ 58.00        │ phone              │
│ Unknown Debtor │ null          │ null  │ 5     │ 5     │ 0     │ 0         │ 2     │ 58.00        │ phone              │
│ Unknown Debtor │ null          │ null  │ 5     │ 2     │ 1     │ 2         │ 2     │ 58.00        │ phone              │
└────────────────┴───────────────┴───────┴───────┴───────┴───────┴───────────┴───────┴──────────────┴────────────────────┘
```

**Score Breakdown:**
- **Highest Score:** 86.00 (4 successful out of 5 attempts, recent contact)
- **Lowest Score:** 5.83 (1 successful out of 12 attempts, old contact)
- **Average Score:** 41.74

---

## Channel Performance Analysis

```
┌─────────┬─────────────────┬────────────────────┬─────────────────┐
│ Channel │ Total Attempts  │ Successful Attempts│ Success Rate    │
├─────────┼─────────────────┼────────────────────┼─────────────────┤
│ Phone   │ 77              │ 37                 │ 48.05%          │
│ SMS     │ 95              │ 39                 │ 41.05%          │
│ Email   │ 78              │ 27                 │ 34.62%          │
├─────────┼─────────────────┼────────────────────┼─────────────────┤
│ TOTAL   │ 250             │ 103                │ 41.20%          │
└─────────┴─────────────────┴────────────────────┴─────────────────┘
```

**Key Insights:**
1. **Phone is the most effective** channel (48% success rate)
2. **SMS performs well** at 41% success rate
3. **Email has lower success** at 35% success rate
4. **Overall contactability** is at 41%, indicating room for improvement

---

## Outcome Distribution

```
┌───────────────────────┬───────┬────────────┐
│ Outcome               │ Count │ Percentage │
├───────────────────────┼───────┼────────────┤
│ busy                  │ 29    │ 11.60%     │
│ email_clicked ✓       │ 25    │ 10.00%     │
│ wrong_number          │ 25    │ 10.00%     │
│ promise_to_pay ✓      │ 25    │ 10.00%     │
│ no_answer             │ 21    │  8.40%     │
│ email_delivered       │ 21    │  8.40%     │
│ voicemail             │ 19    │  7.60%     │
│ email_opened ✓        │ 19    │  7.60%     │
│ callback_requested ✓  │ 18    │  7.20%     │
│ disconnected          │ 17    │  6.80%     │
│ connected ✓           │ 16    │  6.40%     │
│ sms_delivered         │ 15    │  6.00%     │
└───────────────────────┴───────┴────────────┘

✓ = Success Outcome
```

**Success Outcomes:** 103 out of 250 (41.2%)
- email_clicked: 25
- promise_to_pay: 25
- email_opened: 19
- callback_requested: 18
- connected: 16

**Common Issues:**
- Busy lines: 29 (11.6%)
- Wrong numbers: 25 (10%)
- No answer: 21 (8.4%)
- Disconnected: 17 (6.8%)

---

## How the Tables Connect

### Connection Flow:

```
1. Contact Attempt Recorded
   ↓
   INSERT INTO contact_attempts
   (debtor_id, agent_id, channel, outcome, ...)
   ↓
2. Trigger Fires Automatically
   ↓
   update_contact_outcomes_summary_trigger
   ↓
3. Summary Recalculated
   ↓
   - Count total attempts for this debtor
   - Break down by channel
   - Count successful contacts
   - Calculate success rate
   - Determine best channel
   - Calculate contact score (0-100)
   ↓
4. Summary Table Updated
   ↓
   UPSERT INTO contact_outcomes_summary
   (debtor_id, total_attempts, successful_contacts,
    contact_score, best_channel, ...)
```

### Example: Debtor with ID 'abc-123'

**contact_attempts table (5 records):**
```sql
debtor_id | channel | outcome
----------|---------|------------------
abc-123   | phone   | connected        ✓
abc-123   | phone   | no_answer
abc-123   | email   | email_opened     ✓
abc-123   | email   | email_clicked    ✓
abc-123   | sms     | sms_delivered
```

**Automatic calculation:**
- Total attempts: 5
- Phone attempts: 2
- Email attempts: 2
- SMS attempts: 1
- Successful contacts: 3 (connected, email_opened, email_clicked)
- Success rate: 3/5 = 60%
- Best channel: email (100% success) or phone (50% success) → email wins

**contact_outcomes_summary table (1 record):**
```sql
debtor_id: abc-123
total_attempts: 5
phone_attempts: 2
email_attempts: 2
sms_attempts: 1
successful_contacts: 3
contact_score: 72.00  (base: 60% × 70 = 42, recency bonus: 30 = 72)
best_channel: email
last_contact_date: 2024-02-08 (most recent successful contact)
last_attempt_date: 2024-02-08 (most recent attempt)
```

---

## SQL Query Examples

### 1. Get a specific debtor's contact history:
```sql
SELECT
  ca.attempt_timestamp,
  ca.channel,
  ca.outcome,
  ca.duration_seconds,
  a.first_name || ' ' || a.last_name as agent_name
FROM contact_attempts ca
LEFT JOIN agents a ON ca.agent_id = a.id
WHERE ca.debtor_id = 'abc-123'
ORDER BY ca.attempt_timestamp DESC;
```

### 2. Get debtors with low contactability scores:
```sql
SELECT
  dr.name,
  dr.phone,
  dr.email,
  cos.total_attempts,
  cos.successful_contacts,
  cos.contact_score,
  cos.best_channel
FROM debtor_records dr
JOIN contact_outcomes_summary cos ON dr.id = cos.debtor_id
WHERE cos.contact_score < 30
ORDER BY cos.contact_score ASC;
```

### 3. Find best time of day to contact:
```sql
SELECT
  CASE
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 6 AND 11 THEN 'Morning'
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 12 AND 16 THEN 'Afternoon'
    WHEN EXTRACT(HOUR FROM attempt_timestamp) BETWEEN 17 AND 20 THEN 'Evening'
    ELSE 'Night'
  END as time_slot,
  COUNT(*) as attempts,
  COUNT(*) FILTER (WHERE outcome = 'connected') as successful,
  ROUND((COUNT(*) FILTER (WHERE outcome = 'connected')::numeric / COUNT(*) * 100), 2) as success_rate
FROM contact_attempts
WHERE channel = 'phone'
GROUP BY time_slot
ORDER BY success_rate DESC;
```

### 4. Agent performance leaderboard:
```sql
SELECT
  a.first_name || ' ' || a.last_name as agent_name,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (
    WHERE ca.outcome IN ('connected', 'callback_requested', 'promise_to_pay')
  ) as successful,
  ROUND(
    (COUNT(*) FILTER (
      WHERE ca.outcome IN ('connected', 'callback_requested', 'promise_to_pay')
    )::numeric / COUNT(*) * 100),
    2
  ) as success_rate
FROM contact_attempts ca
JOIN agents a ON ca.agent_id = a.id
GROUP BY a.id, agent_name
ORDER BY success_rate DESC;
```

### 5. Identify debtors who haven't been contacted recently:
```sql
SELECT
  dr.name,
  dr.phone,
  dr.email,
  cos.last_attempt_date,
  EXTRACT(DAY FROM NOW() - cos.last_attempt_date) as days_since_contact,
  cos.contact_score
FROM debtor_records dr
JOIN contact_outcomes_summary cos ON dr.id = cos.debtor_id
WHERE cos.last_attempt_date < NOW() - INTERVAL '30 days'
ORDER BY cos.last_attempt_date ASC;
```

---

## Accessing the Report

The contactability report is now live at:

**Reports → Contactability Report tab**

The dashboard displays:
1. **Overview KPIs** - Total attempts, successful contacts, success rate, avg score
2. **Channel Performance** - Success rates for phone, email, SMS with visual bars
3. **Time of Day Analysis** - Best times to contact (morning/afternoon/evening/night)
4. **Recent Trends** - Performance over last 7, 30, and 90 days
5. **Top Agents** - Leaderboard showing highest performing agents
6. **Outcome Breakdown** - Distribution of all contact outcomes

All metrics update in real-time as new contact attempts are recorded.

---

## Next Steps

To enhance the system further, you can:

1. **Add more contact attempts** - Use `recordContactAttempt()` to log real contacts
2. **Integrate with Swordfish API** - Auto-log contacts from external systems
3. **Set up alerts** - Notify when contactability scores drop below threshold
4. **Predictive scoring** - Use historical data to predict best contact times
5. **Campaign tracking** - Add campaign_id to track marketing effectiveness
6. **A/B testing** - Compare different contact strategies
