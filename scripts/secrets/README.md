# Secrets & Vault Scripts

В каталоге `scripts/secrets/` находятся утилиты для синхронизации секретов между Vault, AWS Secrets Manager и Kubernetes.

## Основные скрипты

| Файл | Назначение |
| --- | --- |
| `aws_sync_to_vault.py` | Копирует секреты из AWS Secrets Manager в Hashicorp Vault. |
| `azure_sync_to_vault.py` | Синхронизирует секреты из Azure Key Vault в Hashicorp Vault. |
| `apply_vault_csi.sh` | Разворачивает Vault CSI драйвер в Kubernetes. |
| `rotate_vault_secret.sh` | Плановая ротация секрета в Vault. |
| `test_vault_sync.sh` | Проверяет доступность и права перед запуском синхронизации. |

## Использование

1. Настройте переменные окружения (`VAULT_ADDR`, `VAULT_TOKEN`, `AWS_PROFILE`, `AZURE_SUBSCRIPTION_ID` и т.д.).
2. Запустите нужный скрипт, например:
   ```bash
   python scripts/secrets/aws_sync_to_vault.py --prefix 1cai/prod
   ```
3. Для Kubernetes используйте `./apply_vault_csi.sh` и манифесты из `infrastructure/vault/`.

Подробные инструкции по политике секретов описаны в `docs/ops/vault.md`.

