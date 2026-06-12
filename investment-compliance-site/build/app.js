const ASSET_LIBRARY = {
  "domestic-stock": { label: "국내주식", allocation: "alloc_domestic_stock" },
  "foreign-stock": { label: "해외주식", allocation: "alloc_foreign_stock", foreign: true },
  "domestic-bond": { label: "국내채권", allocation: "alloc_domestic_bond" },
  "foreign-bond": { label: "해외채권", allocation: "alloc_foreign_bond", foreign: true },
  "real-estate": { label: "부동산/PF", allocation: "alloc_real_estate", feature: "real-estate" },
  loan: { label: "대출", allocation: "alloc_loan", feature: "loan" },
  derivatives: { label: "파생상품", allocation: "alloc_derivatives", feature: "derivatives" },
  crypto: { label: "가상자산", allocation: "alloc_crypto", feature: "crypto" }
};

const example = {
  fundType: "general-private",
  assetTargets: {
    "domestic-stock": 50,
    "foreign-stock": 50
  },
  hedgePolicy: "partial",
  leveragePolicy: "none",
  lifeRatio: "45",
  affiliateRatio: "95"
};

const form = document.querySelector("#reviewForm");
const emptyState = document.querySelector("#emptyState");
const loadingState = document.querySelector("#loadingState");
const errorState = document.querySelector("#errorState");
const result = document.querySelector("#reviewResult");
const loadExample = document.querySelector("#loadExample");
const clearResult = document.querySelector("#clearResult");
const submitButton = document.querySelector("#submitButton");

loadExample.addEventListener("click", () => {
  fillExample();
});

clearResult.addEventListener("click", () => {
  resetResult();
  form.reset();
  document.querySelectorAll(".asset-check").forEach(syncAssetAllocation);
});

document.querySelectorAll(".asset-check").forEach((checkbox) => {
  checkbox.addEventListener("change", () => syncAssetAllocation(checkbox));
  syncAssetAllocation(checkbox);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitReview();
});

const params = new URLSearchParams(window.location.search);
if (params.get("demo") === "1") {
  fillExample();
  form.requestSubmit();
}

const requestedTab = params.get("tab");
if (requestedTab) {
  activateTab(requestedTab);
}

function fillExample() {
  form.reset();
  document.querySelectorAll(".asset-check").forEach(syncAssetAllocation);
  Object.entries(example).forEach(([key, value]) => {
    if (key === "assetTargets") return;
    const input = form.elements[key];
    if (input) input.value = value;
  });
  Object.entries(example.assetTargets).forEach(([target, allocation]) => {
    setAssetTarget(target, allocation);
  });
  setFeature("affiliate-manager", true);
  setFeature("affiliate-investor", true);
}

function setFeature(value, checked) {
  const target = form.querySelector(`input[name="features"][value="${value}"]`);
  if (target) target.checked = checked;
}

function setAssetTarget(value, allocation) {
  const checkbox = form.querySelector(`input[name="assetTargets"][value="${value}"]`);
  if (!checkbox) return;
  checkbox.checked = true;
  syncAssetAllocation(checkbox);
  const allocationInput = form.elements[ASSET_LIBRARY[value].allocation];
  if (allocationInput) allocationInput.value = allocation;
}

function syncAssetAllocation(checkbox) {
  const config = ASSET_LIBRARY[checkbox.value];
  if (!config) return;
  const input = form.elements[config.allocation];
  if (!input) return;
  input.disabled = !checkbox.checked;
  if (!checkbox.checked) input.value = "";
}

function readForm() {
  const values = Object.fromEntries(new FormData(form).entries());
  values.features = Array.from(form.querySelectorAll('input[name="features"]:checked')).map((item) => item.value);
  values.assetTargets = Array.from(form.querySelectorAll('input[name="assetTargets"]:checked')).map((item) => item.value);
  values.allocations = Object.fromEntries(
    values.assetTargets.map((target) => {
      const config = ASSET_LIBRARY[target];
      return [target, toNumber(form.elements[config.allocation]?.value)];
    })
  );
  values.lifeRatio = toNumber(values.lifeRatio);
  values.affiliateRatio = toNumber(values.affiliateRatio);
  values.foreignRatio = values.assetTargets.reduce((sum, target) => {
    const config = ASSET_LIBRARY[target];
    const amount = values.allocations[target] || 0;
    return config.foreign ? sum + amount : sum;
  }, 0);
  return values;
}

function toNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function submitReview() {
  const payload = readForm();
  showLoading();

  try {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "검토 결과를 불러오지 못했습니다.");
    }

    render(data.review, data.meta);
  } catch (error) {
    showError(error.message || "검토 결과를 불러오지 못했습니다.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "검토 초안 생성";
  }
}

function activateTab(tabId) {
  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((item) => {
    item.classList.toggle("active", item.id === tabId);
  });
}

function render(review, meta) {
  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  result.classList.remove("hidden");

  const strip = document.querySelector("#decisionStrip");
  strip.className = `decision-strip ${review.decision.level}`;
  document.querySelector("#decisionBadge").textContent = review.decision.label;
  document.querySelector("#decisionTitle").textContent = review.decision.title;
  document.querySelector("#decisionImpact").innerHTML = review.impact.map(renderImpactChip).join("");
  document.querySelector("#statusRisk").innerHTML = renderCheckpoints(review.checkpoints);
  document.querySelector("#sourceMode").textContent = meta.sourceMode;
  document.querySelector("#sourceTimestamp").textContent = `생성시각 ${meta.generatedAt}`;
  document.querySelector("#caveatText").textContent = review.caveat;

  renderActions(review.actions);
  renderLaws(review.laws);
  renderDisclosures(review.disclosures);
  renderMissing(review.missing);
}

function renderImpactChip(item) {
  return `
    <span class="impact-chip ${escapeHtml(item.tone)}">
      <span class="impact-label">${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <span class="impact-note">${escapeHtml(item.note)}</span>
    </span>
  `;
}

function renderCheckpoints(checkpoints) {
  if (!checkpoints.length) return "핵심 확인 포인트 없음";
  return `
    <span class="ranked-risk-list">
      ${checkpoints.map((item, index) => `
        <span class="ranked-risk">
          <span class="rank-index">${index + 1}순위</span>
          <span class="risk-text">
            <span class="risk-label">${escapeHtml(item.label)}</span>
            <span class="risk-task">${escapeHtml(item.task)}</span>
          </span>
        </span>
      `).join("")}
    </span>
  `;
}

function renderActions(actions) {
  const target = document.querySelector("#actionRows");
  target.innerHTML = actions.map((item) => `
    <tr>
      <td data-label="항목">${escapeHtml(item.item)}</td>
      <td data-label="상태">${stateLabel(item.state)}</td>
      <td data-label="관련 법조문">${escapeHtml(item.law)}</td>
      <td data-label="투자자 확인사항">${escapeHtml(item.evidence)}</td>
    </tr>
  `).join("");
}

function renderLaws(laws) {
  const target = document.querySelector("#lawCards");
  target.innerHTML = laws.map((item) => `
    <article class="law-card">
      <h4>${escapeHtml(item.label)}</h4>
      <div class="law-meta">
        <span>${escapeHtml(item.effectiveDate)}</span>
        <span>${escapeHtml(item.sourceStatus)}</span>
      </div>
      <p>${escapeHtml(item.summary)}</p>
      <p><strong>투자자 확인사항</strong> ${escapeHtml(item.investorCheck)}</p>
      <pre>${escapeHtml(item.articleText)}</pre>
      <a class="law-link" href="${escapeAttribute(item.sourceUrl)}" target="_blank" rel="noreferrer">원문 보기</a>
    </article>
  `).join("");
}

function renderDisclosures(rows) {
  const target = document.querySelector("#disclosureRows");
  target.innerHTML = rows.map((item) => `
    <tr>
      <td data-label="공시/보고">${escapeHtml(item.kind)}</td>
      <td data-label="필요 여부">${escapeHtml(item.required)}</td>
      <td data-label="원문 근거">${escapeHtml(item.basis)}</td>
      <td data-label="트리거">${escapeHtml(item.trigger)}</td>
      <td data-label="공시/보고처">${escapeHtml(item.destination)}</td>
    </tr>
  `).join("");
}

function renderMissing(items) {
  const target = document.querySelector("#missingList");
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function stateLabel(state) {
  const label = state === "red" ? "집행 보류" : state === "green" ? "확인 완료" : "확인 필요";
  return `<span class="state ${state}"><span class="dot"></span>${label}</span>`;
}

function showLoading() {
  submitButton.disabled = true;
  submitButton.textContent = "공식 근거 조회 중...";
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  result.classList.add("hidden");
  loadingState.classList.remove("hidden");
}

function showError(message) {
  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");
  result.classList.add("hidden");
  errorState.classList.remove("hidden");
  document.querySelector("#errorMessage").textContent = message;
}

function resetResult() {
  emptyState.classList.remove("hidden");
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  result.classList.add("hidden");
  activateTab("actions");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "");
}
