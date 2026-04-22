from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from controllers import tableController
import json

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
    Запускает валидацию с потоковой передачей прогресса.
    Возвращает StreamingResponse с JSON-событиями.
    """
    body = await request.json()

    # Создаём генератор событий
    event_generator = tableController.validate_stream(body)

    # Возвращаем поток с правильными заголовками
    return StreamingResponse(
        event_generator,
        media_type="application/x-ndjson",  # или text/plain
        headers={
            "X-Accel-Buffering": "no",  # отключаем буферизацию nginx
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# @router.post('/validate')
# async def validate(request: Request):
#     """
#     Запускает валидацию.
#     Ожидает JSON: { "tableName": "...", "rowLimit": 10000, "columnConditions": {...} }
#     """
#     body = await request.json()
#     return await tableController.validate(body)