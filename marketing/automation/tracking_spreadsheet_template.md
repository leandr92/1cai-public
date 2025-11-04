# 📊 GOOGLE SHEETS TRACKING TEMPLATE

## Создайте Google Spreadsheet с этими листами:

---

## SHEET 1: USER GROWTH

| Date | New Users | Total Users | Active (D1) | Active (D7) | Churn | Source |
|------|-----------|-------------|-------------|-------------|-------|--------|
| 2025-11-04 | 15 | 15 | 10 | - | - | Friends |
| 2025-11-05 | 23 | 38 | 18 | - | - | Telegram Chat #1 |
| 2025-11-06 | 31 | 69 | 25 | - | - | Telegram Chat #2 |
| ... | ... | ... | ... | ... | ... | ... |

**Формулы:**
```
=SUM(B:B)  // Total Users
=C2-C1     // Growth rate
=D2/B2     // D1 Retention
```

---

## SHEET 2: OUTREACH TRACKING

| Date | Platform | Contact | Audience | Status | Response Date | Result | Notes |
|------|----------|---------|----------|--------|---------------|--------|-------|
| 2025-11-04 | YouTube | Иван П. | 50K | Sent | - | - | Channel: @name |
| 2025-11-04 | Telegram | Admin Chat #1 | 5K | Approved | 2025-11-05 | Posted | Great response! |
| 2025-11-05 | GitHub | BSL LSP | 500 stars | Sent | - | - | Issue #123 |

**Status values:**
- Sent
- Read
- Replied
- Approved
- Declined
- Posted
- Live

---

## SHEET 3: CONTENT CALENDAR

| Date | Platform | Content Type | Topic | Status | Link | Engagement |
|------|----------|--------------|-------|--------|------|------------|
| 2025-11-04 | Telegram | Post | Launch announcement | Posted | t.me/... | 45 views |
| 2025-11-08 | Habr | Article | How we built it | Draft | - | - |
| 2025-11-10 | YouTube | Video | Demo | Planned | - | - |

---

## SHEET 4: REVENUE

| Date | User ID | Plan | Amount | Status | Source | Referral Code |
|------|---------|------|--------|--------|--------|---------------|
| 2025-11-15 | 12345 | PRO | 299₽ | Paid | Direct | - |
| 2025-11-16 | 67890 | PRO | 299₽ | Paid | YouTube | IVAN_YT |
| 2025-11-18 | 11111 | TEAM | 2990₽ | Paid | Infostart | - |

**Metrics:**
```
=SUM(D:D)        // Total Revenue
=COUNTIF(C:C,"PRO")   // PRO subscribers
=COUNTIF(C:C,"TEAM")  // TEAM subscribers
```

---

## SHEET 5: A/B TESTING

| Test # | Variant | Platform | Metric | Result | Winner |
|--------|---------|----------|--------|--------|--------|
| 1 | Short post | Telegram | CTR | 3.2% | ❌ |
| 1 | Long post | Telegram | CTR | 5.7% | ✅ |
| 2 | Morning (10am) | Telegram | Reach | 450 | ❌ |
| 2 | Evening (6pm) | Telegram | Reach | 820 | ✅ |

---

## SHEET 6: FEEDBACK LOG

| Date | User | Feedback Type | Feedback | Priority | Status |
|------|------|---------------|----------|----------|--------|
| 2025-11-04 | @user1 | Bug | Search doesn't work | High | Fixed |
| 2025-11-05 | @user2 | Feature request | Voice messages | Medium | Backlog |
| 2025-11-06 | @user3 | Praise | Love it! | - | - |

**Types:**
- Bug
- Feature request
- Praise
- Complaint
- Question

---

## AUTOMATION WITH GOOGLE APPS SCRIPT

### Auto-update Total Users:
```javascript
function updateTotalUsers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("USER GROWTH");
  var lastRow = sheet.getLastRow();
  
  // Get last total
  var lastTotal = sheet.getRange(lastRow, 3).getValue();
  var newUsers = sheet.getRange(lastRow + 1, 2).getValue();
  
  // Update total
  sheet.getRange(lastRow + 1, 3).setValue(lastTotal + newUsers);
}
```

### Daily Reminder:
```javascript
function dailyReminder() {
  var email = "your@email.com";
  var subject = "🚀 Daily Marketing Reminder";
  var body = "Don't forget:\n" +
             "1. Check analytics\n" +
             "2. Answer user questions\n" +
             "3. Send 2 outreach messages\n" +
             "4. Post in 1 community\n\n" +
             "You got this!";
  
  MailApp.sendEmail(email, subject, body);
}

// Set trigger: every day at 9am
```

---

## DASHBOARD (визуализация)

### Charts to create:

**1. User Growth Chart**
- Type: Line chart
- X-axis: Date
- Y-axis: Total Users
- Show: New vs Total

**2. Source Attribution Pie**
- Show: Where users come from
- Telegram, Habr, YouTube, etc.

**3. Revenue Over Time**
- Type: Column chart
- X-axis: Week
- Y-axis: Revenue (₽)

**4. Retention Cohort**
- Type: Heatmap
- Rows: Signup week
- Columns: Weeks since signup
- Values: % still active

---

## TEMPLATE LINK

**Скопируйте этот template:**
https://docs.google.com/spreadsheets/d/YOUR_TEMPLATE_ID/copy

(Создайте свой и поделитесь ссылкой)

---

## DAILY WORKFLOW

### Morning (5 min):
1. Open spreadsheet
2. Add yesterday's numbers
3. Check if on track vs goals

### Evening (5 min):
4. Log outreach sent today
5. Update content calendar
6. Add feedback received

**TOTAL: 10 min/day = organized growth!**


