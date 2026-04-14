# app.py
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from routers import tableRouter

app = FastAPI()

# Подключаем маршруты API
app.include_router(tableRouter.router, prefix="/api")

# Отдаём статические файлы фронтенда из папки "static"
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Главная страница"""
    return FileResponse("static/index.html")


@app.get("/{full_path:path}")
async def catch_all(request: Request, full_path: str):
    """
    Catch-all маршрут для всех остальных путей
    """
    # API запросы уже обработаны, если дошли сюда - значит эндпоинт не найден
    if full_path.startswith("api/"):
        return {"error": f"API endpoint '/{full_path}' not found"}

    # Для всех остальных - редирект на главную
    return RedirectResponse(url="/")