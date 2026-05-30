from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "HomeChef Hub"
    DATABASE_URL: str = "postgresql://homechef:homechef@db:5432/homechef"
    SECRET_KEY: str = "change-this-in-production-use-a-real-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()
