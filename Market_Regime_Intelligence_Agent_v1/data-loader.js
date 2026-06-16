function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function getPreviousTradingDate(dateInput) {
  const date = new Date(`${dateInput}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  while (true) {
    date.setDate(date.getDate() - 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      return date.toISOString().slice(0, 10);
    }
  }
}

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

export async function loadSampleRegimeData(targetDate) {
  let data = null;

  if (window.location.protocol !== "file:") {
    try {
      const response = await fetch("./sample-regime-data.json", { cache: "no-store" });
      if (response.ok) {
        data = await response.json();
      }
    } catch (_error) {
      // Fall back to inline sample data below.
    }
  }

  if (!data) {
    const inline = readInlineSampleData();
    if (inline) {
      data = inline;
    }
  }

  if (!data) {
    throw new Error("Sample regime data is unavailable.");
  }

  if (isValidDateInput(targetDate)) {
    const next = clone(data);
    next.asOf = `${targetDate} 09:10 KST`;
    next.currentRegime = next.currentRegime || {};
    next.currentRegime.lastUpdate = `${targetDate} 09:10 KST`;
    next.marketSnapshot = next.marketSnapshot || {};
    next.marketSnapshot.previousTradingDayDate = getPreviousTradingDate(targetDate);
    return next;
  }

  return data;
}
