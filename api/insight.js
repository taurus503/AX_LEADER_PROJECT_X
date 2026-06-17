const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function classifyCase(payload) {
  const metrics = payload?.metrics || {};
  const attribution = payload?.attribution || {};
  const totalPnl = safeNumber(metrics.totalPnl);
  const winRate = safeNumber(metrics.winRate);
  const maxDrawdown = safeNumber(metrics.maxDrawdown);
  const allocation = safeNumber(attribution.allocationEffect);
  const selection = safeNumber(attribution.selectionEffect);
  const interaction = safeNumber(attribution.interactionEffect);
  const absAllocation = Math.abs(allocation);
  const absSelection = Math.abs(selection);
  const absInteraction = Math.abs(interaction);
  const biggest = Math.max(absAllocation, absSelection, absInteraction);
  const dominant = biggest === absAllocation ? 'allocation' : biggest === absSelection ? 'selection' : 'interaction';
  const dominantValue = dominant === 'allocation' ? allocation : dominant === 'selection' ? selection : interaction;

  if (totalPnl < 0 && maxDrawdown < 0) {
    return {
      caseFrame: '방어 실패형',
      dominantFactor: dominant,
      thesis: '수익보다 방어가 먼저 무너진 구간입니다. 숫자 자체보다 어느 축에서 손실이 증폭됐는지 보는 편이 맞습니다.',
      contrarianView: '전략 구조가 나쁜 것만이 아니라 기간 선택이 맞지 않았을 가능성도 함께 봐야 합니다.'
    };
  }

  if (dominant === 'allocation' && dominantValue >= 0.5) {
    return {
      caseFrame: '레짐 정렬형',
      dominantFactor: dominant,
      thesis: '성과의 중심축이 레짐 적합도에 있습니다. 같은 구조라도 들어간 구간이 성과를 갈랐을 가능성이 큽니다.',
      contrarianView: '선택이 좋아 보여도, 실제로는 타이밍이 결과 대부분을 설명했을 수 있습니다.'
    };
  }

  if (dominant === 'selection' && dominantValue >= 0.5) {
    return {
      caseFrame: '선택 우위형',
      dominantFactor: dominant,
      thesis: '같은 배분 안에서도 어떤 구조와 행사가를 택했는지가 핵심이었던 구간입니다.',
      contrarianView: '겉으로는 구조 성과처럼 보여도, 레짐이 무난해서 선택 차이가 도드라졌을 수 있습니다.'
    };
  }

  if (dominant === 'interaction' && dominantValue >= 0.2) {
    return {
      caseFrame: '상호작용 분화형',
      dominantFactor: dominant,
      thesis: '배분과 선택이 따로 보지 않고 같이 봐야 하는 구간입니다. 어느 하나만 떼어 설명하면 오해가 생깁니다.',
      contrarianView: '효과가 섞여 보이는 만큼, 일부 구간에서는 배분이 좋고 일부에서는 선택이 좋았을 수 있습니다.'
    };
  }

  if (winRate >= 0.6) {
    return {
      caseFrame: '승률 주도형',
      dominantFactor: dominant,
      thesis: '큰 한 방보다 꾸준한 적중이 성과를 만든 구간입니다. 설명도 평균적인 우위와 반복성에 초점을 두는 편이 맞습니다.',
      contrarianView: '고수익보다 빈도 중심의 전략일 수 있어, 평균 손익보다 분산을 같이 봐야 합니다.'
    };
  }

  return {
    caseFrame: '혼합 해석형',
    dominantFactor: dominant,
    thesis: '한 축으로 깔끔하게 설명되기보다 여러 요인이 같이 작동한 구간입니다. 숫자보다 패턴을 읽는 해석이 더 잘 맞습니다.',
    contrarianView: '겉으로 혼합처럼 보여도, 실제론 한두 거래가 전체 인상을 왜곡했을 수도 있습니다.'
  };
}

function fallbackInsight(payload) {
  const strategy = payload?.strategy || {};
  const metrics = payload?.metrics || {};
  const attribution = payload?.attribution || {};
  const caseInfo = classifyCase(payload);
  const headline = `${strategy.title || '선택 전략'}은 현재 구간에서 구조보다 실행 맥락이 더 크게 작동한 것으로 보입니다.`;
  const bullets = [
    `배분 측면에서는 레짐과 자본 투입의 타이밍이 먼저 보입니다.`,
    `선택 측면에서는 구조와 행사가가 결과를 갈랐는지 확인할 필요가 있습니다.`,
    `상호작용 측면에서는 비중과 선택이 서로를 강화했는지, 아니면 상쇄했는지를 봐야 합니다.`
  ];
  const summary = `${strategy.title || '선택 전략'}은 ${payload?.period?.start || '-'}부터 ${payload?.period?.end || '-'}까지의 구간에서 ${Number(metrics.totalPnl || 0).toFixed(2)}의 결과를 냈습니다. 승률은 ${(Number(metrics.winRate || 0) * 100).toFixed(1)}%이고, 최대낙폭은 ${Number(metrics.maxDrawdown || 0).toFixed(2)}입니다. 이 패널은 숫자 나열보다 왜 그런 결과가 났는지 설명하는 용도로 설계되었습니다.`;

  return {
    mode: 'fallback',
    note: 'OPENAI_API_KEY가 설정되지 않아 규칙 기반 대체 해석을 표시했습니다. 키를 넣으면 문장형 LLM 해석으로 전환됩니다.',
    headline,
    caseFrame: caseInfo.caseFrame,
    dominantFactor: caseInfo.dominantFactor,
    thesis: caseInfo.thesis,
    summary,
    bullets,
    allocation: '레짐과 자본 배분의 정합성을 먼저 확인합니다.',
    selection: '전략 구조와 행사가 선택이 결과를 어떻게 바꿨는지 봅니다.',
    interaction: '배분과 선택이 같은 방향으로 밀어줬는지, 아니면 서로를 깎아먹었는지 봅니다.',
    risk: [
      '거래 수가 적으면 숫자 해석보다 구조 해석에 더 비중을 둡니다.',
      '낙폭이 크면 선택 성과보다 리스크 통제가 먼저입니다.'
    ],
    nextStep: '같은 전략을 다른 기간으로 한 번 더 돌려서 문장 패턴이 유지되는지 비교해 보세요.',
    contrarianView: caseInfo.contrarianView,
    confidence: '중간'
  };
}

function parseOpenAIJson(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    const trimmed = String(content).trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'method not allowed' }));
    return;
  }

  try {
    const payload = await readBody(req);
    const caseInfo = classifyCase(payload);

    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(fallbackInsight(payload)));
      return;
    }

    const prompt = [
      '당신은 한국어로 답변하는 성과 기여도 분석가입니다.',
      '반드시 제공된 데이터만 사용하고 숫자를 새로 만들지 마세요.',
      '핵심 축은 Allocation(레짐 타이밍 및 위험 자본 배분), Selection(48대 Playbook 구조 및 행사가 타점 선택), Interaction(배분과 선택의 전술적 시너지)입니다.',
      '출력은 반드시 JSON 객체여야 하며, 키는 headline, summary, bullets, allocation, selection, interaction, risk, nextStep, confidence 로 하세요.',
      'caseFrame, dominantFactor, thesis, contrarianView 키도 함께 포함하세요.',
      'headline 은 한 문장짜리 총평이어야 하고, summary 는 2~4문장으로 자연스럽게 설명해야 합니다.',
      `이번 사례는 ${caseInfo.caseFrame}에 가깝고 dominantFactor 는 ${caseInfo.dominantFactor} 입니다.`,
      `thesis 는 이 케이스를 가장 잘 설명하는 한 문장 판단이어야 합니다: ${caseInfo.thesis}`,
      'contrarianView 는 현재 판단에 대한 반대 시각이나 확인할 함정이어야 합니다.',
      'allocation, selection, interaction 은 각각 1~2문장짜리 분석 문단이어야 하며, 같은 문장 구조를 반복하지 마세요.',
      'bullets 와 risk 는 문자열 배열이어야 하며, bullets 는 3개 이하로 자연스럽게, risk 는 주의점 중심으로 작성하세요.',
      'nextStep 은 다음에 무엇을 확인할지 구체적으로 쓰고, confidence 는 낮음/중간/높음 중 하나로 쓰세요.',
      '문장 톤은 분석 메모처럼 쓰고, 템플릿처럼 들리는 표현은 피하세요.',
      JSON.stringify(payload)
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a precise financial analyst. Do not invent values. Return only JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenAI error ${response.status}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    const parsed = parseOpenAIJson(content);
    if (!parsed) {
      throw new Error('OpenAI response JSON parse failed');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      mode: 'openai',
      headline: parsed.headline || 'AI 해석',
      caseFrame: parsed.caseFrame || caseInfo.caseFrame,
      dominantFactor: parsed.dominantFactor || caseInfo.dominantFactor,
      thesis: parsed.thesis || caseInfo.thesis,
      summary: parsed.summary || '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      allocation: parsed.allocation || '',
      selection: parsed.selection || '',
      interaction: parsed.interaction || '',
      risk: Array.isArray(parsed.risk) ? parsed.risk : [],
      nextStep: parsed.nextStep || '',
      contrarianView: parsed.contrarianView || caseInfo.contrarianView,
      confidence: parsed.confidence || ''
    }));
  } catch (error) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      ...fallbackInsight({}),
      note: error?.message || 'AI 해석 실패'
    }));
  }
};
