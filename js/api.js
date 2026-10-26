/* api.js — talks to the LOCAL proxy (serve.py). The key never reaches the browser.
 * On a static host (GitHub Pages) with no proxy, the app auto-falls back to Demo Mode.
 */
const API = (() => {
  let _live = null; // null = unknown, true/false after probe

  async function probe() {
    if (_live !== null) return _live;
    try {
      const r = await fetch("api/config", { cache: "no-store" });
      if (!r.ok) throw new Error("no proxy");
      const j = await r.json();
      _live = !!j.live;
    } catch {
      _live = false; // static host (GitHub Pages) → demo mode
    }
    return _live;
  }

  /**
   * chat(messages, opts) → { text, model, demo:false }
   * throws { code, detail } on failure.
   */
  async function chat(messages, opts = {}) {
    const live = await probe();
    if (!live) throw { code: "no_proxy", detail: "Proxy ไม่พร้อมใช้งาน (ไม่มี key)" };
    const r = await fetch("api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 8192,
        model: opts.model,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      // one auto-retry: reasoning models occasionally burn the whole budget thinking
      if (j.error === "empty_content" && !opts._retried) {
        return chat(messages, { ...opts, _retried: true });
      }
      throw { code: j.error || "http_" + r.status, detail: j.detail || "" };
    }
    return { text: j.text, model: j.model, demo: false };
  }

  return { probe, chat };
})();

/** Extract JSON from a model response that may contain prose/markdown fences. */
function extractJSON(text) {
  if (!text) throw new Error("empty response");
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // first { … last }
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) throw new Error("no JSON object in response");
  return JSON.parse(t.slice(s, e + 1));
}
