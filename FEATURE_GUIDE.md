# SecureVisit - Application Feature Guide

Welcome to **SecureVisit**, your professional and secure visitor management solution. This guide provides a comprehensive overview of all functionalities available in the platform.

---

## 1. Multi-Tenant Architecture
SecureVisit is built on a robust multi-tenant architecture, ensuring each company has its own isolated workspace and data.

- **Main Application**: `app.localhost:3000` - Where new companies join and register.
- **Tenant Workspace**: `[subdomain].localhost:3000` - Your dedicated company portal (e.g., `acme.localhost:3000`).
- **Global Administration**: `admin.localhost:3000` - For system supervisors.

---

## 2. Branding & Customization
Every tenant workspace is uniquely branded to match your company's identity.

- **Custom Landing Page**: A clean, professional entry point featuring your company logo and name.
- **Subdomain Routing**: Your team and visitors access your specific portal via a dedicated subdomain.
- **Powered by Mokengeli**: Trust-backed security branding integrated throughout the interface.

---

## 3. Real-Time Dashboard
The dashboard provides a live high-level overview of your lobby activity.

- **Arrival Statistics**: Track visitors arrived today, currently on-site, and those who have departed.
- **Monthly Insights**: View total visit volume for the current month.
- **Live Activity Feed**: A scrollable list of the 10 most recent check-ins and check-outs, updated in real-time.
- **Dynamic Clock**: Always stay updated with the current system time and date.

---

## 4. Visit Management
The core of SecureVisit is a specialized portal for tracking and managing every visitor interaction.

- **Multi-Tabbed Tracking**:
    - **Arriving Today**: View upcoming or just-checked-in visitors.
    - **On-site**: Monitor exactly who is currently in your building.
    - **Exited**: Review historical data for visitors who have already departed.
- **Advanced Filtering**: Quickly find records using date presets (Today, Yesterday, Week, Month) or custom date/time ranges.
- **Intelligent Visit Creation**:
    - Unified modal to register new visitors or select existing ones.
    - Searchable autocompletes for **Hosts**, **Departments**, and **Services**.
- **Visit Checkout**: A dedicated workflow to record visitor departures, automatically calculating the total duration of the stay.

---

## 5. Visitor Management
Maintain a clean and searchable database of everyone who visits your facility.

- **Registered Visitors**: View and manage the contact details of frequent visitors.
- **Visitor Registration**: A focused form for onboarding new visitors with fields for Name, Phone, Company, and Visitor Type.
- **Visitor Categorization**: Group visitors into types (e.g., VIP, Contractor, Delivery) for better reporting.

---

## 6. Staff (Hosts) & Organizational Structure
Organize your internal team to ensure visitors are always correctly assigned to the right person.

- **Host Management**: Add and manage employees who can receive visitors.
- **Departmental Organization**: Group hosts into departments with abbreviations for quick identification.
- **Service Management**: Define specific services or categories of visits (e.g., "Interview", "Delivery", "Technical Support") that can be independent or linked to specific departments.

---

## 7. Visitor Kiosk Interface
SecureVisit includes a public-facing interface designed for tablets and reception desks.

- **Self-Service Check-in**: Visitors can register themselves upon arrival.
- **Public Accessibility**: No login required for the kiosk interface, keeping your backend management secure.

---

## 8. Global Administration
For platform owners to oversee the entire system.

- **Tenant Oversight**: Monitor all active companies using the platform.
- **User Management**: Manage system users and their respective roles.
- **System Statistics**: View global metrics across all tenants.

---

*Powered by Mokengeli Sarlu*
