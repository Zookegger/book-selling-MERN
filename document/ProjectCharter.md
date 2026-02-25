# Project Charter: LuminaBooks E-Commerce Platform

**Version:** 1.0  
**Timeline:** 5 Weeks (Sprint-based)  
**Tech Stack:** MERN + TypeScript + MUI

---

## 1. Executive Summary

LuminaBooks is a high-performance, professional-grade e-commerce platform designed for book retailers. The system leverages the MERN stack (MongoDB, Express, React, Node.js) with a focus on type-safety, modular architecture, and a seamless user experience. As a college-level capstone project, it demonstrates enterprise-level practices including Service-Layer architecture, End-to-End testing, and Material UI design systems.

## 2. Business Requirements (MVP Scope)

### 2.1 User Management

- **Authentication:** Secure registration and login using JWT and HTTP-only cookies.
- **Authorization:** Role-Based Access Control (RBAC) distinguishing between "Customer" and "Admin" roles.
- **Profile:** Users can view their order history and manage shipping details.

### 2.2 Catalog & Discovery

- **Search:** Real-time search functionality for book titles and authors.
- **Filtering:** Categorization by genre (Fiction, Science, etc.) and price range.
- **Product Details:** Dynamic routing to individual book pages with rich metadata.

### 2.3 Transactional Flow

- **Shopping Cart:** Persistent cart state (survives page refreshes) using React Context and LocalStorage.
- **Checkout:** A multi-step simulation of order placement including address confirmation.
- **Order Management:** Generation of unique order IDs and status tracking (Pending -> Shipped -> Delivered).

### 2.4 Administrative Control

- **Inventory Dashboard:** A protected interface for admins to Create, Read, Update, and Delete (CRUD) book records.
- **Sales Overview:** Basic metrics showing total orders and stock alerts.

---

## 3. Technical Architecture

### 3.1 Backend (Node.js/Express)

- **Pattern:** Controller-Service-Repository.
- **Validation:** Mongoose Schema-level validation (Strong typing via TypeScript).
- **Testing:** **Jest** + **Supertest** for API endpoint integrity.

### 3.2 Frontend (React/Vite)

- **Pattern:** Feature-based modularity.
- **UI Library:** **Material UI (MUI)** with a centralized Theme Provider.
- **State Management:** React Context API for global states (Auth/Cart).
- **Testing:** **Cypress** for "Happy Path" E2E testing.

---

## 4. Data Model (High-Level)

| Entity    | Key Fields                                                | Relationship       |
| :-------- | :-------------------------------------------------------- | :----------------- |
| **User**  | email, password, role, address                            | 1:N with Orders    |
| **Book**  | title, author, price, category, stock, ratings            | N:M via Orders     |
| **Order** | user_id, items[book_id, price_at_purchase], total, status | Links User & Books |

---

## 5. 5-Week Development Roadmap

### Week 1: Foundation & Plumbing

- **Lead:** Environment setup, Repo initialization, MUI Theme config.
- **Team:** Database connection logic and basic Mongoose models.

### Week 2: Authentication & Catalog

- **Lead:** JWT Middleware & Auth Context.
- **Team:** Login/Signup UI and the Book Catalog API.

### Week 3: Cart Logic & Search

- **Lead:** Cart Context & Search optimization.
- **Team:** Filter sidebar, Search bar, and Cart persistence logic.

### Week 4: Orders & Checkout

- **Lead:** Order processing Service & Backend security.
- **Team:** Checkout form, Order History view, and Admin CRUD.

### Week 5: QA, Polish & Deployment

- **Lead:** Deployment (Render/Vercel) & Final System Integration.
- **Team:** Cypress E2E tests, bug fixing, and UI/UX polishing.

---

## 6. Definition of Done (DoD)

A feature is considered "Done" only when:

1.  Code is written in **TypeScript** with no `any` types.
2.  The UI follows the **MUI Theme** guidelines.
3.  The feature is covered by at least one **Jest** (API) or **Cypress** (UI) test.
4.  The Lead Architect has performed a Code Review.

---
