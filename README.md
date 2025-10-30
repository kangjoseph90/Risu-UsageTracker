
# Usage Tracker Plugin for RisuAI

This project is a plugin for RisuAI that tracks API usage, cost, and provider information for LLM requests. It is designed to be imported as a pre-built JavaScript file and used directly in the RisuAI environment.

## Features

- Tracks LLM API usage, including model, provider, and cost per request
- Supports multiple providers (OpenAI, Anthropic, Google, Azure, etc.)
- UI for viewing usage statistics, price management, and provider mapping
- Backup and restore of all usage and price data via browser IndexedDB
- Automatic cost calculation based on token usage and provider/model pricing
- Easily extendable for new providers and models

## Installation & Build

1. **Install dependencies:**
  ```sh
  npm install
  ```
2. **Build the plugin:**
  ```sh
  npm run build
  ```
  The output will be in `dist/usage-tracker.js`.

3. **Import in RisuAI:**
  Import the built `usage-tracker.js` file directly into your RisuAI environment as a plugin.

## Usage

- The plugin automatically tracks LLM API requests and responses.
- A floating button is injected into the RisuAI UI for opening the usage statistics modal.
- The modal provides tabs for usage statistics, price management, provider mapping, and raw record viewing.
- All data is stored using RisuAPI arguments and can be backed up/restored via the UI.

## Architecture Overview

- **src/main.ts**: Entry point. Initializes the `UsageTracker` and UI, and registers cleanup on unload.
- **src/tracker/usage.ts**: Core logic for tracking requests, extracting usage/cost, and recording data.
- **src/manager/**: Handles persistent storage and management of usage records, price info, and provider mapping.
- **src/ui/**: Svelte-based UI components for statistics, price, provider, and record management.
- **src/format/**: Format detection and parsing for different LLM API providers.
- **src/api.ts**: RisuAPI integration for argument storage, provider registration, and plugin lifecycle.
- **src/plugin.ts**: Plugin metadata, argument definitions, and constants.

## Data Model

- **Usage Records**: Timestamp, model, provider, URL, request type, token usage, and calculated cost.
- **Price Info**: Per-model, per-provider pricing (input, output, cached input).
- **Provider Map**: Maps API URLs to provider names.

## Backup & Restore

- All plugin data can be backed up to and restored from browser IndexedDB via the UI.
- Backup includes all usage, price, and provider mapping data.

## Customization

- To add new providers or models, update the price and provider constants in `src/consts/price.ts` and `src/consts/provider.ts`.
- Extend format detection in `src/format/` for new API response formats.

## License

This project is proprietary and intended for use with RisuAI only.
