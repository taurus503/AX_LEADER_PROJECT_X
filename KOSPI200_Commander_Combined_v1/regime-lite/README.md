# KOSPI200 Option Warfare Intelligence Agent v1

Static demo for KOSPI200 options regime analysis, strategy mapping, validation, and battle plan review.

## Restored Module 1
- date input and reset
- live market data loading with manual fallback
- confidence explanation cards
- recent news / report Top 3 paging
- beginner question box

## Files
- `index.html` - single-page dashboard
- `styles.css` - premium dark navy UI
- `app.js` - client-side rendering and navigation
- `sample-data.json` - mock data source
- `vercel.json` - static deployment config

## Run locally
Open `index.html` in a browser.

## Deploy on Vercel
Deploy this folder as the project root. No build step is required.

## Flow
`sample-data.json` -> `app.js` -> market/news APIs -> dashboard sections -> battle plan
