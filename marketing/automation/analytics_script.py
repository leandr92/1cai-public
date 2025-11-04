"""
Analytics Helper Script
Автоматический сбор метрик из бота
"""

import asyncio
from datetime import datetime, timedelta
from collections import defaultdict
import json


class BotAnalytics:
    """Сбор и анализ метрик бота"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def get_daily_stats(self, date=None):
        """Получить статистику за день"""
        if date is None:
            date = datetime.now().date()
        
        stats = {
            "date": str(date),
            "new_users": await self.count_new_users(date),
            "active_users": await self.count_active_users(date),
            "total_requests": await self.count_requests(date),
            "avg_requests_per_user": 0,
            "top_commands": await self.get_top_commands(date),
            "sources": await self.get_user_sources(date),
        }
        
        if stats["active_users"] > 0:
            stats["avg_requests_per_user"] = round(
                stats["total_requests"] / stats["active_users"], 2
            )
        
        return stats
    
    async def count_new_users(self, date):
        """Подсчет новых пользователей за день"""
        query = """
        SELECT COUNT(*) FROM users
        WHERE DATE(created_at) = $1
        """
        return await self.db.fetchval(query, date)
    
    async def count_active_users(self, date):
        """Подсчет активных пользователей за день"""
        query = """
        SELECT COUNT(DISTINCT user_id) FROM requests
        WHERE DATE(created_at) = $1
        """
        return await self.db.fetchval(query, date)
    
    async def count_requests(self, date):
        """Подсчет запросов за день"""
        query = """
        SELECT COUNT(*) FROM requests
        WHERE DATE(created_at) = $1
        """
        return await self.db.fetchval(query, date)
    
    async def get_top_commands(self, date, limit=5):
        """Топ команд за день"""
        query = """
        SELECT command, COUNT(*) as count
        FROM requests
        WHERE DATE(created_at) = $1
        GROUP BY command
        ORDER BY count DESC
        LIMIT $2
        """
        rows = await self.db.fetch(query, date, limit)
        return {row["command"]: row["count"] for row in rows}
    
    async def get_user_sources(self, date):
        """Источники пользователей"""
        query = """
        SELECT source, COUNT(*) as count
        FROM users
        WHERE DATE(created_at) = $1
        GROUP BY source
        """
        rows = await self.db.fetch(query, date)
        return {row["source"]: row["count"] for row in rows}
    
    async def get_retention_cohort(self, weeks=4):
        """Retention cohort analysis"""
        cohorts = {}
        
        # Get signup weeks
        query = """
        SELECT 
            DATE_TRUNC('week', created_at) as cohort_week,
            user_id
        FROM users
        WHERE created_at >= NOW() - INTERVAL '{} weeks'
        ORDER BY cohort_week
        """.format(weeks)
        
        rows = await self.db.fetch(query)
        
        for row in rows:
            cohort_week = row["cohort_week"]
            user_id = row["user_id"]
            
            if cohort_week not in cohorts:
                cohorts[cohort_week] = {"users": set(), "retention": {}}
            
            cohorts[cohort_week]["users"].add(user_id)
        
        # Calculate retention for each week
        for cohort_week, cohort_data in cohorts.items():
            cohort_users = cohort_data["users"]
            
            for week_offset in range(weeks):
                target_week = cohort_week + timedelta(weeks=week_offset)
                
                # Count active users in target week
                query = """
                SELECT COUNT(DISTINCT user_id) FROM requests
                WHERE user_id = ANY($1)
                AND created_at >= $2
                AND created_at < $2 + INTERVAL '1 week'
                """
                
                active = await self.db.fetchval(
                    query,
                    list(cohort_users),
                    target_week
                )
                
                retention_rate = (active / len(cohort_users)) * 100
                cohort_data["retention"][f"week_{week_offset}"] = round(retention_rate, 1)
        
        return cohorts
    
    async def export_to_json(self, filename="analytics.json"):
        """Экспорт всей статистики в JSON"""
        
        # Last 30 days
        days = []
        for i in range(30):
            date = datetime.now().date() - timedelta(days=i)
            stats = await self.get_daily_stats(date)
            days.append(stats)
        
        data = {
            "generated_at": datetime.now().isoformat(),
            "period": "last_30_days",
            "daily_stats": days,
            "retention_cohort": await self.get_retention_cohort(),
        }
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Analytics exported to {filename}")
    
    async def print_daily_summary(self):
        """Красивый вывод статистики за день"""
        stats = await self.get_daily_stats()
        
        print("\n" + "="*50)
        print(f"📊 Daily Summary - {stats['date']}")
        print("="*50)
        print(f"\n👥 Users:")
        print(f"   New:    {stats['new_users']}")
        print(f"   Active: {stats['active_users']}")
        
        print(f"\n💬 Activity:")
        print(f"   Total requests: {stats['total_requests']}")
        print(f"   Avg per user:   {stats['avg_requests_per_user']}")
        
        print(f"\n🔝 Top Commands:")
        for cmd, count in stats['top_commands'].items():
            print(f"   {cmd}: {count}")
        
        print(f"\n📍 Sources:")
        for source, count in stats['sources'].items():
            print(f"   {source}: {count}")
        
        print("\n" + "="*50 + "\n")


# CLI usage
async def main():
    """Command line interface"""
    import sys
    import argparse
    from src.database import create_pool
    
    parser = argparse.ArgumentParser(description="Bot Analytics")
    parser.add_argument("--export", action="store_true", help="Export to JSON")
    parser.add_argument("--summary", action="store_true", help="Print daily summary")
    parser.add_argument("--date", help="Date (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    # Connect to DB
    pool = await create_pool()
    analytics = BotAnalytics(pool)
    
    if args.summary:
        await analytics.print_daily_summary()
    
    if args.export:
        await analytics.export_to_json()
    
    if not args.summary and not args.export:
        # Default: print summary
        await analytics.print_daily_summary()
    
    await pool.close()


if __name__ == "__main__":
    asyncio.run(main())


