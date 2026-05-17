from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3020",
    ]

    model_config = SettingsConfigDict(env_prefix="NSIP_")


settings = Settings()
