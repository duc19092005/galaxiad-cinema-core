# 🎬 CINEMA BOOKING PLATFORM — API BACKEND

🌐 **Select Language:** ![VN](https://flagcdn.com/w20/vn.png) [Tiếng Việt](./README.md) • ![GB](https://flagcdn.com/w20/gb.png) [English](./README.en.md) • ![RU](https://flagcdn.com/w20/ru.png) [Русский](./README.ru.md)

---

> **A modern, high-performance, and real-time backend solution designed for large-scale cinema chain operations.**

---

## 📌 Project Overview
The **Cinema Booking Backend** is built on **ASP.NET Core 8** and **SQL Server**, offering a comprehensive suite of APIs for modern cinema chain management. The system is engineered to deliver a seamless customer experience through **real-time seat locking**, secure electronic payments, conflict-free scheduling algorithms, and automated background administration.

The project adheres to **Pragmatic Clean Architecture**, ensuring modularity, clear separation of concerns, high testability, and long-term maintainability.

---

## 🎯 Business Values & Core Features

This platform translates complex cinema operations into robust backend workflows:

### 1. Seamless Booking & Payment Experience
*   **Multi-Auth Integration:** Supports traditional secure login via JWT (AccessToken & RefreshToken) alongside convenient **Google OAuth 2.0** authentication.
*   **Intuitive Movie Browsing:** APIs to retrieve "Now-Showing" and "Coming-Soon" movie catalogs, filtered by specific theaters, dates, and times.
*   **Real-time Seat Locking (SignalR):** When a user selects a seat and initiates payment, the system **locks the seat temporarily for 10 minutes** using SignalR. The seat status changes in real-time on all other active users' screens, preventing **double bookings**. If payment is not completed within 10 minutes, a Hangfire background job automatically releases the hold.
*   **E-Payment Gateway:** Fully integrated with the **VNPay sandbox**, ensuring secure, verified, and automated transaction updates via secure webhook callbacks.

### 2. Conflict-Free Movie Scheduling (Breakdown Time Algorithm)
*   **Theater Cleanup Interval:** The system features an automatic scheduling validator. Between any two showtimes in the same auditorium, there must be a minimum of **15 minutes of breakdown time** for cleaning and preparation. This algorithm prevents managers from accidentally scheduling overlapping movies.

### 3. Dynamic Ticket Pricing Engine (Seat Surcharge & Segment Discount Engine)
Rather than relying on static, hard-coded pricing, the platform features an intelligent **Dynamic Pricing Engine** designed to maximize venue revenue while cultivating customer loyalty. The ticket price calculation is performed in two decoupled steps:

1. **Step 1: Format & Venue Surcharge (Surcharge Engine)**
   Optimizes revenue per seat for premium screening formats and premium theater locations (e.g., IMAX, 3D, VIP halls, high-traffic venues).
   $$\text{Price after Surcharge} = \text{Base Price} \times \left(1 + \frac{\text{Surcharge Percent}}{100}\right)$$
   *Surcharges are dynamically resolved based on the specific combination of: `(Cinema, Movie Format 2D/3D/IMAX)`.*

2. **Step 2: Customer Loyalty Discount (User Segment Discount)**
   Encourages repeat purchases and improves Customer Retention Rates by automatically applying tier-based discounts during checkout.
   $$\text{Final Price} = \text{Price after Surcharge} \times \left(1 - \frac{\text{Discount Percent}}{100}\right)$$
   *Discounts are automatically determined by the user's loyalty segment: Standard (5%), Student (10%), or VIP (15%).*

### 4. POS, Department & Attendance Flow Integration
*   **Cashier Department Sync:** Supports isolated POS departments per cinema branch. Automatically spins up shared cashier accounts (role `Cashier`) and ensures immediate deactivation (`AccountStatus = Banned`) and staff status changes (`WorkingStatus = false`) using Database Transactions when a department is deleted or deactivated.
*   **Biometric Attendance (128d Face Vector Match):** Staff members clock in and clock out directly at the POS terminal using webcam-based facial recognition (comparing 128-dimensional embedding vectors) without needing their own credentials on the terminal.
*   **Staff Attribution & VIP POS Checkout:** Differentiates the cashier (`StaffId` - automatically resolved via active shifts if not provided) from the buyer (`UserId` - resolved by email to allow points accumulation and member pricing segments VIP 15% / Student 10% dynamically).

### 5. Cinema-based Query Filtering
*   **Movie Manager Filter:** Allows filtering movies lists (`GET /api/movieManager/movies?cinemaId=...`) to only display movies allocated/assigned to a specific cinema.
*   **Admin Dashboard Stats Filter:** Managers can filter the entire management dashboard stats (`GET /api/v1/admin/dashboard/management?cinemaId=...`) to track revenue, tickets sold, daily/hourly graphs, movie rankings, transactions, and audit logs of a single theater.

---

## 🔐 Login Credentials (Dev Environment / Seed Data)

> **Common password for all accounts:** `anhduc9a5`

| Role | Email | Description |
|------|-------|-------------|
| **Admin** | `admin@cinema.com` | System administrator (full access) |
| **Movie Manager** | `movie.manager@cinema.com` | Manage movie content |
| **Theater Manager** | `theater.manager@cinema.com` | Manage theater operations + shift approval |
| **Facilities Manager** | `facilities.manager@cinema.com` | Manage facilities, create cinemas |
| **Cashier (Tickets)** | `quay_ve_01@cinema.com` | Ticket counter sales |
| **Cashier (Food)** | `quay_bapnuoc_01@cinema.com` | Food & beverage counter sales |

> **Note:** When a **new cinema is created** via API `POST /api/facilities/cinema`, the system **automatically creates a cashier account** for that cinema with:
> - Email: `cashier_{CinemaId}@cinema.com`
> - Default password: `123456`
> - Role: `Cashier`

---

## 👥 Modules & Permission System (Roles & User Segments)

Access control is strictly partitioned to mirror real-world cinema operations, utilizing 6 distinct system roles:

| System Role | Scope of Work & Capabilities |
| :--- | :--- |
| **Customer** | Browse movies, book seats, perform VNPay payments, view order history, and accumulate loyalty points. |
| **Admin** | System-wide management, user account locking, system configurations, and monitoring security Audit Logs. |
| **MovieManager** | Manage movies, formats, upload movie posters (integrated with Cloudinary), and configure movie metadata. |
| **TheaterManager** | Control schedules and showtimes for assigned theaters. The system automatically enforces the overlap-prevention algorithm. |
| **FacilitiesManager** | Manage infrastructure, layout structures (Standard, VIP, Couple seats), audit rooms, and equipment. |
| **Cashier** | Facilitate ticket sales and offline checkouts directly at the physical ticket counter. |

> 💡 **Design Highlight:** `VIP` and `Student` are **not system roles**, but rather **User Segments** (customer classifications). This key design choice decouples **access authorization** (Roles) from **pricing and loyalty programs** (Segments), making it incredibly easy to introduce new categories (e.g., Senior, Child) without rewriting permission logic.

### User Segments & Loyalty Pricing:
*   **Standard Member:** 5% ticket discount, 1.0x point multiplier (Assigned automatically upon registration).
*   **VIP Member:** 15% ticket discount, 2.0x point multiplier (Manually promoted by Admin based on spendings).
*   **Student:** 10% ticket discount, 1.5x point multiplier.

---

## 🛠️ Tech Stack & Architecture

High-quality development standards have been applied to ensure performance, security, and scalability:

### 1. Technology Catalog
*   **Language & Framework:** C# / .NET 8, ASP.NET Core Web API
*   **Database & ORM:** MS SQL Server, Entity Framework Core 8
*   **Real-time Broadcast:** SignalR Hubs
*   **Background Jobs:** Hangfire (managing automatic release of expired seat holds)
*   **Third-Party Services:**
    *   **VNPay:** Electronic payment gateway.
    *   **Cloudinary:** Secure cloud storage and delivery of movie poster assets.
    *   **Google OAuth 2.0:** Secure identity verification.
*   **API Documentation:** Swagger OpenAPI (divided into modular documents for simplified API testing).

### 2. Clean Architecture (4-Layer)
The backend is structured into 4 clean layers:
*   **`Cinema.Domain`**: Pure business core containing Entities, Enums, Custom Exceptions, Repository/UnitOfWork Interfaces, Constants, and Utils. It has zero external dependencies.
*   **`Cinema.Application`**: Application-specific logic containing Use Cases, DTOs, Application Interfaces, and Validators.
*   **`Cinema.Infrastructure`**: DB Context, Migrations, Seed Data, Repositories implementations, and integration adapters (VNPay, Cloudinary, Redis, DeepSeek AI).
*   **`Cinema.Api`**: API Presentation layer containing controllers, middlewares, bootstrapper DI configurations, SignalR hubs, and Program.cs.

### 3. Engineering Highlights
*   **Unit of Work & Repository Pattern:** Ensures all operations inside a booking session (creating orders, locking seats, deducting customer points) execute inside a single database transaction. This prevents data inconsistency.
*   **Database Engine Independence:** The Business Layer depends only on the `IUnitOfWork` interface, allowing database swaps in the future.
*   **Dockerized:** Ships with Dockerfile and Docker Compose configurations for instant local deployment.

---

## 📂 Developer Resources

For technical deep-dives, setting up the local environment, or code contributions, please consult the internal developer documentation:

*   **[Technical Implementation Plan](./docs/dev/implementation_plan.md)**: Detailed class structures, EF Core entity relationships, and architectural blueprints.
*   **[Task Tracker](./docs/dev/task.md)**: Work items, refactoring progress, and current roadmap status.
*   **[POS & Attendance Flow Integration Guide](./README_POS_FLOW.md)**: Comprehensive guide for Frontend developers to integrate counter POS endpoints, facial recognition, and staff attribution.

---

## 📈 Build Status
*   **Compilation Status:** ✅ Success (`dotnet build` -> 0 errors).
*   **Database Health:** Applied migrations up to VIP Segment adjustments, ensuring absolute schema validity.
