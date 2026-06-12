const path = require("path");
const { pathToFileURL } = require("url");

let workerModulePromise;

async function loadWorkerModule() {
  if (!workerModulePromise) {
    const workerPath = path.join(
      __dirname,
      "..",
      "Option_Playbook_Advisor_backup_2026-06-12_v5.6",
      "deploy",
      "worker.mjs"
    );
    workerModulePromise = import(pathToFileURL(workerPath).href);
  }
  return workerModulePromise;
}

function toHeaders(inputHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(inputHeaders || {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, String(item));
    } else {
      headers.set(key, String(value));
    }
  }
  return headers;
}

module.exports = async function advisorApi(req, res) {
  try {
    const worker = (await loadWorkerModule()).default;
    const origin = `https://${req.headers.host || "localhost"}`;
    const requestUrl = new URL(req.url || "/api/advisor", origin).toString();
    const request = new Request(requestUrl, {
      method: req.method || "GET",
      headers: toHeaders(req.headers)
    });

    const response = await worker.fetch(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  } catch (error) {
    res.status(500).json({
      error: error?.message || "advisor api failed"
    });
  }
};
