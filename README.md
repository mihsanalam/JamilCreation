# Jamil Creation — Inventory Management App

> A professional, offline-first inventory & sales management mobile app built with **Expo (React Native)**, **WatermelonDB**, and **Supabase**.

---

## 📱 Screenshots

> _Run the app to see live screenshots_

---

## ✨ Features

### 📦 Inventory Management
- Add, edit, and view products with images, SKU, barcode, category, pricing, and supplier info
- Low-stock alerts based on configurable thresholds
- Product detail modal with full info view

### 💰 Sales & Transactions
- **Record Sale screen** — pick a product, enter quantity, see revenue/profit summary live before confirming
- Stock automatically decremented when a sale is recorded
- Full transaction log with filters (Stock Added / Stock Removed / Sales / Returns)

### 📊 Reports & Analytics
- **Dynamic Reports screen** powered by live WatermelonDB data
- Total Revenue, Profit, and Cost stats (real-time)
- 30-day sales overview line chart
- Top-selling products pie chart
- Transaction breakdown by type

### 🏠 Dashboard
- Overview card with live stats: Total Products, Low Stock count, Total Sales, Transactions Today
- Recent activity feed
- Quick actions: Add Product, Sell, Scan Barcode

### 🔐 Authentication & Security
- Email/password login and registration via Supabase Auth
- JWT token auto-refresh via `AsyncStorage` persistence
- Two-Factor Authentication (TOTP) setup via Authenticator apps (Google Authenticator / Authy)
- MFA enrollment with QR code generation in-app
- **Sign Out** with confirmation dialog

### ☁️ Offline-First Sync
- **WatermelonDB** as the local SQLite database — all reads/writes are instant, no network needed
- Two-way sync with **Supabase** (pull remote changes, push local changes)
- Sync runs on app start + every time the app comes to the foreground
- Sync is delayed 1.5 s after launch so it never blocks the UI

### ⚙️ Settings
- Profile picture upload to Supabase Storage (`avatars` bucket)
- User display name, business name, email shown
- 2FA enrollment section

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (React Native) |
| Navigation | [Expo Router](https://expo.github.io/router/) (file-based) |
| Local DB | [WatermelonDB](https://nozbe.github.io/WatermelonDB/) (SQLite) |
| Cloud DB & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| Sync | WatermelonDB `synchronize` + custom pull/push adapters |
| Styling | [NativeWind](https://www.nativewind.dev/) (Tailwind for RN) |
| Charts | [victory-native](https://commerce.nearform.com/open-source/victory-native/) |
| State | `withObservables` reactive HOC (WatermelonDB) |
| Icons | `@expo/vector-icons` (Ionicons) + `lucide-react-native` |

---

## 🗄 Database Schema

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | WatermelonDB UUID |
| `name` | `text` | Required |
| `sku` | `text` | Required |
| `barcode` | `text` | Optional |
| `category` | `text` | Required |
| `quantity` | `integer` | Current stock |
| `buying_price` | `numeric(10,2)` | Cost price |
| `selling_price` | `numeric(10,2)` | Sale price |
| `supplier` | `text` | Optional |
| `warehouse` | `text` | Optional |
| `location` | `text` | Optional |
| `image_url` | `text` | Optional |
| `low_stock_threshold` | `integer` | Default: 5 |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed |

### `transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | WatermelonDB UUID |
| `product_id` | `text` FK | References `products(id)` |
| `product_name` | `text` | Snapshot at time of tx |
| `type` | `text` | `added` \| `removed` \| `sold` \| `returned` |
| `quantity` | `integer` | Units involved |
| `note` | `text` | Optional |
| `by_user` | `text` | User email or name |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Expo CLI + EAS CLI
- Android device or emulator with **Expo Dev Client** installed

### Setup

```bash
# Clone the repo
git clone https://github.com/mihsanalam/JamilCreation.git
cd JamilCreation

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your Supabase URL and anon key to .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

Run the following SQL in your **Supabase SQL Editor** to set up the database:

```sql
-- Create tables
CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  sku text NOT NULL,
  barcode text,
  category text NOT NULL,
  quantity integer DEFAULT 0,
  buying_price numeric(10,2) DEFAULT 0.00,
  selling_price numeric(10,2) DEFAULT 0.00,
  supplier text, warehouse text, location text,
  image_url text,
  low_stock_threshold integer DEFAULT 5,
  server_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE transactions (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  type text NOT NULL,
  quantity integer DEFAULT 0,
  note text,
  by_user text NOT NULL,
  server_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE push_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Auto-update timestamps
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users only)
CREATE POLICY "Auth read products"    ON products    FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert products"  ON products    FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update products"  ON products    FOR UPDATE  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete products"  ON products    FOR DELETE  TO authenticated USING (true);

CREATE POLICY "Auth read tx"    ON transactions FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert tx"  ON transactions FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tx"  ON transactions FOR UPDATE  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete tx"  ON transactions FOR DELETE  TO authenticated USING (true);

CREATE POLICY "Users manage own token" ON push_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

```

Also create an **`avatars`** Storage bucket in Supabase Dashboard (Storage → New Bucket → name: `avatars`, Public: ✅).

### Run the App

```bash
npx expo start --dev-client
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── _layout.tsx          # Root layout, auth guard, splash, sync trigger
│   ├── (auth)/
│   │   ├── login.tsx        # Email/password login
│   │   └── register.tsx     # Registration screen
│   ├── (tabs)/
│   │   ├── index.tsx        # Dashboard (Home)
│   │   ├── inventory.tsx    # Product list
│   │   ├── transactions.tsx # Transaction log with filters
│   │   ├── reports.tsx      # Analytics & charts
│   │   └── settings.tsx     # Profile, security, logout
│   └── product/
│       ├── add.tsx          # Add / Edit product
│       └── sell.tsx         # Record Sale screen
├── components/
│   ├── BottomNav.tsx        # Tab bar navigation
│   ├── ui/
│   │   ├── Skeleton.tsx     # Skeleton loading animations
│   │   └── collapsible.tsx
│   └── inventory/
│       └── ProductDetailsModal.tsx
├── db/
│   ├── index.ts             # WatermelonDB instance
│   ├── schema.ts            # Table schema definitions
│   ├── sync.ts              # Two-way Supabase sync engine
│   └── models/
│       ├── Product.ts
│       └── Transaction.ts
├── hooks/
│   └── useAuth.ts           # Supabase auth state hook
├── services/
│   ├── supabase.ts          # Supabase client (with JWT persistence)
│   └── notifications.ts     # Push & local notification services
└── types/
    └── index.ts
```

---

## 🔄 Offline Sync Architecture

```
Device (WatermelonDB SQLite)
        ↕  sync()
Supabase (PostgreSQL)
```

- **Pull**: Fetches all records updated since `lastPulledAt` from Supabase
- **Push**: Sends created/updated/deleted local records to Supabase
- **Conflict resolution**: Last-write-wins via `updated_at` timestamps
- **Trigger**: On app start + every foreground resume

---

## 🔐 Security

- **RLS enabled** — only authenticated JWT holders can access data
- **Token auto-refresh** — Supabase client refreshes tokens automatically
- **Session persistence** — stored securely in `AsyncStorage`
- **2FA support** — TOTP via standard authenticator apps

---

## 🗺 Roadmap

- [x] Barcode scanner integration (Scan & Sell)
- [x] Push notifications for low-stock alerts
- [x] Multi-user role permissions (Owner / Staff)
- [x] CSV export for reports (Inventory & Transactions)
- [x] Image compression before upload
- [x] Loading skeletons on all screens
- [x] Unit test suites with Jest (calculateProfit, lowStockCheck, Zustand store)

---

## 🧪 Testing & CI/CD

The codebase includes a comprehensive test suite built with **Jest** and **ts-jest** to verify inventory calculations and state management.

### Running the Tests

To run the unit tests, execute the following command in the project root:

```bash
npm test
```

### Test Coverage

The test suite covers:
- **Inventory Utilities (`src/utils/inventory.ts`)**: 23 assertions verifying profit, revenue, cost calculations, low stock checks, over stock conditions, and date-based transaction filters.
- **Zustand Cart & Search Store (`src/store/inventoryStore.ts`)**: 11 assertions verifying cart operations (adding, updating quantities, duplicate item accumulation, clearing), cart profit/revenue totals, and state-based inventory category/search filters.

### 🤖 CI/CD Pipeline

We have configured a **GitHub Actions CI Pipeline** (under `.github/workflows/node.js.yml`) to automate code quality checks:
- **Triggers**: Executed automatically on every `push` or `pull_request` to `main` or `master` branches.
- **Node Versions**: Evaluates and runs builds across Node `18.x` and `20.x` containers.
- **Verification**: Automatically runs the Jest unit test suite. Passing tests are required before code merges.

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
