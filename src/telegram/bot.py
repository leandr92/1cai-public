"""
Telegram Bot - Main entry point
Интеграция с 1C AI Assistant
"""

import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from src.telegram.config import config
from src.telegram.handlers import router

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)


async def main():
    """Main bot function"""
    
    # Проверка конфигурации
    if not config.bot_token:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        logger.info("Get token from @BotFather: https://t.me/BotFather")
        return
    
    logger.info("🤖 Starting 1C AI Assistant Telegram Bot...")
    
    # Initialize bot
    bot = Bot(
        token=config.bot_token,
        default=DefaultBotProperties(
            parse_mode=ParseMode.MARKDOWN
        )
    )
    
    # Initialize dispatcher
    dp = Dispatcher()
    dp.include_router(router)
    
    # Startup message
    try:
        bot_info = await bot.get_me()
        logger.info(f"✅ Bot started: @{bot_info.username}")
        logger.info(f"📊 Rate limits: {config.max_requests_per_minute}/min, {config.max_requests_per_day}/day")
        
        if config.admin_ids:
            logger.info(f"👑 Admin IDs: {config.admin_ids}")
        
        if config.premium_user_ids:
            logger.info(f"💎 Premium users: {len(config.premium_user_ids)}")
        
        # Start polling
        logger.info("🔄 Starting polling...")
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
        
    except Exception as e:
        logger.error(f"❌ Bot error: {e}")
        raise
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Bot stopped by user")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        sys.exit(1)


