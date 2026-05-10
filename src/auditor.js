import {
  loadModel,
  completion,
  unloadModel,
  LLAMA_3_2_1B_INST_Q4_0,
} from "@qvac/sdk";

// ─────────────────────────────────────────────
// System prompt — specialised for Solana security
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SolAudit, a world-class Solana smart contract security auditor.
You specialise in Rust-based Solana programs and Anchor frameworks.
Your job: find real security vulnerabilities, not style issues.

OUTPUT FORMAT — use this exact structure for every finding:

═══════════════════════════════
[SEVERITY] VULNERABILITY TYPE
═══════════════════════════════
📍 Location : <function or account struct name>
📝 Description : <clear explanation of the vulnerability>
💥 Impact : <what an attacker can do if exploited>
🔧 Fix : <concrete code-level recommendation>

SEVERITY levels: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW | 🔵 INFO

Vulnerabilities to check (non-exhaustive):
• Missing signer check — is_signer not validated on authority accounts
• Missing owner check — account owner not verified against expected program
• Integer overflow/underflow — arithmetic without checked_add/checked_sub/checked_mul/saturating_*
• Account confusion / type cosplay — wrong AccountInfo passed without discriminator check
• PDA bump not validated — canonical bump not stored or checked
• Arbitrary CPI — calling user-supplied program without verifying program_id
• Reentrancy-like — state written after CPI call allowing re-entry manipulation
• Incorrect account closing — data not zeroed, lamports not fully drained
• Missing rent exemption — account may be garbage-collected
• Token account authority not checked — mint/freeze authority bypass
• Overflow in lamport arithmetic — u64 addition without overflow check
• Missing account is_writable check — read-only account written to

END OF REPORT format:
─────────────────────────────────────────────
RISK SCORE  : X / 10
FINDINGS    : N critical, N high, N medium, N low
SUMMARY     : 2–3 sentences overall assessment.
TOP ACTIONS : 1. ... 2. ... 3. ...
─────────────────────────────────────────────

If the code has NO vulnerabilities, say so clearly and explain why it looks safe.
Be precise, technical, and actionable. Do not pad the report with generic advice.`;

// ─────────────────────────────────────────────
// Model state
// ─────────────────────────────────────────────
let modelId = null;
let isLoading = false;
let loadError = null;

/**
 * Load the QVAC LLM into memory (idempotent — safe to call multiple times).
 * @param {(progress: object) => void} [onProgress]
 */
export async function initModel(onProgress) {
  if (modelId) return modelId;
  if (isLoading) throw new Error("Model is already loading — please wait.");

  isLoading = true;
  loadError = null;

  try {
    console.log("⏳ Loading QVAC model into memory…");
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      modelConfig: {
        ctx_size: 4096,
      },
      onProgress: (progress) => {
        if (onProgress) onProgress(progress);
        if (progress.percentage !== undefined) {
          process.stdout.write(`\r   ${progress.percentage.toFixed(1)}% downloaded`);
        }
      },
    });
    console.log("\n✅ Model ready.");
    isLoading = false;
    return modelId;
  } catch (err) {
    isLoading = false;
    loadError = err;
    throw err;
  }
}

/**
 * Run a security audit on the given Solana program source code.
 * Returns the raw QVAC completion result (use .tokenStream for SSE streaming).
 * @param {string} code  Raw Rust source code
 */
export async function auditContract(code) {
  if (!modelId) throw new Error("Model not loaded. Call /api/load-model first.");

  const history = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Audit this Solana program for security vulnerabilities:\n\n\`\`\`rust\n${code}\n\`\`\``,
    },
  ];

  return completion({ modelId, history, stream: true });
}

/** Gracefully unload model and release memory. */
export async function cleanup() {
  if (modelId) {
    await unloadModel({ modelId, clearStorage: false });
    modelId = null;
    console.log("🧹 Model unloaded.");
  }
}

/** Return current model lifecycle state. */
export function getModelStatus() {
  return {
    loaded: modelId !== null,
    loading: isLoading,
    error: loadError?.message ?? null,
  };
}
