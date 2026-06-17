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

function fallbackInsight(payload) {
  const strategy = payload?.strategy || {};
  const metrics = payload?.metrics || {};
  const attribution = payload?.attribution || {};
  const headline = `${strategy.title || '선택 전략'}의 LLM 해석은 현재 환경변수 설정 후 활성화됩니다.`;
  const bullets = [
    `Allocation 해석: ${Number(attribution.allocationEffect || 0).toFixed(2)}로 레짐 적합도를 점검합니다.`,
    `Selection 해석: ${Number(attribution.selectionEffect || 0).toFixed(2)}로 구조/행사가 선택의 차이를 봅니다.`,
    `Interaction 해석: ${Number(attribution.interactionEffect || 0).toFixed(2)}로 배분과 선택의 시너지를 확인합니다.`
  ];
  const summary = [
    `${strategy.title || '선택 전략'}은(는) ${payload?.period?.start || '-'} ~ ${payload?.period?.end || '-'} 구간에서`,
    `총손익 ${Number(metrics.totalPnl || 0).toFixed(2)}, 승률 ${(Number(metrics.winRate || 0) * 100).toFixed(1)}%,`,
    `최대낙폭 ${Number(metrics.maxDrawdown || 0).toFixed(2)}를 기록했습니다.`,
    'OpenAI API 키가 설정되면 이 패널이 자동으로 LLM 기반 자연어 해석으로 전환됩니다.'
  ].join(' ');

  return {
    mode: 'fallback',
    note: 'OPENAI_API_KEY가 설정되지 않아 규칙 기반 대체 해석을 표시했습니다.',
    headline,
    summary,
    bullets
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

    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(fallbackInsight(payload)));
      return;
    }

    const prompt = [
      '당신은 한국어로 답변하는 성과 기여도 분석가입니다.',
      '반드시 제공된 데이터만 사용하고 숫자를 새로 만들지 마세요.',
      '핵심은 Allocation(레짐 타이밍 및 위험 자본 배분), Selection(48대 Playbook 구조 및 행사가 타점 선택), Interaction(배분과 선택의 전술적 시너지)입니다.',
      '출력은 반드시 JSON 객체여야 하며, 키는 headline, summary, bullets, allocation, selection, interaction, risk, nextStep, confidence 로 하세요.',
      'bullets 와 risk 는 문자열 배열이어야 합니다.',
      '다음 입력 데이터를 바탕으로 간결하지만 실무적으로 유용한 해석을 작성하세요.',
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
      summary: parsed.summary || '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      allocation: parsed.allocation || '',
      selection: parsed.selection || '',
      interaction: parsed.interaction || '',
      risk: Array.isArray(parsed.risk) ? parsed.risk : [],
      nextStep: parsed.nextStep || '',
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
