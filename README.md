# QvacAudit

Paste your Solana program, get a security audit back. No API keys. Runs entirely on your machine.

Built on [QVAC](https://qvac.tether.io) by Tether.

---

## Why I built this

Every AI audit tool I tried ships your code to a cloud endpoint. For public repos that's fine, but pre-launch you probably don't want your instruction logic sitting in a stranger's request logs indefinitely.

QVAC runs inference locally, so I wrapped it in a small web UI and pointed it at Solana-specific vulnerability patterns. That's the whole project.

---

## What it checks

- Missing signer / owner validation
- Integer overflow and underflow on unchecked `u64` arithmetic
- PDA bump not stored or verified at invocation
- Arbitrary CPI (calling a user-supplied program without verifying the program ID)
- Account confusion / type cosplay attacks
- State changes after CPI calls
- Incorrect account closing — lamports not drained, data not zeroed
- Token mint/freeze authority bypass

---

## Setup

Node.js >= 22 and ~2GB free RAM.

```bash
git clone https://github.com/belalangeth/qvacaudit
cd qvacaudit
npm install
npm start
```

Open `http://localhost:3000`, click **Load AI Model** (first run pulls ~400MB, cached after that), paste your Rust code, click **Run Audit**.

---

## How it works

The QVAC SDK loads a quantized LLM into local memory and runs inference directly over your code:

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

Output streams token-by-token over SSE. Nothing touches the network after the initial model download.

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

- `@qvac/sdk` — local LLM inference
- Express — HTTP server
- Vanilla JS, no build step

---

Built for Colosseum Frontier Hackathon — Tether QVAC Track 2025.
