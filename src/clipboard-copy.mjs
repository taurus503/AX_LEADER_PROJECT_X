export async function copyTextWithFallback(text, environment = {}) {
  const value = String(text || "");
  const clipboard = environment.clipboard;
  const fallbackWriteText = environment.fallbackWriteText;

  if (environment.preferFallback && typeof fallbackWriteText === "function") {
    try {
      if (fallbackWriteText(value)) {
        return { ok: true, method: "fallback" };
      }
    } catch (_error) {
      // Continue to async clipboard as a secondary route.
    }
  }

  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(value);
      return { ok: true, method: "clipboard" };
    } catch (_error) {
      // Some in-app browsers block navigator.clipboard. Try the DOM fallback below.
    }
  }

  if (typeof fallbackWriteText === "function") {
    try {
      if (fallbackWriteText(value)) {
        return { ok: true, method: "fallback" };
      }
    } catch (_error) {
      // Return a single stable failure shape for the UI.
    }
  }

  return {
    ok: false,
    method: "none",
    error: "copy failed"
  };
}

export function fallbackWriteTextViaTextarea(text, doc = globalThis.document) {
  if (!doc?.body || typeof doc.execCommand !== "function") return false;

  const textarea = doc.createElement("textarea");
  textarea.value = String(text || "");
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  doc.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = doc.execCommand("copy");
  } finally {
    textarea.remove();
  }

  return copied;
}
