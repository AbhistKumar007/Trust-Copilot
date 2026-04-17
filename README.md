# TrustCopilot

![TrustCopilot Banner](/public/banner.png) <!-- Update with an actual banner if available -->

AI-powered crypto trust and decision engine. TrustCopilot acts as an intelligent safety layer for your crypto wallet, analyzing behavior patterns, scoring risks, and providing actionable insights before you transact.

## ✨ Features

* **Wallet DNA Analysis**: Deep behavioral fingerprinting of any wallet. Classifies users dynamically (e.g., Trader, Long-term holder, Bot) and detects suspicious patterns like quick token dumps.
* **AI Decision Engine ("What Should I Do?")**: Beyond numbers, our AI explains exactly the risk involved and recommends plain-English verdicts: Safe, Risky, or Avoid.
* **Auto-Protect Mode**: A transaction sandbox and real-time interceptor that evaluates destination addresses and blocks high-risk outgoing transactions before execution.
* **Secure Transaction System**: Simulate real environments with our secure sandbox without risking real funds, learning standard security practices.
* **On-Chain Reputation**: Verified safety profiles are immutably tied to the blockchain using a custom Solidity smart contract.

## 🛠️ Tech Stack

* **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion
* **Backend**: Node.js, Express, Ethers.js, Covalent API
* **Smart Contracts**: Solidity, Hardhat, Polygon/EVM Compatible
* **AI Engine**: OpenAI API / Claude
* **Security**: Helmet, Express-Rate-Limit

## 🚀 Setup Instructions

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### 1. Clone & Install Dependencies
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/trustcopilot.git
cd trustcopilot

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install blockchain dependencies
cd contracts
npm install
cd ..
\`\`\`

### 2. Environment Variables
* Copy the \`.env.example\` file to \`.env\` in the required directories (\`backend\`, \`contracts\`, \`frontend\`).
* Replace the placeholder keys with your actual API keys. **Never commit your actual \`.env\` file.**

\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Run Development Servers

**Run Backend (Port 5000):**
\`\`\`bash
cd backend
npm run dev
\`\`\`

**Run Frontend (Port 3000):**
\`\`\`bash
cd frontend
npm run dev
\`\`\`

## 🎮 Usage

1. **Connect Wallet:** Launch the app to search or connect a wallet.
2. **Analyze Wallet:** Paste any EVM wallet address to perform an instantaneous wallet DNA risk analysis.
3. **Get AI Decision:** Review the natural language explanation and risk decision prior to engaging with an unknown wallet. 
4. **Send Secure Transactions:** Launch Auto-Protect mode from the Dashboard and simulate transactions.

## 🔐 Security
TrustCopilot ensures user safety by employing read-only non-custodial methodologies:
- We never ask for seed phrases or private keys in the UI.
- API keys, secrets, and environments are ignored strictly via \`.gitignore\`.
- All blockchain validations happen entirely on-chain without exposing vulnerabilities.

## 🤝 Contributing
1. Fork the project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

---
Built for the Solana Hackathon
