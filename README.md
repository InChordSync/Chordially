# 🎸 Chordially

**Chordially** is a decentralized "Digital Busking" platform that connects street performers and indie artists with a global audience in real-time. By leveraging the speed of the **Stellar network**, we enable fans to "drop a chord" (instant micro-tips) that hit an artist's wallet in seconds, bypass heavy platform fees, and create a warm, direct connection between creator and supporter.

This repository is a monorepo managed with `pnpm` workspaces and orchestrated by **TurboRepo**.

### 🚀 Tech Stack

* **Architecture:** pnpm workspaces + TurboRepo
* **Frontend (apps/mobile):** React Native + Expo + TailwindCSS (NativeWind)
* **Backend (apps/api):** Node.js, Express, TypeScript
* **Smart Contracts (apps/contracts):** Soroban (Rust) & Stellar SDK
* **Real-time:** WebSockets (Socket.io) for live tip alerts

### ✨ Features

* **For Artists:** Go live from your phone, share your performance link, and receive global tips in USDC or XLM. No more waiting for "payout cycles"—your earnings are yours instantly.
* **For Fans:** "Drop a Chord" (Micro-tips) with a single tap. High-speed Stellar transactions mean your support is acknowledged by the artist in real-time during their set.
* **The "Cordial" Bond:** A unique reputation system where top supporters earn "Backstage Passes" (NFTs) that grant access to exclusive streams or unreleased tracks.
* **Low-Fee Ecosystem:** Powered by Stellar, ensuring that even a $0.50 tip isn't eaten up by $0.30 in processing fees.

### ⚡️ Quick Start

#### 1. Prerequisites

* Node.js (v18+)
* Rust (latest stable) & Soroban CLI
* pnpm (v8+)

```bash
# Enable pnpm via corepack
corepack enable

```

#### 2. Installation

Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/YOUR_ORG/chordially.git
cd chordially
pnpm install

```

#### 3. Development

Launch the entire ecosystem (Mobile, API, and local Soroban environment):

```bash
pnpm dev

```

**Local Services:**

* 📱 **Mobile App:** Expo Go (Local LAN/Simulator)
* ⚙️ **Backend API:** `http://localhost:3001`
* 📜 **RPC/Soroban:** `http://localhost:8000`

### 📂 Project Structure

```text
chordially/
├── apps/
│   ├── mobile/            # React Native/Expo UI (Artist & Fan view)
│   ├── api/               # Core Backend (User profiles, Live Session logic)
│   └── contracts/         # Soroban Rust Contracts (Tip distribution & NFTs)
│
├── packages/
│   ├── types/             # Shared TS interfaces (Transaction/Artist types)
│   ├── config/            # Shared linting/TS configs
│   └── ui/                # Shared design system components 
│
└── turbo.json             # Build pipeline orchestration

```

### 📜 Monorepo Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Starts all apps in development mode. |
| `pnpm build` | Compiles for production. |
| `pnpm lint` | Runs ESLint across the entire monorepo. |
| `pnpm test` | Runs test suites (Contracts & API). |

### 🤝 Contributing

We’re building the future of the creator economy. Whether you're a blockchain dev or a UI/UX enthusiast, we'd love your help.

1. **Check Issues:** Look for the `good-first-issue` label.
2. **Standards:** Always run `pnpm lint` before pushing.
3. **Community:** Keep it cordial. We’re here to support creators.

### 📄 License

This project is licensed under the MIT License.

Built with 🎵 and 🚀 by the Chordially Community.
