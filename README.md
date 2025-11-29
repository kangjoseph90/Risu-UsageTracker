# Risu Usage Tracker

This is an API usage tracking and management plugin for RisuAI. It automatically tracks and visualizes costs, token usage, and errors for LLM requests.

## Features

### Usage Dashboard

-   **Real-time Statistics**: View total cost, request count, and token usage (input/output/cached) at a glance.
-   **Charts**:
    -   **Bar Chart**: Visualize usage trends from 5-minute intervals up to monthly views.
    -   **Donut Chart**: Analyze usage distribution by model, provider, and request type.
-   **Filtering**: Filter data by date, model, provider, and request type.

### Price Management

-   **Price Tracking**:
    -   **Confirmed Prices**: Manage verified model prices.
    -   **Temporary Prices**: Automatically track prices for new or unknown models with warning indicators.
-   **Flexible Editing**: Freely edit input, output, and cached token prices for each model.
-   **Retroactive Application**: Choose whether to apply price changes to past usage records when updating pricing information.

### Budget Management

-   **Budget Rules**: Create custom budget rules based on model, provider, or request type.
-   **Period Settings**: Set budget limits for Daily, Weekly, or Monthly periods.
-   **Budget Warnings**:
    -   Automatically send warning notifications when a specific percentage (e.g., 90%) of the budget is reached.
    -   Visually monitor budget consumption through progress bars.

### Record Management

-   **Detailed Logs**: Record timestamp, model, provider, latency, token count, and cost for every API request.
-   **Data Export**: Export recorded data to **JSON** or **CSV** files.
-   **Data Management**: Delete unnecessary records individually or in bulk.

### Provider Management

-   **URL Mapping**: Map complex API URLs to human-readable provider names (e.g., OpenAI, Anthropic).
-   **Custom Providers**: Manually modify or add provider names.

### Error Tracking

-   **Error Logs**: Record status codes and timestamps for failed API requests.
-   **Frequency Analysis**: View error frequency over time charts to identify when issues occur.

### System & Convenience

-   **Auto Update**: Automatically check for the latest version at startup and update with a single click while preserving settings.
-   **Backup & Restore**: Backup and restore all data to/from browser storage or files.
-   **Multi-language Support**: Supports multiple languages including English and Korean.

---

## Installation & Build

This plugin is designed to run directly within the RisuAI environment.

### 1. Install Dependencies

Run the following command in the project directory to install necessary packages.

```sh
npm install
```

### 2. Build Plugin

Build the plugin using the following command.

```sh
npm run build
```

Once the build is complete, a `dist/risu-usage-tracker.js` file will be generated.

### 3. Apply to RisuAI

Load the generated `dist/risu-usage-tracker.js` file in RisuAI's plugin settings or copy its content to apply.

---

## License

This project is licensed under the **MIT License**, allowing free use, modification, and distribution.
