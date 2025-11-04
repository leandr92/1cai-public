# 🤖 AUTOMATION TOOLS

Инструменты для автоматизации маркетинга и analytics

---

## 📊 Analytics Script

### Что делает:
- Собирает метрики из БД
- Генерирует daily summaries
- Экспортирует в JSON
- Retention cohort analysis

### Использование:

```bash
# Daily summary (default)
python marketing/automation/analytics_script.py

# Export to JSON
python marketing/automation/analytics_script.py --export

# Specific date
python marketing/automation/analytics_script.py --date 2025-11-04
```

### Output example:

```
==================================================
📊 Daily Summary - 2025-11-04
==================================================

👥 Users:
   New:    23
   Active: 45

💬 Activity:
   Total requests: 234
   Avg per user:   5.2

🔝 Top Commands:
   /search: 120
   /generate: 45
   /deps: 30

📍 Sources:
   telegram_chat: 15
   habr: 5
   direct: 3

==================================================
```

---

## 📈 Google Sheets Integration

### Setup:

1. Create Google Sheet from template (see `tracking_spreadsheet_template.md`)
2. Enable Google Sheets API
3. Download credentials.json
4. Install dependencies:

```bash
pip install gspread oauth2client
```

### Auto-update script:

```python
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import asyncio
from analytics_script import BotAnalytics
from src.database import create_pool

async def update_google_sheet():
    """Автоматическое обновление Google Sheets"""
    
    # Connect to DB
    pool = await create_pool()
    analytics = BotAnalytics(pool)
    
    # Get today's stats
    stats = await analytics.get_daily_stats()
    
    # Connect to Google Sheets
    scope = ['https://spreadsheets.google.com/feeds']
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        'credentials.json', scope
    )
    client = gspread.authorize(creds)
    
    # Open sheet
    sheet = client.open("1C AI Bot - Growth Tracking").sheet1
    
    # Append row
    sheet.append_row([
        stats["date"],
        stats["new_users"],
        stats["active_users"],
        stats["total_requests"],
        stats["avg_requests_per_user"],
    ])
    
    print(f"✅ Updated Google Sheet for {stats['date']}")
    
    await pool.close()

if __name__ == "__main__":
    asyncio.run(update_google_sheet())
```

### Cron job (daily auto-update):

```bash
# Add to crontab
0 9 * * * cd /path/to/project && python marketing/automation/update_sheets.py
```

---

## 🔔 Telegram Notifications

### Daily summary в Telegram:

```python
from telegram import Bot
import asyncio

async def send_daily_report(bot_token, chat_id):
    """Отправка daily report в Telegram"""
    bot = Bot(token=bot_token)
    
    # Get stats
    pool = await create_pool()
    analytics = BotAnalytics(pool)
    stats = await analytics.get_daily_stats()
    
    # Format message
    message = f"""
📊 **Daily Report - {stats['date']}**

👥 **Users:**
• New: {stats['new_users']}
• Active: {stats['active_users']}

💬 **Activity:**
• Requests: {stats['total_requests']}
• Avg/user: {stats['avg_requests_per_user']}

🔝 **Top Commands:**
{format_top_commands(stats['top_commands'])}

Keep growing! 🚀
    """
    
    await bot.send_message(
        chat_id=chat_id,
        text=message,
        parse_mode='Markdown'
    )
    
    await pool.close()

# Run daily at 9am
```

---

## 📧 Email Reports

### Weekly digest:

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_weekly_email(to_email, stats):
    """Отправка weekly digest на email"""
    
    # Format HTML email
    html = f"""
    <html>
      <body>
        <h2>Weekly Growth Report</h2>
        
        <h3>Key Metrics:</h3>
        <ul>
          <li>New Users: {stats['new_users']}</li>
          <li>Total Users: {stats['total_users']}</li>
          <li>Growth: +{stats['growth_rate']}%</li>
        </ul>
        
        <h3>Top Performing Channels:</h3>
        <ul>
          {format_channels(stats['channels'])}
        </ul>
        
        <p>Keep up the good work! 💪</p>
      </body>
    </html>
    """
    
    # Send
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Weekly Report - Week {stats['week']}"
    msg['From'] = "bot@yourdomain.com"
    msg['To'] = to_email
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login("your@email.com", "password")
        server.send_message(msg)
```

---

## 🎯 Goal Tracking

### Set goals and track progress:

```python
GOALS = {
    "week_1": {
        "new_users": 100,
        "active_users": 20,
        "posts": 5,
    },
    "week_2": {
        "new_users": 400,
        "active_users": 100,
        "posts": 10,
    },
    # ...
}

async def check_goals(week):
    """Check if goals met"""
    goals = GOALS[f"week_{week}"]
    actual = await get_week_stats(week)
    
    report = {}
    for metric, target in goals.items():
        achieved = actual[metric]
        percentage = (achieved / target) * 100
        status = "✅" if achieved >= target else "⚠️"
        
        report[metric] = {
            "target": target,
            "achieved": achieved,
            "percentage": round(percentage, 1),
            "status": status,
        }
    
    return report
```

---

## 🤖 Automated Posting

### Schedule posts in advance:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

scheduler = AsyncIOScheduler()

async def auto_post(channel_id, message):
    """Автоматический пост"""
    bot = Bot(token=BOT_TOKEN)
    await bot.send_message(chat_id=channel_id, text=message)
    print(f"✅ Posted at {datetime.now()}")

# Schedule posts
scheduler.add_job(
    auto_post, 
    'cron', 
    day_of_week='mon,wed,fri',
    hour=10,
    minute=0,
    args=[CHANNEL_ID, "Monday motivation post!"]
)

scheduler.start()
```

---

## 📱 Monitoring Alerts

### Alert on important events:

```python
async def monitor_and_alert():
    """Мониторинг критичных событий"""
    
    while True:
        # Check bot health
        if not await check_bot_online():
            await send_alert("🚨 Bot is DOWN!")
        
        # Check error rate
        error_rate = await get_error_rate()
        if error_rate > 5:  # 5% errors
            await send_alert(f"⚠️ High error rate: {error_rate}%")
        
        # Check conversion rate
        conversion = await get_conversion_rate()
        if conversion < 1:  # < 1% conversion
            await send_alert(f"📉 Low conversion: {conversion}%")
        
        # Sleep 5 minutes
        await asyncio.sleep(300)

# Run in background
asyncio.create_task(monitor_and_alert())
```

---

## 🔧 Usage

### Daily workflow:

```bash
# Morning: Check analytics
python marketing/automation/analytics_script.py --summary

# Update tracking sheet
python marketing/automation/update_sheets.py

# (Automatic) Telegram notification sent
# (Automatic) Email digest sent (weekly)
```

### All automation in one script:

```bash
# Run all daily tasks
python marketing/automation/run_daily.py

# Output:
# ✅ Analytics collected
# ✅ Google Sheets updated
# ✅ Telegram notification sent
# ✅ Monitoring checks passed
```

---

## ⚙️ Configuration

### Create `config.yaml`:

```yaml
telegram:
  bot_token: "YOUR_TOKEN"
  admin_chat_id: 123456789
  channel_id: -1001234567890

google_sheets:
  credentials_file: "credentials.json"
  spreadsheet_id: "YOUR_SPREADSHEET_ID"

email:
  smtp_server: "smtp.gmail.com"
  smtp_port: 587
  from_email: "bot@yourdomain.com"
  password: "your_password"
  to_email: "your@email.com"

monitoring:
  check_interval: 300  # seconds
  error_threshold: 5   # percent
  downtime_alert: true
```

---

## 🚀 Quick Start

```bash
# Install dependencies
pip install gspread oauth2client apscheduler

# Setup credentials
# 1. Google Sheets API credentials → credentials.json
# 2. Create config.yaml

# Test
python marketing/automation/analytics_script.py --summary

# Setup cron for daily automation
crontab -e
# Add:
0 9 * * * cd /path/to/project && python marketing/automation/run_daily.py
```

---

**Автоматизация = больше времени на рост! 📈**


