# Comprehensive Project Documentation & Architecture Guide
## Expense & Wealth Tracker Application

---

## 📌 Executive Summary
This application is a full-featured, personal finance, wealth management, and asset tracking dashboard built using **React**, **Vite**, **TailwindCSS**, **Lucide Icons**, and **Firebase Firestore**.

It is designed to give complete control over monthly budgeting, investment commitments (SIPs), money lent to friends/family, isolated cash/notes (Side Vault), bike fuel & mileage performance, and items purchased on EMI.

---

## 🛠️ Technology Stack & Core Architecture

| Layer | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React 19 (Vite JS bundler) |
| **Styling & Design System** | TailwindCSS + Modern Dark Fintech Aesthetics (`src/index.css`) |
| **Backend & Database** | Firebase Firestore NoSQL Database with Ownership-Scoped Rules |
| **Authentication** | Firebase Auth (Google Sign-In & Email/Password) |
| **Icons & Visuals** | Lucide React Icons & Recharts (Data Visualization) |
| **Typography & Formatting** | JetBrains Mono (`.font-amount` for financial values) & Plus Jakarta Sans |

---

## 📁 Project Structure & File Map

```
d:\MAIN CODING\live\expense-tracker\
├── firestore.rules               # Firestore Database Security Rules
├── PROJECT_DOCUMENTATION.md      # Application System Documentation & Business Logic
├── src/
│   ├── main.jsx                  # Application Entry Point
│   ├── App.jsx                   # Root Auth State Wrapper
│   ├── index.css                 # Base Typography Scaling, Dark Mode & Custom Scrollbars
│   ├── hooks/
│   │   └── useUpcomingDues.js    # Smart EMI & SIP Due Date Engine
│   ├── lib/
│   │   ├── firebase.js           # Firebase App Initialization & Config
│   │   ├── utils.js              # Currency Formatter (INR formatINR)
│   │   └── expenseService.js     # Single Source of Truth for Firestore Queries & Data Operations
│   └── components/
│       ├── Dashboard.jsx         # Main Layout Container, Header Navigation & Tab Router
│       ├── AccountCards.jsx      # Multi-Bank Accounts Bar, Live Balances & Filters
│       ├── TransferModal.jsx     # Shift / Transfer Money Between Bank Accounts
│       ├── ManageAccountsModal.jsx # Create/Edit Accounts & Batch Migrate Past Transactions
│       ├── MonthlySummary.jsx    # Overview KPI Cards (Income, Expense, Net Balance, Budget Goal)
│       ├── AddTransaction.jsx    # Add Income/Expense/Shift Transaction Form
│       ├── TransactionList.jsx   # Recent Transactions List, Account Badges, Search, Filter & CSV Export
│       ├── UpcomingDuesNotification.jsx # Notification Bell & Urgent Dues Alert Banner
│       ├── AnalyticsTab.jsx      # Savings Rate, Expense Ratio, Category Share & Charts
│       ├── LendingTab.jsx        # Money Lent to Friends/Family & Receivable Tracking
│       ├── SipTab.jsx            # Mutual Fund SIP Investments Tracker & Allocation
│       ├── PocketNotesTab.jsx    # Side Cash Vault & Memo Notes Log
│       ├── PetrolTab.jsx         # Bike Refuel, Reserve Hit, Mileage & Fuel Payer Analytics
│       ├── EmiTab.jsx            # Gadgets/Appliances EMI Purchase & Tenure Tracker
│       └── ProfileModal.jsx      # Financial Summary & Net Worth Overview Modal
```

---

## 📖 Module-by-Module Feature Breakdown & Business Logic

### 1. 🏠 Monthly Overview (`MonthlySummary.jsx`, `AddTransaction.jsx`, `TransactionList.jsx`)
- **Core Purpose**: Track monthly cash flow (Income vs. Expense) for a selected month.
- **Key Business Logic**:
  - **Rollover Balance**: Transactions prior to the active month are summed (`Income - Expense`) to compute `previousBalance`, which rolls over as the starting balance for the current month.
  - **Running Balance**: Each transaction calculates its real-time running balance chronologically.
  - **CSV Statement Export**: Export monthly transaction records with headers (`Date`, `Type`, `Category`, `Account`, `Description`, `Amount`, `Running Balance`).
  - **Custom Categories**: Users can dynamically add custom categories stored in `userSettings/{userId}`.

---

### 2. 🏦 Multi-Bank Accounts & Internal Fund Shifting (`AccountCards.jsx`, `TransferModal.jsx`, `ManageAccountsModal.jsx`)
- **Core Purpose**: Maintain exact parity between real bank account balances (HDFC, SBI, Cash, etc.) and the application balance.
- **Key Business Logic**:
  - **Multi-Account Schema**: Accounts are stored in `userSettings/{userId}` with fields (`id`, `name`, `type`, `openingBalance`, `color`, `isDefault`).
  - **Zero Data Loss Guarantee**: Legacy transactions without an `accountId` automatically fall back to the default `Main Bank` with zero data migration required.
  - **Live Per-Account Formula**:
    $$\text{Balance}(\text{Account}) = \text{Opening Balance} + \sum \text{Incomes} - \sum \text{Expenses} + \sum \text{Transfers In} - \sum \text{Transfers Out}$$
  - **Total Combined Balance**:
    $$\text{Total Balance} = \sum_{\text{all accounts}} \text{Balance}(\text{Account})$$
    Maintains total wealth visibility while allowing isolated tracking per account.
  - **Internal Fund Shifting (`type === 'transfer'`)**: Moving money between accounts (e.g., ATM Cash withdrawal, Bank A $\rightarrow$ Bank B) without falsely inflating monthly income or expenses.
  - **Batch Reassignment / Shift Past Transactions**: Tool in `ManageAccountsModal.jsx` to reassign historical transactions from one account to another in 1 click (with optional category filtering).
  - **1-Click Filter Passbook**: Clicking any bank card filters the transaction list and running balance to that specific account.
  - **Privacy Mode (Hide Money / `₹••••••` with Tap-to-Peek)**: Quick-toggle Eye button in the header masks all currency values across the app. When active, clicking on any specific card or amount temporarily reveals only that number while all other amounts stay masked. Privacy state automatically synchronizes to both `localStorage` and Firestore `userSettings/{userId}.hideMoney` to persist across page reloads and logins.

---

### 2. 📊 Financial Analytics (`AnalyticsTab.jsx`)
- **Core Purpose**: Interactive visualization of cash flow, category distribution, savings rates, and expense ratios.
- **Key Features & Business Logic**:
  - **Savings Rate (%)** = `Max(0, ((Net Savings / Total Income) × 100))`
  - **Expense Ratio (%)** = `Min(100, ((Total Expense / Total Income) × 100))`
  - **Interactive Donut Chart**: Active shape slice hover effect (`renderActiveShape`) displaying category name, ₹ amount, and % share right inside the donut center.
  - **Gradient Cashflow Bar Chart**: Linear gradient fills (`#incomeGrad` & `#expenseGrad`) with rounded bars and glassmorphic tooltips.
  - **Color-Coded Distribution Table**: Category breakdown with glowing progress indicators and interactive row selection.

---

### 3. 🤝 Money Lending Tracker (`LendingTab.jsx`)
- **Core Purpose**: Managing money lent to friends, family, or colleagues.
- **Key Business Logic**:
  - **Status**: `PENDING` (Money yet to be received) vs. `PAID` (Cleared).
  - Full multiline description display on cards to view loan reasons/notes without truncation.
  - Glassmorphic modal form triggered via `+ New Lending Entry`.

---

### 4. 📈 SIP & Investments Tracker (`SipTab.jsx`)
- **Core Purpose**: Tracking monthly recurring mutual fund SIP commitments.
- **Key Business Logic**:
  - Store mutual fund name, monthly commitment amount, deduction date of month (calendar picker), and creation date.
  - Sorted strictly by **Order of Addition** (`createdAt`).
  - Allocation pie chart breaking down fund diversification.
  - Pop-up modal form triggered via `+ New SIP Entry`.

---

### 5. 📒 Pocket Notes & Side Vault (`PocketNotesTab.jsx`)
- **Core Purpose**: Tracking side cash (e.g., money received from family/father, off-the-record cash expenses, or notes).
- **Key Business Logic**:
  - Keeps cash received/spent isolated from main bank balance so account stats remain accurate.
  - Filterable by `All`, `Money Log` (`Received` / `Spent`), and `Notes`.

---

### 6. 🏍️ Bike Fuel & Mileage Tracker (`PetrolTab.jsx`)
- **Core Purpose**: Mileage calculation, refuel logs, reserve hit tracking, and payer analytics.
- **Key Business Logic**:
  - **Event Types**:
    - `Refuel (Fill Petrol)`: Log date, odometer reading, amount spent, liters filled, price/L, vehicle name, and payer.
    - `Reserve (Hit Reserve)`: Milestone when bike hits reserve fuel.
  - **Mileage Formulas**:
    - **Trip Delta** = `Current Odometer - Previous Log Odometer`
    - **Refuel Mileage (km/L)** = `Trip Delta / Liters Filled`
    - **Reserve-to-Reserve Mileage (km/L)** = `Trip Delta / Total Liters Filled between consecutive reserve milestones`
  - **Payer Category Analytics & Split Cards ("Paid by Me" vs. "Paid by Friend")**:
    - **Paid by Me (`isPaidByMe: true`)**: Deducted from main account transactions. Displays Total ₹ spent, Total Liters, refuel count, and % share.
    - **Paid by Friend (`isPaidByMe: false`)**: Tracked for bike performance, but ignored in cash deduction. Displays Total ₹ paid by friends, Total Liters, refuel count, and % share.
    - **Total Monthly Bike Demand**: Combined ₹ & Liters needed to run the bike for the month.
    - **Payer Filter Bar**: Interactive filter buttons (`All Logs`, `Paid by Me`, `Paid by Friend`) to isolate refuel history records.

---

### 7. 💳 EMI Purchase Tracker (`EmiTab.jsx`)
- **Core Purpose**: Tracking gadgets, appliances, or items bought on EMI (Equated Monthly Installment).
- **Key Business Logic**:
  - **Fields**: Item Name, Total Price, Down Payment, Monthly EMI Amount, Total Tenure (Months), Installments Paid So Far, Due Day of Month, Bank/Card Source, Start Date.
  - **Formulas**:
    - **Net Financed Amount** = `Total Price - Down Payment`
    - **Remaining Principal Balance** = `(Total Tenure - Paid Installments) × Monthly EMI`
    - **Progress Bar (%)** = `(Paid Installments / Total Tenure) × 100`
  - **Actions**:
    - **Pay 1 Month EMI**: Increments `paidInstallments` by 1. Offers 1-click option to auto-log the installment as a monthly expense transaction in the main **Overview** tab.
    - Status automatically updates to `COMPLETED` when `paidInstallments >= totalTenure`.

---

### 8. 👤 Financial Portfolio & Profile Summary (`ProfileModal.jsx`)
- **Core Purpose**: Comprehensive Net Worth and asset overview popup.
- **Key Business Logic**:
  - **Net Worth** = `Main Account Balance` + `Side Vault Balance` + `Pending Lending Receivables` - `Total Active EMI Liabilities`
  - Single-view summary of monthly SIP commitments, active EMIs, lending receivables, and category distribution.

---

## 🎨 Design System & UX Standards

1. **Base Typography Scaling**: Set `html { font-size: 14.5px; }` in `index.css` to ensure standard, high-density dashboard font proportions.
2. **Ultra-Thin 1px Scrollbars**: All scrollable data containers enforce `max-h-[460px] overflow-y-auto custom-scrollbar` with an ultra-thin 1px scrollbar width (`width: 1px`, `height: 1px`).
3. **Pop-Up Action Modals**: Forms open inside clean solid dark overlay modals (`bg-[#111827]`), allocating 100% of main screen width to history logs and analytics charts.

---

## 🔒 Security & Firestore Rules (`firestore.rules`)
All collections (`transactions`, `lends`, `sips`, `pocketNotes`, `petrolLogs`, `emis`, `userSettings`) enforce owner-only read/write protection:
```firestore
allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
```
