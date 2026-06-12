# Project: Niranjan Plastic Udyog - Factory Management System

## Overview
Create a modern, responsive Progressive Web Application (PWA) for managing a plastic factory's daily operations. The system must work completely offline-first using IndexedDB and feature a modern, glassmorphism-inspired UI. It must support seamless English and Nepali language switching.

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript (No complex frameworks)
- **Architecture**: Single Page Application (SPA) with custom hash-based router
- **Database**: Dexie.js (IndexedDB wrapper) for offline storage
- **Styling**: Vanilla CSS with CSS Variables for theming (Light/Dark mode support)
- **Features**: PWA (manifest + Service Worker)

## Core Requirements & Business Logic

### 1. Internationalization (i18n)
- The app must support instant switching between English and Nepali without page reloads.
- Use a central `i18n.js` engine that fetches JSON translation files.
- **CRITICAL**: The translation system must work reliably with dynamically rendered content (like router page transitions). Use a robust reactive pattern or ensure translations are applied *after* the DOM has fully rendered.
- All numbers and currencies must be formatted according to the selected language (e.g., using Nepali digits `१२३` when Nepali is selected).

### 2. User Authentication & Roles
- **Roles**: Admin and User.
- **Offline Auth**: Must support mock offline authentication for demo purposes (e.g., `admin`/`admin123`).
- Admins can add products, update payments, and manage users. Regular users have restricted access.

### 3. Database Schema (Dexie.js)
Initialize a database with the following tables:
- `transactions`: `++id, billNo, date, customerId, paymentStatus, syncStatus, updatedAt`
- `customers`: `++id, name, phone, panNo, isFrequent, syncStatus, updatedAt`
- `products`: `++id, name, category, status, syncStatus, updatedAt`
- `syncQueue`: `++id, operation, table, recordId, timestamp`

### 4. Page Modules

**A. Dashboard**
- Overview cards: Today's Sales, Pending Dues, Low Stock Items, Total Customers.
- Quick action buttons (New Transaction, Add Customer, View Stock).
- Table of recent transactions.

**B. Stock Management**
- List all products with their current quantity, price/rate, and status (IN STOCK, LOW STOCK, OUT OF STOCK).
- Admin features: Add new products, edit existing products, and quickly add stock.
- When a transaction is saved, stock quantities must automatically deduct.

**C. Customer Management**
- List customers with Name, Phone, PAN, Total Purchases, and Pending Dues.
- Calculate total purchases and dues dynamically based on the transactions table.

**D. Transactions (Billing)**
- Create new bills/transactions.
- Select an existing customer or add a new one inline.
- Add multiple items to the bill with automatic total calculation.
- Track payment status (Paid, Partial, Due).

**E. Receipts**
- A detailed view of a single transaction formatted to look like a physical factory bill.
- Must include: Factory Name, Address, Bill No, Date, PAN No, Buyer Name, Itemized table, Total Sum, Amount in Words, and Payment Status.
- Must have a print-friendly CSS stylesheet (`@media print`).

**F. Admin (Payments)**
- A dedicated view for admins to see all transactions and their due balances.
- Ability to record new partial or full payments against a due bill, updating the transaction's `dueAmount` and `paymentStatus`.

### 5. Sync Engine
- Monitor `navigator.onLine` status.
- Show an offline indicator banner when there are pending changes in the `syncQueue`.
- Provide a "Sync Now" button that clears the queue and updates status to 'synced'.

## Design & Aesthetics (CRITICAL)
- **Aesthetics**: The design must feel extremely premium, modern, and "wow" the user. Do not make a basic MVP design.
- **Colors**: Use a harmonious, vibrant palette (e.g., deep indigo primary `#6366f1`, emerald success, amber warning, slate backgrounds). Avoid pure white or pure black.
- **UI Elements**: 
  - Use glassmorphism effects (subtle translucency with backdrop blur) for modals and floating elements.
  - Apply soft, layered drop shadows (`box-shadow`) to cards to give depth.
  - Inputs should have focus rings and smooth transition effects.
- **Typography**: Use modern sans-serif fonts (e.g., `Inter` for English, `Noto Sans Devanagari` for Nepali).
- **Animations**: Add subtle micro-animations (e.g., buttons shifting up 1px on hover, modals sliding in smoothly, toast notifications fading in).

## Implementation Guidelines to Avoid Past Bugs
1. **Router Stability**: Ensure the hash-router handles asynchronous page rendering correctly to avoid race conditions with the i18n translation engine.
2. **Event Delegation**: Since pages re-render dynamically, ensure event listeners on dynamic buttons (like Edit, Delete, View) are attached correctly after every render, or use event delegation on the parent container.
3. **No Hardcoded Text**: Absolutely no hardcoded English text in HTML templates. Every single label, header, and button must use a `data-i18n` attribute linked to the translation JSON files.
