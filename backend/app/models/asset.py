from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class AssetType(StrEnum):
    STOCK = "STOCK"
    MUTUAL_FUND = "MUTUAL_FUND"
    ETF = "ETF"
    GOLD = "GOLD"
    CRYPTO = "CRYPTO"


class AssetInfo(BaseModel):
    assetType: AssetType = AssetType.STOCK
    assetId: str
    ticker: str
    name: str
    currency: str
    exchange: str | None = None
    latestPrice: float | None = None
    latestPriceDate: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class AssetSearchResult(BaseModel):
    assetType: AssetType
    assetId: str
    ticker: str
    name: str
    currency: str
    latestPrice: float | None = None
    latestPriceDate: str | None = None
