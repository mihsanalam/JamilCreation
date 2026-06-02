# Jamil Creation - Inventory Management App 📦

An offline-first, beautifully designed mobile inventory and business management application built specifically for **Jamil Creation**.

## ✨ Features

- **Modern & Premium UI:** Crafted using NativeWind (Tailwind CSS) with carefully selected typography (Poppins & Inter) and a sleek glass-morphism aesthetic.
- **Dynamic Dashboards:** Real-time business insights powered by `@shopify/react-native-skia` and `victory-native` for 60fps native charting (Line & Pie charts).
- **Comprehensive Inventory:** Track stock, prices, categories, and warehouse locations. Includes smart badges for "Low Stock" alerts.
- **Product Details & Editing:** Interactive product details modal with multi-image swiping, full business data, and quick actions (Add, Remove, Edit, Delete).
- **Interactive Forms:** Upload product and business logos seamlessly using native device galleries (`expo-image-picker`).
- **Unified Navigation:** Custom Expo Router tab-based navigation spanning Dashboard, Inventory, Transactions, Reports, and Settings.
- **Ready for Scale:** Architected for offline-first data synchronization (WatermelonDB) and cloud syncing (Supabase).

## 🛠️ Tech Stack

- **Framework:** [Expo SDK 56](https://expo.dev/) (React Native)
- **Routing:** [Expo Router v3](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling:** [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS)
- **Icons:** [lucide-react-native](https://lucide.dev/icons/) & `@expo/vector-icons`
- **Charting:** `victory-native` built on `@shopify/react-native-skia`
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Configured)
- **Database (Upcoming):** WatermelonDB (Local) + Supabase (Cloud)

## 📁 Project Structure

The codebase strictly adheres to enterprise-level architecture patterns:

```
JamilCreation/src/
├── app/                  # Expo Router screens
│   ├── (auth)/           # Authentication flow (Login, Register)
│   ├── (tabs)/           # Main App Flow (Dashboard, Inventory, Transactions, Reports, Settings)
│   └── product/          # Modal screens (Add Product)
├── components/           # Reusable UI building blocks
│   ├── ui/               # Generic components (Buttons, Inputs, Cards)
│   └── inventory/        # Feature-specific components (e.g. ProductDetailsModal)
├── constants/            # Theme colors, fonts, categories
├── types/                # Centralized TypeScript definitions
├── store/                # Zustand global state (Auth, Inventory, UI)
├── hooks/                # Custom React Hooks
└── assets/               # Local images and custom fonts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo Go app on your physical device OR an iOS Simulator / Android Emulator.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mihsanalam/JamilCreation.git
   ```

2. Navigate into the project directory:
   ```bash
   cd JamilCreation
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npx expo start -c
   ```

5. Open the app:
   - Scan the QR code with the **Expo Go** app on your phone.
   - Press `i` to open in iOS Simulator.
   - Press `a` to open in Android Emulator.

## ⚠️ Development Notes

- **Skia Warnings:** If you see deprecation warnings in the terminal related to `SkPath` (`react-native-skia`), they are strictly related to the `victory-native` library's internal dependencies and can be safely ignored. They will not affect production builds.
- **Performance:** Complex charts (like those on the Reports screen) may load slowly during development (`npx expo start`) due to the JS bridge overhead. They will render instantly at 60fps in native production builds.

## 📄 License

This project is proprietary and built specifically for Jamil Creation.
