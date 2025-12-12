from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CourseCraft API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://coursecraft:coursecraft@localhost:5555/coursecraft"

    class Config:
        env_file = ".env"


settings = Settings()
