⚙️ ManuFlow ERP

A full-stack Manufacturing Resource Planning (MRP II / ERP) system built for small and medium manufacturing enterprises to manage supply chain pipelines, production floors, and stock ledgers with concurrency safeguards.

---

## 🚀 Core Manufacturing Workflow
Customer ──> Sales Order ──> BOM Explosion ──> Work Order (Reservation) ──> Floor Production ──> Finished Goods Inbound ──> Dispatch & Invoice
▲                                                                                                                                │
└──────────────────────────────────────── Payment Collection ◄───────────────────────────────────────────────────────────────────┘


## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Python 3.12, Django 5, Django REST Framework
- **Database:** SQLite (local dev) / PostgreSQL (production containerized)
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Background Pipeline:** Celery + Redis
- **Testing:** Pytest & Pytest-Django

---

## 📦 Implemented Modules

1. 🔐 **Authentication & RBAC:** Scoped JWT permissions for Floor Operators, Production Managers, and Administrators.
2. 👥 **Customers & Suppliers:** Partner registry for commercial client billing and supplier procurements.
3. 📦 **Products & Inventory:** Live balance accounting (`on_hand`, `allocated`, and `available_stock`).
4. 🧱 **Bill of Materials (BOM):** Multi-level formula definitions with yield factors and scrap scrap rate percentages.
5. 🛒 **Sales & Orders:** Automated generation of planned Work Orders from confirmed commercial orders.
6. 🏭 **Production Floor:** Atomic row-locked (`select_for_update`) stock reservations preventing double-allocation races.
7. 🚚 **Procurement & GRN:** Purchase Order issuance and Goods Receipt Notes directly updating inventory stock.
8. 💰 **Invoicing & Payments:** Delivery dispatch invoicing and accounts receivable settlement.
9. 📊 **Executive Dashboard:** High-level metrics tracking billed revenue, completed jobs, and item counts.
10. 📝 **Stock Ledger / Audit Trail:** Immutable double-entry movement ledger recording every physical unit movement.

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
