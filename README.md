# 💰 Future Finance Planner v2.0

A high-performance personal finance simulator tailored for the Indian context. Model your long-term wealth with salary growth, inflation, investment returns, and life-event shocks.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🌟 Key Features

- **Onboarding Flow**: Quick setup with tuned defaults based on your age, job role, and location.
- **Dynamic Simulation Engine**: Monthly-granularity projections that account for compounding returns and compounding inflation.
- **Life Events**: Add one-time, duration-based, or job-loss events to see how they impact your "FIRE" timeline.
- **Searchable Profiles**: Choose from common middle-class job roles and Indian cities for instant, realistic defaults.
- **Smart Insights**:
  - **FIRE Runway**: Automatically identifies when your returns can fund your lifestyle.
  - **Impact Analysis**: See exactly how much each life event (like a wedding or house purchase) costs you in the long run.
  - **Solvency Alerts**: Visual warnings and insights when your balance is projected to dip below zero.
- **Interactive Charting**: 60fps interaction performance using `useDeferredValue` to keep the UI snappy even during complex simulations.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Yijuwarp/FinancePlanner.git

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Date Handling**: date-fns

## 📖 Documentation

- [**Architecture Guide**](./ARCHITECTURE.md): Deep dive into the simulation engine and data flow.
- [**Contributing Guide**](./CONTRIBUTING.md): How to add new onboarding profiles, event templates, or features.

## ⚖️ Disclaimer

This application is a mathematical simulation tool provided for educational and planning purposes only. It does NOT constitute financial advice. Always consult with a qualified financial advisor before making significant financial decisions.

---
Current Version: **v2.0.0**
