# Auction finder

![image](https://github.com/moustaxx/auction/assets/39012456/11523e02-0500-4c76-bcca-2b94aa3dafc8)

## Features
- **Multi-platform support**: Works with OLX and Allegro auction platforms.
- **Headless browser support**: Uses Puppeteer for scraping Allegro with stealth mode enabled.
- **Push notifications**: Get real-time notifications for new offers.
- **Captcha handling**: Automatically detects and assists in solving captchas.
- **Error logging**: Logs errors with detailed stack traces and optional screenshots.
- **Data persistence**: Saves and loads offers to/from a JSON database.
- **Customizable configuration**: Adjust logging, intervals, and other settings via a config file.

## Installation
You will need to have NodeJS and pnpm installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/moustaxx/auction.git
   cd auction
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the application:
   ```bash
   pnpm start
   ```