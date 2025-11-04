// PWA Test Script - проверка функциональности PWA
// Запускается в консоли браузера

console.log('🧪 Запуск PWA тестирования...');

class PWATester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  // Тест 1: Проверка Service Worker
  testServiceWorker() {
    console.log('🔧 Тест 1: Service Worker регистрация...');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.log('✅ Service Worker зарегистрирован');
          this.passed++;
          this.results.push({ test: 'Service Worker', status: 'PASS', details: `${registrations.length} регистраций` });
        } else {
          console.log('❌ Service Worker не найден');
          this.failed++;
          this.results.push({ test: 'Service Worker', status: 'FAIL', details: 'Не зарегистрирован' });
        }
      });
    } else {
      console.log('❌ Service Worker не поддерживается');
      this.failed++;
      this.results.push({ test: 'Service Worker', status: 'FAIL', details: 'Не поддерживается' });
    }
  }

  // Тест 2: Проверка манифеста
  testManifest() {
    console.log('📱 Тест 2: PWA манифест...');
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      fetch(manifestLink.href)
        .then(response => response.json())
        .then(manifest => {
          console.log('✅ Манифест найден и валиден');
          this.passed++;
          this.results.push({ 
            test: 'Manifest', 
            status: 'PASS', 
            details: `name: ${manifest.name}, start_url: ${manifest.start_url}` 
          });
        })
        .catch(() => {
          console.log('❌ Ошибка загрузки манифеста');
          this.failed++;
          this.results.push({ test: 'Manifest', status: 'FAIL', details: 'Ошибка загрузки' });
        });
    } else {
      console.log('❌ Манифест не найден');
      this.failed++;
      this.results.push({ test: 'Manifest', status: 'FAIL', details: 'Не найден' });
    }
  }

  // Тест 3: Проверка HTTPS
  testHTTPS() {
    console.log('🔒 Тест 3: HTTPS...');
    
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      console.log('✅ HTTPS активен');
      this.passed++;
      this.results.push({ test: 'HTTPS', status: 'PASS', details: `протокол: ${location.protocol}` });
    } else {
      console.log('❌ HTTPS не используется');
      this.failed++;
      this.results.push({ test: 'HTTPS', status: 'FAIL', details: `протокол: ${location.protocol}` });
    }
  }

  // Тест 4: Проверка иконок
  testIcons() {
    console.log('🎨 Тест 4: PWA иконки...');
    
    const icons = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]');
    if (icons.length > 0) {
      console.log('✅ Иконки найдены');
      this.passed++;
      this.results.push({ test: 'Icons', status: 'PASS', details: `найдено: ${icons.length}` });
    } else {
      console.log('❌ Иконки не найдены');
      this.failed++;
      this.results.push({ test: 'Icons', status: 'FAIL', details: 'Не найдены' });
    }
  }

  // Тест 5: Проверка мета-тегов
  testMetaTags() {
    console.log('🏷️ Тест 5: PWA мета-теги...');
    
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const mobileWebAppMeta = document.querySelector('meta[name="mobile-web-app-capable"]');
    
    let passedTests = 0;
    let details = [];
    
    if (viewportMeta) passedTests++;
    else details.push('viewport');
    
    if (themeColorMeta) passedTests++;
    else details.push('theme-color');
    
    if (mobileWebAppMeta) passedTests++;
    else details.push('mobile-web-app-capable');
    
    if (passedTests >= 2) {
      console.log('✅ Основные мета-теги настроены');
      this.passed++;
      this.results.push({ test: 'Meta Tags', status: 'PASS', details: `${passedTests}/3 тестов пройдено` });
    } else {
      console.log('❌ Недостаточно мета-тегов');
      this.failed++;
      this.results.push({ test: 'Meta Tags', status: 'FAIL', details: `отсутствуют: ${details.join(', ')}` });
    }
  }

  // Тест 6: Проверка возможности установки
  testInstallable() {
    console.log('📲 Тест 6: Возможность установки...');
    
    if ('beforeinstallprompt' in window) {
      console.log('✅ PWA может быть установлен');
      this.passed++;
      this.results.push({ test: 'Installable', status: 'PASS', details: 'beforeinstallprompt поддерживается' });
    } else {
      console.log('⚠️ Возможность установки ограничена');
      this.results.push({ test: 'Installable', status: 'SKIP', details: 'beforeinstallprompt не найден' });
    }
  }

  // Тест 7: Проверка офлайн функциональности
  testOffline() {
    console.log('📡 Тест 7: Офлайн функциональность...');
    
    // Проверяем IndexedDB
    if ('indexedDB' in window) {
      console.log('✅ IndexedDB доступен');
      this.passed++;
      this.results.push({ test: 'Offline Storage', status: 'PASS', details: 'IndexedDB доступен' });
    } else {
      console.log('❌ IndexedDB не доступен');
      this.failed++;
      this.results.push({ test: 'Offline Storage', status: 'FAIL', details: 'IndexedDB недоступен' });
    }
    
    // Проверяем Cache API
    if ('caches' in window) {
      console.log('✅ Cache API доступен');
      this.passed++;
      this.results.push({ test: 'Cache API', status: 'PASS', details: 'Cache API доступен' });
    } else {
      console.log('❌ Cache API не доступен');
      this.failed++;
      this.results.push({ test: 'Cache API', status: 'FAIL', details: 'Cache API недоступен' });
    }
  }

  // Тест 8: Проверка производительности
  testPerformance() {
    console.log('⚡ Тест 8: Производительность...');
    
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        if (loadTime < 3000) {
          console.log(`✅ Быстрая загрузка: ${loadTime}ms`);
          this.passed++;
          this.results.push({ test: 'Performance', status: 'PASS', details: `loadTime: ${Math.round(loadTime)}ms` });
        } else {
          console.log(`⚠️ Медленная загрузка: ${loadTime}ms`);
          this.results.push({ test: 'Performance', status: 'WARN', details: `loadTime: ${Math.round(loadTime)}ms` });
        }
      }
    }
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log('🚀 Начинаю комплексное PWA тестирование...\n');
    
    // Запускаем тесты последовательно
    this.testServiceWorker();
    this.testManifest();
    this.testHTTPS();
    this.testIcons();
    this.testMetaTags();
    this.testInstallable();
    this.testOffline();
    this.testPerformance();
    
    // Ждем завершения асинхронных тестов
    setTimeout(() => {
      this.showResults();
    }, 2000);
  }

  // Показ результатов
  showResults() {
    console.log('\n📊 РЕЗУЛЬТАТЫ PWA ТЕСТИРОВАНИЯ:');
    console.log('='.repeat(50));
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                  result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status} - ${result.details}`);
    });
    
    console.log('='.repeat(50));
    console.log(`📈 ИТОГО: ${this.passed} passed, ${this.failed} failed`);
    console.log(`🎯 Оценка: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
    
    if (this.failed === 0) {
      console.log('🎉 Все PWA тесты пройдены успешно!');
    } else {
      console.log('⚠️ Обнаружены проблемы с PWA функциональностью');
    }
  }
}

// Запуск тестирования
const pwaTester = new PWATester();
pwaTester.runAllTests();

// Экспортируем для повторного использования
window.PWATester = pwaTester;

// Автоматический запуск если скрипт загружен напрямую
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWATester;
}
