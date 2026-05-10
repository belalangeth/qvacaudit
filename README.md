# 🔍 QvacAudit — Local Solana Smart Contract Security Auditor

> **Your code never leaves your machine.**  
> Powered by [QVAC](https://qvac.tether.io) — Tether's local-first AI SDK.

---

## What is QvacAudit?

QvacAudit is a **production-ready web application** that audits Solana smart contracts for security vulnerabilities using a locally-running LLM. No API keys. No cloud. No data leaks. Your Rust source code is analyzed entirely on your device.

This is critical for developers working on **sensitive or pre-launch programs** who cannot afford to send their code to external AI services.

---

## Vulnerabilities Detected

| Category | Examples |
|---|---|
| Missing checks | Signer not validated, owner not checked |
| Arithmetic | Integer overflow, underflow, lamport overflow |
| Account confusion | Type cosplay, wrong discriminator |
| PDA | Bump not stored or validated |
| CPI | Arbitrary cross-program invocation |
| State management | Reentrancy-like patterns, incorrect account close |
| Token security | Mint/freeze authority bypass |

---

## QVAC Integration

QvacAudit uses QVAC SDK's **LLM inference** capability (`@qvac/sdk`) to run a fine-tuned security analysis model locally:

```js
import { loadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: "llm",
  modelConfig: { ctx_size: 4096 },
});

const result = completion({ modelId, history, stream: true });

for await (const token of result.tokenStream) {
  // stream tokens to browser via SSE
}
```

The integration is **core to the product** — without QVAC, there is no audit. The LLM never receives data from any external network connection.

---

## Getting Started

### Requirements

- Node.js >= 22.17
- npm >= 10.9
- ~2 GB RAM (for model loading)

### Install & Run

```bash
git clone https://github.com/<your-username>/qvacaudit
cd qvacaudit
npm install
npm start
```

Open **http://localhost:3000**

### First Use

1. Click **"⚡ Load AI Model"** — downloads the QVAC LLM on first run (~400 MB, cached after)
2. Paste your Solana program Rust code into the editor
3. Click **"🛡 Run Audit"**
4. Read the streaming security report in real time

---

## Project Structure

```
qvacaudit/
├── src/
│   ├── server.js       Express server + SSE endpoints
│   └── auditor.js      QVAC model lifecycle + audit logic
├── public/
│   └── index.html      Single-file frontend (editor + output)
├── package.json
└── README.md
```

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/status` | GET | Model load state |
| `POST /api/load-model` | POST | Stream model download progress (SSE) |
| `POST /api/audit` | POST | Stream audit tokens (SSE) |

### Example: run an audit via curl

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"code": "pub fn withdraw(...) { vault.balance = vault.balance - amount; }"}' \
  --no-buffer
```

---

## Sample Contracts

Four vulnerable contracts are built into the UI for testing:

- **Integer Overflow** — unchecked arithmetic on `u64`
- **Missing Signer Check** — `is_signer` never validated
- **Authority Bypass** — config account owner not verified
- **Arbitrary CPI** — user-supplied program invoked without validation

---

## Why Local AI?

| Cloud AI | QvacAudit (QVAC) |
|---|---|
| Code sent to remote servers | Code stays on device |
| Requires API key + subscription | Free, no account needed |
| Fails offline | Works with no internet |
| Vendor can log your code | Zero data retention |

---

## Built With

- [QVAC SDK](https://qvac.tether.io) by Tether — local LLM inference
- [Express.js](https://expressjs.com) — HTTP server
- Vanilla HTML/CSS/JS — zero-dependency frontend

---

## License

MIT

---

*Built for the Colosseum Frontier Hackathon — Tether QVAC Track, 2025*
