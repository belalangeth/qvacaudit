# QvacAudit

Paste your Solana program, get a security audit back. Runs entirely on your machine — no API keys, no sending code to external servers.

Built on [QVAC](https://qvac.tether.io) by Tether.

---

## Why I built this

Every AI security tool I found sends your code to some cloud endpoint. That's fine for public repos, but if you're working on something pre-launch, you probably don't want your program logic sitting in someone else's logs.

QVAC lets you run an LLM locally. So I wrapped it in a web UI and pointed it at Solana smart contract security.

---

## What it checks

- Missing signer / owner validation
- Integer overflow and underflow (unchecked arithmetic on `u64`)
- PDA bump not stored or verified
- Arbitrary CPI — calling a user-supplied program without verifying the program ID
- Account confusion / type cosplay attacks
- Reentrancy-like patterns after CPI calls
- Incorrect account closing (lamports not drained, data not zeroed)
- Token mint/freeze authority bypass

---

## Setup

Requires Node.js >= 22 and about 2GB free RAM.

```bash
git clone https://github.com/belalangeth/qvacaudit
cd qvacaudit
npm install
npm start
```

Open `http://localhost:3000`, click **Load AI Model** (downloads ~400MB on first run, cached after), paste your Rust code, hit **Run Audit**.

---

## How it works

QVAC SDK loads an LLM into local memory and runs inference over your code:

```js
import { loadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: "llm",
  modelConfig: { ctx_size: 2048, device: "cpu" },
});

const result = completion({ modelId, history, stream: true });

for await (const token of result.tokenStream) {
  // streamed to browser via SSE
}
```

The audit response streams token-by-token to the browser. Your code never touches the network.

---

## Project layout

```
src/
  server.js    Express + SSE endpoints
  auditor.js   QVAC model loading and inference
public/
  index.html   Frontend (editor, streaming output, sample contracts)
```

---

## Stack

- QVAC SDK (`@qvac/sdk`) — local LLM inference
- Express — HTTP server
- Vanilla JS frontend, no build step

---

## Built for

Colosseum Frontier Hackathon — Tether QVAC Track 2025
