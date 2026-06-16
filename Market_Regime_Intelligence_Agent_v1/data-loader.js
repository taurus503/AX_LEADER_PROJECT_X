function readInlineSampleData() {
  const node = document.getElementById("sample-regime-data-inline");
  if (!node) {
    return null;
  }

  try {
    return JSON.parse(node.textContent || "{}");
  } catch (_error) {
    return null;
  }
}

export async function loadSampleRegimeData() {
  if (window.location.protocol !== "file:") {
    try {
      const response = await fetch("./sample-regime-data.json", { cache: "no-store" });
      if (response.ok) {
        return await response.json();
      }
    } catch (_error) {
      // Fall back to inline sample data below.
    }
  }

  const inline = readInlineSampleData();
  if (inline) {
    return inline;
  }

  throw new Error("Sample regime data is unavailable.");
}
