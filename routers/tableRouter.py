from fastapi import APIRouter, Request
from controllers import tableController

router = APIRouter(
    prefix=""  # Префикс /api задается при подключении в app.py
)


@router.post('/table-info')
async def get_table_info(request: Request):
    """
    Получает название таблицы и возвращает список колонок.
    Ожидает JSON: { "tableName": "..." }
    """
    body = await request.json()
    table_name = body.get("tableName")

    if not table_name:
        return {"error": "Table name is required"}

    return await tableController.get_table_info(table_name)


@router.post('/validate')
async def validate(request: Request):
    """
    Запускает валидацию.
    Ожидает JSON: { "tableName": "...", "rowLimit": 10000, "columnConditions": {...} }
    """
    body = await request.json()
    return await tableController.validate(body)