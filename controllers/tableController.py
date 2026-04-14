import asyncio
import random

from temp_modules.DB_imitation import d

# --- Мок-данные для имитации БД ---

MOCK_COLUMNS = [
    {
        "name": "user_id",
        "type": "integer",
        "description": "Уникальный идентификатор пользователя в системе. Primary Key.",
        "type_group_id": 1
    },
    {
        "name": "username",
        "type": "varchar",
        "description": "Логин пользователя. Должен быть уникальным и содержать только латинские буквы.",
        "type_group_id": 2
    },
    {
        "name": "email",
        "type": "varchar",
        "description": None,  # Проверка отображения "описание отсутствует",
        "type_group_id": 2
    },
    {
        "name": "registration_date",
        "type": "date",
        "description": "Дата регистрации аккаунта. Не может быть в будущем.",
        "type_group_id": 3
    },
    {
        "name": "account_balance",
        "type": "decimal",
        "description": "Текущий баланс счета. Может быть отрицательным при овердрафте, но не меньше -1000.",
        "type_group_id": 1
    },
    {
        "name": "is_active",
        "type": "boolean",
        "description": "Флаг активности аккаунта",
        "type_group_id": 4
    },
    {
        "name": "last_login_timestamp",
        "type": "timestamp",
        "description": "Время последнего входа в систему. Используется для анализа активности.",
        "type_group_id": 3
    },
    {
        "name": "profile_description",
        "type": "text",
        "description": "Краткая информация о пользователе, заполняется вручную. Максимум 500 символов.",
        "type_group_id": 2
    }
]

def get_d():
    return d


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
    print(payload)

    sample_general_statistics = [
        ['num_rows', 'Число строк в выгрузке', d['num_rows']],
        ['duplicate_rows', 'Число дубликатов по всем полям', d['duplicate_rows']['count']]
    ]

    # Генерируем фейковую статистику на основе колонок из мока
    sample_statistics = {}
    for col_name, col_stats in d["columns"].items():
        col_type = col_stats["dtype"]

        stats = {
            "type": col_type,
            "null_count": col_stats["null_count"],
            "unique_count": col_stats["unique_count"]
        }

        if col_type in ["String"]:
            stats["min"] = col_stats["min_length"]
            stats["max"] = col_stats["max_length"]
            stats["median"] = col_stats["median_len"]
            stats["zero"] = col_stats["str_empty_words"]
            stats["type_special"] = {
                "problematic_symbols": col_stats["problematic_symbols"],
                "leading_gaps": col_stats["leading_gaps"],
                "mixed_language": col_stats["mixed_language"]
            }
        elif col_stats.get("min", None) is not None:
            stats["min"] = col_stats["min"]
            stats["max"] = col_stats["max"]
            stats["median"] = -1
            stats["zero"] = col_stats["zero_count"]
            stats["type_special"] = {
                "quantile_lower_bound": col_stats["quantile"]["lower_bound"],
                "quantile_lower_count": col_stats["quantile"]["lower_count"],
                "quantile_upper_bound": col_stats["quantile"]["upper_bound"],
                "quantile_upper_count": col_stats["quantile"]["upper_count"],
            }
            if col_stats.get("inf_count", None) is not None:
                stats["type_special"]["inf_count"] = col_stats["inf_count"]
                stats["type_special"]["nan_count"] = col_stats["nan_count"]
        elif col_stats.get("default_1970_count", None) is not None:
            stats["type"] = 'Datetime'
            stats["min"] = col_stats["min_date"]
            stats["max"] = col_stats["max_date"]
            stats["type_special"] = {
                "default_1970_count": col_stats["default_1970_count"],
                "less_min_date": col_stats["less_min_date"],
                "more_cur_date": col_stats["more_cur_date"]
            }

        if random.random() > 0.4:
            arr = []
            for i in range(1 + int(random.random()*10 / 2.5)):
                arr.append([f"p_{i}", round(random.random()*10, 3), "Некое пояснение к проверке!!!!"])
            stats["custom"] = arr
        sample_statistics[col_name] = stats

    # Формируем мета-статистику таблицы
    metadata_stats = [
        ["table_name", "Имя таблицы", table_name],
        ["num_columns", "Число атрибутов", d["num_columns"]],
        ["file_count", "Число файлов в таблице", d['file_count']],
        ["dataset_size", "Размер таблицы в ГБ", f"{d['dataset_size'][0]:.3f} {d['dataset_size'][1]}"],
        ["row_count_estimate", "Оценочное кол-во строк", d['dataset_row_count_estimation']],
        ["small_files", "Флаг маленьких файлов", f"{'Да' if d['small_files'][0] else 'Нет'} ({round(d['small_files'][1], 3)} {d['small_files'][2]})"],
        ["large_data_not_partitioned", "Флаг необходимости партицирования данных", f"{'Да' if d['large_data_not_partitioned'][0] else 'Нет'} ({round(d['large_data_not_partitioned'][1], 3)} {d['large_data_not_partitioned'][2]})"],
        ["column_problem_flag", "Флаг проблемы с числом колонок", d['column_problem_flag']],
        ["cols_exist_null_partition", "Атрибуты-партиции с null значением", ',\n'.join(d['cols_exist_null_partition']) if d['cols_exist_null_partition'] is not None else None],
        ["empty_partitions", "Число пустых партиций", d['empty_partitions']],
        ["meaningless_partitiions", "Партиции, не несущие полезной информации", ',\n'.join(d['meaningless_partitiions']) if d['meaningless_partitiions'] is not None else None]
    ]

    # Генерируем Markdown советы
    gigachat_tips = f"""## Анализ таблицы `{table_name}`

Проверка выполнена успешно. Вот несколько рекомендаций:

1. **Пропущенные значения**: 
   - В колонке `email` обнаружено **{10000}%** NULL значений. Рекомендуется настроить ограничение `NOT NULL`.

2. **Аномалии**:
   - Поле `account_balance` имеет отрицательные значения. Убедитесь, что это легитимный овердрафт.

3. **Производительность**:
   - Рассмотрите возможность индексации поля `registration_date`, так как по нему часто фильтруют данные.

> *Совет сгенерирован автоматически на основе статистики выборки.*
"""

    return {
        "table_metadata_statistics": metadata_stats,
        "sample_general_statistics": sample_general_statistics,
        "sample_statistics": sample_statistics,
        "gigachat_tips": gigachat_tips
    }