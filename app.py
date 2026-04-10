from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routers import tableRouter


app = FastAPI()

# Подключаем маршруты API
app.include_router(tableRouter.router, prefix="/api")

# Отдаём статические файлы фронтенда из папки "static"
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Отдаём index.html для всех маршрутов, которые не начинаются с /api или /static.
    Это позволяет фронтенду работать на том же домене и порту, что и бэкенд.
    """
    if full_path.startswith("api") or full_path.startswith("static"):
        # Это не маршрут фронтенда, пусть его обработают другие роуты/приложения
        raise HTTPException(status_code=404)

    return FileResponse("static/index.html")
