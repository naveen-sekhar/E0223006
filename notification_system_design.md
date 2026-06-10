# Campus Notification System — Design Document

---

## Stage 1 — REST API Design & Contract

### Base URL
`http://localhost:3001/api`

### Endpoints

#### 1. Fetch Notifications (Paginated)
* **Route:** `GET /notifications`
* **Query Params:** `page` (default 1), `limit` (default 10), `notification_type` (Placement/Result/Event)
* **Response (200 OK):**
```json
{
  "success": true,
  "total": 45,
  "notifications": [
    {
      "ID": "notif_001",
      "Type": "Placement",
      "Message": "Google recruiting starts next Monday.",
      "Timestamp": "2026-06-10T05:00:00Z"
    }
  ]
}
```

#### 2. Get Priority Inbox (Top N)
* **Route:** `GET /notifications/priority`
* **Query Params:** `n` (default 10), `notification_type` (optional)
* **Response (200 OK):**
```json
{
  "success": true,
  "notifications": [
    {
      "ID": "notif_001",
      "Type": "Placement",
      "Message": "Google recruiting starts next Monday.",
      "Timestamp": "2026-06-10T05:00:00Z",
      "priorityScore": 395.4
    }
  ]
}
```

#### 3. Real-Time Push Stream (Server-Sent Events)
* **Route:** `GET /notifications/stream`
* **Response Headers:** `Content-Type: text/event-stream`
* **Payload:**
```
event: new_notification
data: {"ID":"notif_002","Type":"Result","Message":"Exams published.","Timestamp":"2026-06-10T05:10:00Z"}
```

---

## Stage 2 — Database Design

### Recommended Database: PostgreSQL
**Why:** ACID compliance is critical for unread/read states. It supports partial indexing (perfect for unread notifications) and native `ENUM` types.

### Schema
```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Optimize fetching unread notifications
CREATE INDEX idx_student_unread_notifs 
ON notifications(student_id, created_at DESC) 
WHERE is_read = FALSE;
```

### Growth & Scaling Strategy
* **Table Partitioning:** Partition `notifications` by month/year using PostgreSQL declarative partitioning on `created_at`.
* **Archiving:** Move notifications older than 90 days to cold storage (e.g. S3 or compressed archive tables) to keep primary tables slim.

---

## Stage 3 — Query Analysis & Optimization

### Given Slow Query
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt ASC;
```

### Why is it slow?
1. **Full Table Scan:** Lacks a composite index on `(studentID, isRead, createdAt)`, forcing DB to read all 5M rows.
2. **Sort Overhead:** `ORDER BY createdAt` requires an in-memory/disk filesort when data size exceeds working memory.
3. **`SELECT *` Waste:** Fetches heavy text fields (`message`) even if only summary data is needed.

### Optimization

#### 1. Partial Composite Index
```sql
CREATE INDEX idx_student_unread_notifs_opt 
ON notifications(studentID, createdAt DESC) 
WHERE isRead = FALSE;
```
* **Why:** Only indexes unread rows (~10-20% of dataset), making index footprint very small. Ordering is baked into the index.

#### 2. Optimized Query
```sql
SELECT id, type, message, createdAt 
FROM notifications 
WHERE studentID = 1042 AND isRead = FALSE
ORDER BY createdAt DESC
LIMIT 10 OFFSET 0;
```
* **Why:** Replaces `*` with needed fields, adds `LIMIT` for pagination, and matches index order.

### Note on Indexing Everything
**Bad Practice:** Adding indexes on every column causes write amplification (every `INSERT` / `UPDATE` requires updating all index trees) and increases disk space consumption. Only index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.

### Placement Notifications Query (Last 7 Days)
```sql
SELECT DISTINCT s.roll_no, s.email
FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement' 
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4 — Performance & Caching Strategy

### 1. Redis Cache Layer
* **Cache Key:** `student:notifs:{studentId}` (stores compiled notification lists).
* **TTL:** 5 minutes.
* **Invalidation:** Evict cache key immediately on receiving a new notification or when a user marks one as read.

### 2. Browser Cache (HTTP Headers)
* Set `Cache-Control: private, no-cache` with an `ETag` matching the hash of the user's notification list. If no changes occur, return `304 Not Modified` to save bandwidth.

### 3. SSE + Polling Hybrid
* **Initial Load:** Fetch notifications from API/Redis.
* **Live Updates:** Use Server-Sent Events (SSE) to push incoming notifications.
* **Fallback:** If SSE drops, client falls back to polling `/notifications/unread-count` every 60 seconds.

---

## Stage 5 — Bulk Notification Reliability

### Shortcomings in Given Loop
* **Blocking/Sequential:** Processes 50k emails one by one. If one email takes 1s, the loop runs for ~14 hours.
* **No Error Safety:** If student #200 fails, the loop crashes, leaving 49,800 students without notifications.
* **No Retries:** Failures are ignored or lost without manual script reruns.
* **Coupling:** High coupling of database writes, email APIs, and push notifications.

### Handling the 200 Failed Emails
Since the script lacks transactional boundaries, we cannot know who received the email and who did not without parsing logs. Re-running the script will duplicate notifications for 49,800 students.

### Decoupling
Yes, DB saves and email sends should be decoupled. DB writes are fast and local; emails rely on external SMTP APIs.

### Queue-Based Architecture
```
              ┌─────────────────┐
              │  API Trigger    │
              └────────┬────────┘
                       │
             Batch DB Insert (Fast)
                       │
                       ▼
              ┌─────────────────┐
              │  Message Queue  │
              └──────┬───┬──────┘
                     │   │
           ┌─────────┘   └─────────┐
           ▼                       ▼
   [Email Worker Pool]     [Push Worker Pool]
   (Retries + Backoff)     (Retries + Backoff)
```

#### Pseudocode
```javascript
async function notifyAll(studentIds, message) {
  // Step 1: Bulk insert into DB in one query
  await db.insertNotifications(studentIds, message);

  // Step 2: Push jobs to Redis/RabbitMQ queue
  const jobs = studentIds.map(id => ({ studentId: id, message }));
  await queue.publishBatch('notification-jobs', jobs);
}

// Worker process (runs concurrently)
queue.process('notification-jobs', async (job) => {
  try {
    await emailService.send(job.studentId, job.message);
  } catch (err) {
    if (job.attempts < 3) {
      await queue.retry(job, { delay: Math.pow(2, job.attempts) * 1000 });
    } else {
      await deadLetterQueue.add(job);
    }
  }
});
```

---

## Stage 6 — Priority Inbox Implementation

### Formula
$$\text{Score} = (\text{Type Weight} \times 100) + (e^{-0.099 \times \text{Age In Days}} \times 100)$$
* **Weights:** `Placement` = 3, `Result` = 2, `Event` = 1.
* **Decay:** Halves the recency score every ~7 days.

### Algorithm (Min-Heap for Streaming Top-10)
Instead of sorting all notifications $O(N \log N)$ upon receiving a new stream item:
1. Maintain a min-heap of size $K=10$.
2. For each incoming item, if the heap is not full, insert it ($O(\log K)$).
3. If full, compare the new item's score to the heap's minimum ($O(1)$).
4. If the new item's score is higher, extract the min and insert the new item ($O(\log K)$).
* **Overall Complexity:** $O(N \log K)$ — highly optimized for streaming environments.

### Implementation Snippet
```javascript
const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

function calculateScore(notif) {
  const ageDays = (Date.now() - new Date(notif.Timestamp)) / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-0.099 * ageDays);
  return (WEIGHTS[notif.Type] || 0) * 100 + recency * 100;
}

export function getTopN(notifications, n = 10) {
  const scored = notifications.map(notif => ({
    ...notif,
    priorityScore: calculateScore(notif)
  }));
  return scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, n);
}
```
