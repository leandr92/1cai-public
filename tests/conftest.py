"""
Pytest Configuration
Общие fixtures и настройки для всех тестов
"""

import pytest
import asyncio
import asyncpg
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def db_pool():
    """Create database connection pool for tests"""
    try:
        pool = await asyncpg.create_pool(
            host='localhost',
            port=5432,
            user='postgres',
            password='postgres',
            database='enterprise_1c_ai_test',
            min_size=5,
            max_size=20
        )
        yield pool
        await pool.close()
    except:
        yield None


@pytest.fixture(scope="function")
async def db_conn(db_pool):
    """Get database connection for single test"""
    if db_pool:
        async with db_pool.acquire() as conn:
            # Start transaction
            async with conn.transaction():
                yield conn
                # Rollback after test
    else:
        yield None


@pytest.fixture
def sample_bsl_code():
    """Sample BSL code for testing"""
    return '''
// Рассчитывает сумму заказа
//
// Параметры:
//   Заказ - ДокументСсылка.ЗаказПокупателя
//
// Возвращаемое значение:
//   Число - Сумма заказа
//
Функция РассчитатьСуммуЗаказа(Заказ) Экспорт
    
    Попытка
        Запрос = Новый Запрос;
        Запрос.Текст = "
        |ВЫБРАТЬ
        |    СУММА(Сумма) КАК Сумма
        |ИЗ
        |    Документ.ЗаказПокупателя.Товары
        |ГДЕ
        |    Ссылка = &Заказ";
        
        Запрос.УстановитьПараметр("Заказ", Заказ);
        
        Результат = Запрос.Выполнить();
        Выборка = Результат.Выбрать();
        
        Если Выборка.Следующий() Тогда
            Возврат Выборка.Сумма;
        Иначе
            Возврат 0;
        КонецЕсли;
        
    Исключение
        ЗаписьЖурналаРегистрации("Ошибка", УровеньЖурналаРегистрации.Ошибка);
        Возврат 0;
    КонецПопытки;
    
КонецФункции
'''


@pytest.fixture
def vulnerable_bsl_code():
    """Vulnerable BSL code for security testing"""
    return '''
Функция ПолучитьДанныеПользователя(ИДПользователя)
    // SQL Injection vulnerability
    Запрос = Новый Запрос;
    Запрос.Текст = "ВЫБРАТЬ * ГДЕ ID = '" + ИДПользователя + "'";
    
    // Hardcoded credentials
    Пароль = "admin123";
    APIKey = "sk_live_1234567890";
    
    Возврат Запрос.Выполнить();
КонецФункции
'''


@pytest.fixture
def mock_tenant_data():
    """Mock tenant data"""
    return {
        'id': 'test-tenant-123',
        'name': 'Test Company',
        'email': 'test@example.com',
        'plan': 'professional',
        'status': 'active',
        'api_calls_limit': 10000,
        'storage_limit_gb': 100
    }


@pytest.fixture
def mock_github_pr():
    """Mock GitHub PR data"""
    return {
        'number': 42,
        'repository': 'test/repo',
        'title': 'Add new feature',
        'author': 'developer',
        'files': [
            {
                'filename': 'src/test.bsl',
                'status': 'added',
                'additions': 50,
                'deletions': 0,
                'patch': '+ Функция НоваяФункция()\n+ КонецФункции'
            }
        ]
    }


@pytest.fixture
def mock_stripe_event():
    """Mock Stripe webhook event"""
    return {
        'id': 'evt_test_123',
        'type': 'invoice.payment_succeeded',
        'created': 1234567890,
        'data': {
            'object': {
                'id': 'in_test_123',
                'customer': 'cus_test_123',
                'amount_paid': 29900,
                'currency': 'usd',
                'status': 'paid'
            }
        }
    }


# Markers
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "system: marks tests as system/e2e tests"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests as performance tests"
    )
    config.addinivalue_line(
        "markers", "security: marks tests as security tests"
    )
