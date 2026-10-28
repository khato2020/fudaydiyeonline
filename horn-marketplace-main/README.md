# Horn Marketplace

App Name: HornMarketplace MVP

Purpose:

Build a multi-vendor e-commerce platform designed for regional retail and wholesale trade. The app allows retail customers to browse products, select delivery points, and check out using mobile money, while enabling local merchants to list items and view orders.

Core Roles & Features:

Buyer Front-End:

Product Catalog with search filters (Category, Price in USD / SLSh, Location: Hargeisa, Berbera, Burao, Tog Wajaale).

Product details page showing merchant info, stock availability, and a "Chat on WhatsApp" button for bulk inquiries.

Delivery location selector allowing users to set a GPS pin or input a landmark address note.

Checkout flow with simulated local mobile money payment prompts (Zaad, eDahab, Sahal).

Merchant Portal:

Simple dashboard to add new products (Title, Price in USD & SLSh, Photos, Stock, Category).

Order status queue (New Order, Packed, Out for Delivery, Completed).

Currency & Localization:

Dual currency support ($ USD and SLSh) with a live toggle calculation (1 USD = 8,500 SLSh).

Design & Feel:

Clean, mobile-first, and lightweight. Modern neutral interface with high contrast action buttons (green/blue accents for checkout and WhatsApp links). Fast-loading image cards optimized for mobile data.

Data & Storage:

Store users, merchant profiles, products, orders, and delivery addresses in persistent backend storage. Include mobile-responsive web view and user auth (Email/Phone login).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c3e43ac-59be-4d3b-a2ff-633916527220).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
