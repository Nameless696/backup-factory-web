# Factory-App
Factory Management System for Niranjan Plastic Udyog Pvt. Ltd.

## Overview
A vanilla JavaScript Single Page Application (SPA) with offline support (PWA) using Dexie.js (IndexedDB) for local data storage and seamless synchronization.

## Features
- **Dashboard**: High-level metrics, frequent customers quick access, and clickable stat cards for detailed insights.
- **Stock Management**: Manage inventory, low-stock warnings, and one-click quick add/remove adjustments.
- **Customer Management**: Customer profiles, lifetime purchase statistics, top items purchased, and full transaction history.
- **Transactions & Billing**: Create new bills, print receipts, and manage outstanding dues with partial/full quick-payment tools.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admin** (full control, payment tracking, product editing) and **Staff** (view-only reporting, bill creation).
- **Internationalization (i18n)**: Full English and Nepali language support.

## Testing
To run the automated tests for business logic, RBAC, and i18n functionalities, open `tests/test-runner.html` in your browser.
