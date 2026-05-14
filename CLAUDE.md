# CLAUDE.md

## Project overview

Non-Systematic Investment Plan (NSIP) — a tool to analyze asset performance under alternative investment strategies (vs regular SIP) and configure alerts for opportunistic investing.

## Core goals

1. **Asset analysis** — compare growth of different assets under various strategies (lump sum on dips, momentum-based, value averaging, etc.) vs a regular SIP baseline
2. **Alert dashboard** — notify when and how much to invest based on configurable market signals

## Key concepts

- "Non-systematic" means investing based on signals/conditions rather than on a fixed schedule
- Signals may include: price dips below moving averages, RSI thresholds, volatility windows, valuation metrics (P/E, etc.)
- Alerts should be actionable: tell the user the asset, suggested amount, and the reason

## Notes for Claude

- This project is in early stages — no code yet
- Prioritize simplicity; avoid over-engineering analysis pipelines before the core logic is proven
- Financial data sources TBD (likely public APIs like Yahoo Finance, NSE, or similar)
