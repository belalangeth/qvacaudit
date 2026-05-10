import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initModel, auditContract, getModelStatus, cleanup } from "./auditor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "../public")));

// ─── Helper: write an SSE event ───────────────
function sseWrite(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

// ─── Routes ──────────────────────────────────

/** GET /api/status — current model state */
app.get("/api/status", (_req, res) => {
  res.json(getModelStatus());
});

/**
 * POST /api/load-model
 * Streams model download/load progress as SSE events.
 * Events: { type: "progress", percentage } | { type: "ready" } | { type: "error", message }
 */
app.post("/api/load-model", async (_req, res) => {
  sseHeaders(res);

  try {
    const status = getModelStatus();
    if (status.loaded) {
      sseWrite(res, { type: "ready" });
      return res.end();
    }

    await initModel((progress) => {
      sseWrite(res, {
        type: "progress",
        percentage: progress.percentage ?? 0,
        label: progress.label ?? "Downloading model…",
      });
    });

    sseWrite(res, { type: "ready" });
  } catch (err) {
    sseWrite(res, { type: "error", message: err.message });
  }

  res.end();
});

/**
 * POST /api/audit
 * Body: { code: string }
 * Streams audit tokens as SSE events.
 * Events: { type: "start" } | { type: "token", token } | { type: "done" } | { type: "error", message }
 */
app.post("/api/audit", async (req, res) => {
  sseHeaders(res);

  const { code } = req.body ?? {};

  // ── Input validation ──
  if (!code || typeof code !== "string" || code.trim().length === 0) {
    sseWrite(res, { type: "error", message: "No code provided." });
    return res.end();
  }

  if (code.length > 100_000) {
    sseWrite(res, { type: "error", message: "Code too large (max 100 KB)." });
    return res.end();
  }

  const status = getModelStatus();
  if (!status.loaded) {
    sseWrite(res, {
      type: "error",
      message: "Model not loaded yet. Click 'Load AI Model' first.",
    });
    return res.end();
  }

  try {
    sseWrite(res, { type: "start" });

    const result = await auditContract(code);

    for await (const token of result.tokenStream) {
      sseWrite(res, { type: "token", token });
    }

    sseWrite(res, { type: "done" });
  } catch (err) {
    sseWrite(res, { type: "error", message: err.message });
  }

  res.end();
});

// ─── Graceful shutdown ────────────────────────
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down…");
  await cleanup();
  process.exit(0);
});

// ─── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔍 SolAudit is running`);
  console.log(`   Local  → http://localhost:${PORT}`);
  console.log(`   AI     → QVAC (local inference, no cloud)`);
  console.log(`   Press Ctrl+C to stop\n`);
});
