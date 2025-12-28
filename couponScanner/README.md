# Coupon Scanner

Mobile-friendly React app to capture a coupon photo, run on-device OCR, and pull out the code, expiry, and discount.

## Features

- Camera or gallery upload with drag-and-drop
- On-device OCR via `tesseract.js` (no server upload)
- Heuristics to extract coupon code, expiry date, and discount
- Mobile-first UI with live progress and raw text view

## Tech stack

- React (Vite + React Compiler)
- Tesseract.js for OCR
- Vanilla CSS for layout and responsiveness

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
3. Build for production
   ```bash
   npm run build
   ```

## Usage tips

- Use bright, even lighting and fill the frame with the coupon.
- If OCR misses characters, retake the photo with sharper focus.
