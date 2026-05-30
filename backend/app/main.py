from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, recipes, families, meal_plans, shopping

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HomeChef Hub",
    description="家庭食谱管理与膳食规划平台",
    version="1.0.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(recipes.router)
app.include_router(families.router)
app.include_router(meal_plans.router)
app.include_router(shopping.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "HomeChef Hub"}
