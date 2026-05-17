from fastapi import APIRouter

from app.models.watchlist import WatchlistEvaluationResponse, WatchlistItem, WatchlistItemCreate
from app.services.watchlist_store import (
    create_watchlist_item,
    delete_watchlist_item,
    evaluate_watchlist_items,
    list_watchlist_items,
)

router = APIRouter(tags=["watchlist"])


@router.get("/watchlist", response_model=list[WatchlistItem])
def read_watchlist() -> list[WatchlistItem]:
    return list_watchlist_items()


@router.post("/watchlist", response_model=WatchlistItem)
def create_watchlist(payload: WatchlistItemCreate) -> WatchlistItem:
    return create_watchlist_item(payload)


@router.delete("/watchlist/{item_id}")
def delete_watchlist(item_id: str) -> dict[str, bool]:
    return delete_watchlist_item(item_id)


@router.post("/watchlist/evaluate", response_model=WatchlistEvaluationResponse)
def evaluate_watchlist() -> WatchlistEvaluationResponse:
    return evaluate_watchlist_items()
