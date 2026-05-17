from fastapi import APIRouter

from app.models.asset import AssetInfo, AssetSearchResult, AssetType
from app.services.asset_registry import get_registered_asset_info, search_assets
from app.services.market_data import get_asset_info

router = APIRouter(tags=["assets"])


@router.get("/assets/search", response_model=list[AssetSearchResult])
def search_asset_list(assetType: AssetType = AssetType.STOCK, q: str = "") -> list[AssetSearchResult]:
    return search_assets(assetType, q)


@router.get("/assets/{asset_type}/{asset_id}", response_model=AssetInfo)
def read_typed_asset(asset_type: AssetType, asset_id: str) -> AssetInfo:
    return get_registered_asset_info(asset_type, asset_id)


@router.get("/assets/{ticker}", response_model=AssetInfo)
def read_asset(ticker: str) -> AssetInfo:
    return get_asset_info(ticker)
