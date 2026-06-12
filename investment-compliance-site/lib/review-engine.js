const { LEGAL_SOURCES } = require("./legal-sources");

const ACTION_PRIORITY = [
  { item: "가상자산 편입", label: "가상자산 편입" },
  { item: "계열 금융회사 집중", label: "계열 금융회사 집중" },
  { item: "이해상충 관리", label: "이해상충 관리" },
  { item: "대주주 거래 가능성", label: "대주주 거래 가능성" },
  { item: "해외자산 비중", label: "해외자산 비중" },
  { item: "파생상품 위험", label: "파생상품 위험" },
  { item: "대출 구조", label: "대출 구조" },
  { item: "부동산/PF 구조", label: "부동산/PF 구조" },
  { item: "일반 사모 투자자 요건", label: "일반 사모 투자자 요건" },
  { item: "삼성생명 투자 비중", label: "삼성생명 투자 비중" }
];

const ASSET_LABELS = {
  "domestic-stock": "국내주식",
  "foreign-stock": "해외주식",
  "domestic-bond": "국내채권",
  "foreign-bond": "해외채권",
  "real-estate": "부동산/PF",
  loan: "대출",
  derivatives: "파생상품",
  crypto: "가상자산"
};

function buildReview(input, liveStatuses) {
  const actions = [];
  const disclosures = [];
  const missing = [];
  const lawKeys = new Set(["insurance104", "insurance106"]);

  let redFlags = 0;
  let yellowFlags = 0;

  requireValue(Boolean(input.fundType), "펀드 유형이 필요합니다. 공모, 일반 사모, 기관전용 사모, ETF, 역외 중에서 선택해 주세요.", missing);
  requireValue(input.assetTargets.length > 0, "투자대상이 필요합니다. 최소 1개 이상 선택해 주세요.", missing);

  const allocationTotal = input.assetTargets.reduce((sum, target) => sum + (input.allocations[target] || 0), 0);
  const missingAllocation = input.assetTargets.filter((target) => input.allocations[target] === null);

  if (missingAllocation.length) {
    missing.push(`비중 입력이 빠진 투자대상: ${missingAllocation.map((target) => ASSET_LABELS[target]).join(", ")}`);
  }

  if (input.assetTargets.length > 0 && Math.abs(allocationTotal - 100) > 0.05) {
    missing.push(`투자대상 비중 합계가 100%가 아닙니다. 현재 합계 ${allocationTotal}%`);
  }

  addAction(actions, {
    item: "투자 기본 원칙",
    state: "yellow",
    lawKeys: ["insurance104"],
    evidence: "안정성, 유동성, 수익성, 공익성 검토자료와 선관주의 검토 흔적 확보"
  });

  if (input.foreignRatio > 0) {
    yellowFlags += 1;
    lawKeys.add("insurance106");
    addAction(actions, {
      item: "해외자산 비중",
      state: "yellow",
      lawKeys: ["insurance106"],
      evidence: "외화자산 분류, 환헤지 정책, 외화자산 보유한도 반영 방식 확인"
    });
    if (!input.hedgePolicy) {
      missing.push("해외자산이 포함되어 있어 환헤지 정책 확인이 필요합니다.");
    }
  }

  if (input.leveragePolicy === "used") {
    yellowFlags += 1;
    lawKeys.add("private2497");
    addAction(actions, {
      item: "파생상품 위험",
      state: "yellow",
      lawKeys: ["private2497"],
      evidence: "차입, 담보제공, 파생 위험평가액과 분기 보고 항목 확인"
    });
  }

  if (input.assetTargets.includes("derivatives")) {
    yellowFlags += 1;
    lawKeys.add("capital81");
    lawKeys.add("private2497");
    addAction(actions, {
      item: "파생상품 위험",
      state: "yellow",
      lawKeys: ["capital81", "private2497"],
      evidence: "파생 위험평가액, 기초자산 집중, OTC 거래상대방 한도 확인"
    });
  }

  if (input.assetTargets.includes("real-estate")) {
    yellowFlags += 1;
    lawKeys.add("insurance106");
    lawKeys.add("private2497");
    addAction(actions, {
      item: "부동산/PF 구조",
      state: "yellow",
      lawKeys: ["insurance106", "private2497"],
      evidence: "부동산 보유한도, PF 구조, 조기 처분 제한, 개발사업 여부 확인"
    });
  }

  if (input.assetTargets.includes("loan")) {
    yellowFlags += 1;
    lawKeys.add("private2497");
    addAction(actions, {
      item: "대출 구조",
      state: "yellow",
      lawKeys: ["private2497"],
      evidence: "차주, 담보, 보증, 금전대여 구조와 허용 투자자 범위 확인"
    });
  }

  if (input.assetTargets.includes("crypto")) {
    redFlags += 1;
    lawKeys.add("virtualAsset2");
    addAction(actions, {
      item: "가상자산 편입",
      state: "red",
      lawKeys: ["virtualAsset2"],
      evidence: "편입 자산이 가상자산에 해당하는지와 규제체계 적용 여부 확인 전 집행 보류"
    });
  }

  if (input.fundType === "general-private") {
    yellowFlags += 1;
    lawKeys.add("private2492");
    lawKeys.add("private2494");
    addAction(actions, {
      item: "일반 사모 투자자 요건",
      state: "yellow",
      lawKeys: ["private2492", "private2494"],
      evidence: "적격투자자 여부, 핵심상품설명서, 투자규약 부합성 검증자료 확인"
    });
  }

  const hasAffiliateFeatures = hasFeature(input, "affiliate-manager") || hasFeature(input, "affiliate-investor") || hasFeature(input, "affiliate-seller");
  if (hasAffiliateFeatures) {
    yellowFlags += 1;
    lawKeys.add("capital44");
    lawKeys.add("capital45");
    addAction(actions, {
      item: "이해상충 관리",
      state: "yellow",
      lawKeys: ["capital44", "capital45"],
      evidence: "계열 운용사, 판매사, 공동투자자 간 이해상충 및 정보교류 차단 절차 확인"
    });
  }

  if ((input.affiliateRatio ?? 0) >= 30) {
    redFlags += 1;
    lawKeys.add("private2497");
    addAction(actions, {
      item: "계열 금융회사 집중",
      state: "red",
      lawKeys: ["private2497"],
      evidence: "동일 기업집단 금융회사 합산 투자비중과 의결권 제한 영향 확인 전 집행 보류"
    });
  }

  if ((input.lifeRatio ?? 0) > 0) {
    yellowFlags += 1;
    lawKeys.add("insurance106");
    addAction(actions, {
      item: "삼성생명 투자 비중",
      state: "yellow",
      lawKeys: ["insurance106"],
      evidence: "삼성생명 직접 투자 비중이 보험업법상 자산운용비율과 내부 한도에 미치는 영향 확인"
    });
  }

  if (hasFeature(input, "major-shareholder")) {
    redFlags += 1;
    lawKeys.add("insurance111");
    lawKeys.add("governance27");
    addAction(actions, {
      item: "대주주 거래 가능성",
      state: "red",
      lawKeys: ["insurance111", "governance27"],
      evidence: "대주주 또는 특수관계인 해당 여부, 거래금액, 이사회 의결 및 보고·공시 트리거 확인"
    });
  }

  if (input.assetTargets.includes("domestic-stock") || input.assetTargets.includes("foreign-stock")) {
    lawKeys.add("capital87");
    if (hasAffiliateFeatures) {
      addDisclosure(disclosures, {
        kind: "의결권 행사 공시",
        required: "확인 필요",
        basis: "자본시장과 금융투자업에 관한 법률 제87조",
        trigger: "의결권공시대상법인 또는 계열관계 있는 주식 편입 시",
        destination: "근거없음"
      });
    }
  }

  if (hasFeature(input, "major-shareholder")) {
    addDisclosure(disclosures, {
      kind: "보험업법상 대주주 거래 보고/공시",
      required: "필요",
      basis: "보험업법 제111조",
      trigger: "대주주 발행 채권·주식 취득 또는 일정 금액 이상 신용공여 시",
      destination: "금융위원회 / 인터넷 홈페이지"
    });
  }

  if (input.fundType === "general-private" && (input.leveragePolicy === "used" || input.assetTargets.includes("loan") || input.assetTargets.includes("real-estate") || input.assetTargets.includes("derivatives"))) {
    addDisclosure(disclosures, {
      kind: "일반 사모집합투자기구 분기 보고",
      required: "필요",
      basis: "자본시장과 금융투자업에 관한 법률 제249조의7",
      trigger: "차입, 담보제공, 파생 위험평가액 등 발생 시",
      destination: "금융위원회"
    });
  }

  const rankedActions = sortActions(actions);
  const checkpoints = rankedActions
    .filter((item) => item.state !== "green")
    .slice(0, 3)
    .map((item) => ({
      label: item.item,
      task: item.evidence
    }));

  const decision = buildDecision(rankedActions, redFlags, yellowFlags, missing);
  const impact = buildImpact(rankedActions, disclosures);

  const laws = Array.from(lawKeys)
    .map((key) => buildLawCard(key, liveStatuses[key]))
    .filter(Boolean);

  return {
    decision,
    impact,
    checkpoints,
    actions: rankedActions.map((action) => ({
      item: action.item,
      state: action.state,
      law: action.lawKeys.map((key) => LEGAL_SOURCES[key]?.label).filter(Boolean).join(" / "),
      evidence: action.evidence
    })),
    laws,
    disclosures: disclosures.length ? disclosures : [{
      kind: "직접 확인된 외부 공시/보고",
      required: "근거없음",
      basis: "제공 자료에서 직접 확인 불가",
      trigger: "근거없음",
      destination: "근거없음"
    }],
    missing: missing.length ? missing : ["추가 확인 필요사항 없음"],
    caveat: "본 결과는 투자자 관점의 검토 초안입니다. 공시·보고처는 조문 문언에서 직접 확인되는 범위만 표기했고, 조문에 없는 사항은 근거없음으로 남겼습니다."
  };
}

function buildLawCard(key, liveStatus) {
  const item = LEGAL_SOURCES[key];
  if (!item) return null;

  return {
    ...item,
    sourceStatus: liveStatus?.reachable ? `국가법령정보센터 연결 확인 (${liveStatus.title || "공식 페이지"})` : "공식 링크 연결 미확인"
  };
}

function buildDecision(actions, redFlags, yellowFlags, missing) {
  const topIssue = actions.find((item) => item.state === "red") || actions.find((item) => item.state === "yellow");
  const topLabel = topIssue?.item || "주요 쟁점";

  if (redFlags > 0) {
    return {
      level: "red",
      label: "집행 보류",
      title: `${topLabel} 해소 전 집행 보류`,
      reason: "명시적 차단 또는 선결 확인사항 존재"
    };
  }

  if (yellowFlags > 0 || missing.length > 0) {
    return {
      level: "yellow",
      label: "투자유의",
      title: `${topLabel} 확인 후 검토 계속`,
      reason: "추가 확인이나 절차 이행 필요"
    };
  }

  return {
    level: "green",
    label: "투자가능",
    title: "현재 확인 범위 내 투자 가능",
    reason: "직접 확인된 주요 차단 사유 없음"
  };
}

function buildImpact(actions, disclosures) {
  const affiliate = actions.some((item) => ["계열 금융회사 집중", "이해상충 관리"].includes(item.item));
  const board = actions.some((item) => item.item === "대주주 거래 가능성");
  const disclosure = disclosures.some((item) => item.required !== "근거없음");

  return [
    {
      label: "계열사 영향",
      value: affiliate ? "있음" : "없음",
      note: affiliate ? "자본시장법" : "직접 쟁점 없음",
      tone: affiliate ? "high" : "low"
    },
    {
      label: "이사회",
      value: board ? "필요" : "불필요",
      note: board ? "보험업법" : "보험업법",
      tone: board ? "high" : "low"
    },
    {
      label: "공시/보고",
      value: disclosure ? "필요" : "불필요",
      note: disclosure ? "보험업법 / 자본시장법" : "직접 쟁점 없음",
      tone: disclosure ? "medium" : "low"
    }
  ];
}

function addAction(actions, item) {
  if (actions.some((current) => current.item === item.item && current.state === item.state)) {
    return;
  }
  actions.push(item);
}

function addDisclosure(disclosures, item) {
  if (disclosures.some((current) => current.kind === item.kind)) {
    return;
  }
  disclosures.push(item);
}

function hasFeature(input, value) {
  return input.features.includes(value);
}

function requireValue(condition, message, missing) {
  if (!condition) missing.push(message);
}

function sortActions(actions) {
  const rank = new Map(ACTION_PRIORITY.map((item, index) => [item.item, index]));
  const stateRank = { red: 0, yellow: 1, green: 2 };

  return [...actions].sort((left, right) => {
    const leftState = stateRank[left.state] ?? 9;
    const rightState = stateRank[right.state] ?? 9;
    if (leftState !== rightState) return leftState - rightState;

    const leftRank = rank.get(left.item) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.item) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;

    return left.item.localeCompare(right.item, "ko");
  });
}

module.exports = {
  buildReview,
  LEGAL_SOURCES
};
