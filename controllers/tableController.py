import asyncio
import random

# --- Мок-данные для имитации БД ---

MOCK_COLUMNS = [
    {
        "name": "user_id",
        "type": "integer",
        "description": "Уникальный идентификатор пользователя в системе. Primary Key."
    },
    {
        "name": "username",
        "type": "varchar",
        "description": "Логин пользователя. Должен быть уникальным и содержать только латинские буквы."
    },
    {
        "name": "email",
        "type": "varchar",
        "description": None  # Проверка отображения "описание отсутствует"
    },
    {
        "name": "registration_date",
        "type": "date",
        "description": "Дата регистрации аккаунта. Не может быть в будущем."
    },
    {
        "name": "account_balance",
        "type": "decimal",
        "description": "Текущий баланс счета. Может быть отрицательным при овердрафте, но не меньше -1000."
    },
    {
        "name": "is_active",
        "type": "boolean",
        "description": "Флаг активности аккаунта"
    },
    {
        "name": "last_login_timestamp",
        "type": "timestamp",
        "description": "Время последнего входа в систему. Используется для анализа активности."
    },
    {
        "name": "profile_description",
        "type": "text",
        "description": "Краткая информация о пользователе, заполняется вручную. Максимум 500 символов."
    }
]


async def get_table_info(table_name: str):
    """
    Имитирует запрос метаданных таблицы.
    """
    # Имитация задержки сети
    await asyncio.sleep(0.5)

    # Простая проверка: если имя содержит "error", вернем ошибку для теста фронтенда
    if "error" in table_name.lower():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Таблица не найдена")

    return {
        "columns": MOCK_COLUMNS
    }


async def validate(payload: dict):
    """
    Имитирует процесс валидации данных.
    payload содержит: tableName, rowLimit, columnConditions
    """
    # Имитация тяжелой работы бэкенда
    await asyncio.sleep(1.5)

    table_name = payload.get("tableName", "unknown")

    # Генерируем фейковую статистику на основе колонок из мока
    sample_statistics = {}
    for col in MOCK_COLUMNS:
        col_name = col["name"]
        col_type = col["type"]

        stats = {
            "count": random.randint(1000, 10000),
            "null_percent": round(random.uniform(0, 5), 2)
        }

        if col_type in ["integer", "decimal", "bigint"]:
            stats["min"] = random.randint(-100, 0)
            stats["max"] = random.randint(100, 10000)
            stats["avg"] = round(random.uniform(0, 1000), 2)
        elif col_type in ["varchar", "text"]:
            stats["unique"] = random.randint(100, 5000)
            stats["min_length"] = 5
            stats["max_length"] = 150

        sample_statistics[col_name] = stats

    # Формируем мета-статистику таблицы
    metadata_stats = [
        ["table_name", "Имя таблицы", table_name],
        ["engine", "Движок хранения", "InnoDB"],
        ["row_count_estimate", "Оценочное кол-во строк", f"{random.randint(10000, 1000000):,}"],
        ["data_size", "Размер данных", f"{random.uniform(10, 500):.2f} MB"],
        ["last_analyzed", "Последний анализ", "2026-04-09 14:30:00"]
    ]

    # Генерируем Markdown советы
    gigachat_tips = f"""## Анализ таблицы `{table_name}`

Проверка выполнена успешно. Вот несколько рекомендаций:

1. **Пропущенные значения**: 
   - В колонке `email` обнаружено **{sample_statistics['email']['null_percent']}%** NULL значений. Рекомендуется настроить ограничение `NOT NULL`.

2. **Аномалии**:
   - Поле `account_balance` имеет отрицательные значения. Убедитесь, что это легитимный овердрафт.

3. **Производительность**:
   - Рассмотрите возможность индексации поля `registration_date`, так как по нему часто фильтруют данные.

> *Совет сгенерирован автоматически на основе статистики выборки.*
"""

    return {
        "table_metadata_statistics": metadata_stats,
        "sample_statistics": sample_statistics,
        "gigachat_tips": gigachat_tips
    }