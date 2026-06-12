const PLAYBOOK_URL = "https://bitter-morning-77fd.jager001.workers.dev";
const PLAYBOOK_SCALE = 3.4811914893617018;
const STRATEGY_CATALOG = [{"slug":"bull-call-spread","title":"Bull Call Spread","category":"방향성 전략","bias":"bull","vol":"buy","risk":"defined","eventFit":"medium","cost":"medium","summary":"완만한 상승과 정의된 손실을 동시에 추구하는 기본 강세 구조입니다."},{"slug":"bull-put-spread","title":"Bull Put Spread","category":"방향성 전략","bias":"bull","vol":"sell","risk":"defined","eventFit":"low","cost":"credit","summary":"완만한 상승 또는 하방 제한을 전제로 프리미엄을 수취하는 강세 구조입니다."},{"slug":"bear-put-spread","title":"Bear Put Spread","category":"방향성 전략","bias":"bear","vol":"buy","risk":"defined","eventFit":"medium","cost":"medium","summary":"완만한 하락에 맞는 약세 기본 구조로, 손실은 제한되고 방향성은 선명합니다."},{"slug":"bear-call-spread","title":"Bear Call Spread","category":"방향성 전략","bias":"bear","vol":"sell","risk":"defined","eventFit":"low","cost":"credit","summary":"상방이 제한될 것이라는 뷰에 맞는 크레딧형 약세 구조입니다."},{"slug":"risk-reversal","title":"Risk Reversal","category":"방향성 전략","bias":"bull","vol":"mixed","risk":"tail","eventFit":"high","cost":"low","summary":"강한 강세 뷰를 프리미엄 절감형으로 표현하지만 하단 tail risk를 안습니다."},{"slug":"bearish-risk-reversal","title":"Bearish Risk Reversal","category":"방향성 전략","bias":"bear","vol":"mixed","risk":"tail","eventFit":"high","cost":"low","summary":"강한 약세 뷰를 비용 절감형으로 표현하지만 상단 tail risk를 안습니다."},{"slug":"long-straddle","title":"Long Straddle","category":"변동성 매수 전략","bias":"neutral","vol":"buy","risk":"defined","eventFit":"high","cost":"high","summary":"방향보다 이동 폭을 사는 대표 전략입니다."},{"slug":"long-strangle","title":"Long Strangle","category":"변동성 매수 전략","bias":"neutral","vol":"buy","risk":"defined","eventFit":"high","cost":"medium","summary":"비용을 낮춘 양매수 구조로 큰 변동에 베팅합니다."},{"slug":"call-backspread","title":"Call Backspread","category":"변동성 매수 전략","bias":"bull","vol":"buy","risk":"defined","eventFit":"high","cost":"medium","summary":"급등과 변동성 확대에 유리한 상방 볼록성 구조입니다."},{"slug":"put-backspread","title":"Put Backspread","category":"변동성 매수 전략","bias":"bear","vol":"buy","risk":"defined","eventFit":"high","cost":"medium","summary":"급락과 변동성 확대에 유리한 하방 볼록성 구조입니다."},{"slug":"short-straddle","title":"Short Straddle","category":"변동성 매도 전략","bias":"neutral","vol":"sell","risk":"tail","eventFit":"low","cost":"credit","summary":"저변동성 박스권에 맞지만 이벤트와 추세 급변에는 매우 취약합니다."},{"slug":"short-strangle","title":"Short Strangle","category":"변동성 매도 전략","bias":"neutral","vol":"sell","risk":"tail","eventFit":"low","cost":"credit","summary":"박스권이 넓을수록 유리하지만 꼬리위험 관리가 핵심입니다."},{"slug":"iron-condor","title":"Iron Condor","category":"변동성 매도 전략","bias":"neutral","vol":"sell","risk":"defined","eventFit":"medium","cost":"credit","summary":"정의된 손실을 가진 레인지형 프리미엄 수취 구조입니다."},{"slug":"iron-butterfly","title":"Iron Butterfly","category":"변동성 매도 전략","bias":"neutral","vol":"sell","risk":"defined","eventFit":"low","cost":"credit","summary":"중심값 근처 체류에 가장 민감한 고집중 레인지 구조입니다."},{"slug":"call-calendar-spread","title":"Call Calendar Spread","category":"만기 구조 전략","bias":"bull","vol":"mixed","risk":"defined","eventFit":"medium","cost":"medium","summary":"완만한 강세와 시간가치 차이를 동시에 활용하는 구조입니다."},{"slug":"put-calendar-spread","title":"Put Calendar Spread","category":"만기 구조 전략","bias":"bear","vol":"mixed","risk":"defined","eventFit":"medium","cost":"medium","summary":"완만한 약세와 시간가치 차이를 동시에 활용하는 구조입니다."},{"slug":"covered-call","title":"Covered Call","category":"수익 강화 전략","bias":"bull","vol":"sell","risk":"tail","eventFit":"low","cost":"income","summary":"완만한 상승 또는 횡보에서 프리미엄을 더해주는 오버라이트 구조입니다."},{"slug":"collar","title":"Collar","category":"헤지 전략","bias":"bull","vol":"mixed","risk":"defined","eventFit":"high","cost":"low","summary":"상방 일부를 포기하고 하단을 방어하는 보수형 구조입니다."},{"slug":"one-by-two-call-spread","title":"1x2 Call Ratio Spread","category":"비대칭 Ratio","bias":"bull","vol":"mixed","risk":"tail","eventFit":"medium","cost":"low","summary":"상승 목표구간에는 효율적이지만 상단 과속 시 리스크가 커집니다."},{"slug":"one-by-two-put-spread","title":"1x2 Put Ratio Spread","category":"비대칭 Ratio","bias":"bear","vol":"mixed","risk":"tail","eventFit":"medium","cost":"low","summary":"하락 목표구간에 효율적이지만 급락 tail risk가 존재합니다."}];
const FALLBACK_MARKET = {"asOfDate":"2026-06-10","spot":1227.12,"change1d":0.8,"change5d":2.1,"change21d":5.6,"realizedVol20":24.8};
const FALLBACK_HEADLINES = [{"title":"반도체/AI 수급: 삼성전자, SK하이닉스, HBM, 외국인 매수","date":"2026-06-10","keywords":["삼성전자","SK하이닉스","HBM","외국인 매수"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4%20HBM%20%EC%99%B8%EA%B5%AD%EC%9D%B8"},{"title":"금리/환율 이벤트: 연준, 한국은행, 달러원, 국채금리","date":"2026-06-10","keywords":["연준","한국은행","달러원","국채금리"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EB%8B%AC%EB%9F%AC%EC%9B%90"},{"title":"지수 모멘텀: 코스피200, 신고가, 차익실현, 프로그램 매매","date":"2026-06-10","keywords":["코스피200","신고가","차익실현","프로그램 매매"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%A7%80%EC%88%98%20%EB%AA%A8%EB%A9%98%ED%85%80%20%EC%8B%A0%EA%B3%A0%EA%B0%80%20%EC%B0%A8%EC%9D%B5%EC%8B%A4%ED%98%84%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EB%A7%A4%EB%A7%A4"},{"title":"변동성/옵션 이벤트: VKOSPI, 옵션만기, 변동성, 이벤트 리스크","date":"2026-06-10","keywords":["VKOSPI","옵션만기","변동성","이벤트 리스크"],"url":"https://www.google.com/search?q=2026-06-10%20VKOSPI%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%98%B5%EC%85%98%EB%A7%8C%EA%B8%B0%20%EB%B3%80%EB%8F%99%EC%84%B1%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EB%A6%AC%EC%8A%A4%ED%81%AC"},{"title":"대외 리스크: 미국 증시, 중국 경기, 관세, 지정학","date":"2026-06-10","keywords":["미국 증시","중국 경기","관세","지정학"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%AF%B8%EA%B5%AD%20%EC%A6%9D%EC%8B%9C%20%EC%A4%91%EA%B5%AD%20%EA%B2%BD%EA%B8%B0%20%EA%B4%80%EC%84%B8%20%EC%A7%80%EC%A0%95%ED%95%99%20%EB%A6%AC%EC%8A%A4%ED%81%AC"}];
const FALLBACK_REPORTS = [{"source":"전략 리포트 검색","title":"시장전략 컨센서스: 운용전략, 코스피 전망, 상단/하단, 리스크","date":"2026-06-10","keywords":["운용전략","코스피 전망","상단/하단","리스크"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9A%B4%EC%9A%A9%EC%A0%84%EB%9E%B5%20%EC%BD%94%EC%8A%A4%ED%94%BC%20%EC%A0%84%EB%A7%9D%20%EC%83%81%EB%8B%A8%20%ED%95%98%EB%8B%A8%20%EB%A6%AC%EC%8A%A4%ED%81%AC"},{"source":"업종 리포트 검색","title":"반도체 이익전망: 반도체, AI, 이익전망, 목표주가","date":"2026-06-10","keywords":["반도체","AI","이익전망","목표주가"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%9D%B4%EC%9D%B5%EC%A0%84%EB%A7%9D%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4"},{"source":"매크로 리포트 검색","title":"금리/환율 시나리오: 금리, 환율, 연준, 한국은행","date":"2026-06-10","keywords":["금리","환율","연준","한국은행"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EC%BD%94%EC%8A%A4%ED%94%BC"},{"source":"수급 리포트 검색","title":"외국인/기관 수급: 외국인, 기관, 선물, 프로그램","date":"2026-06-10","keywords":["외국인","기관","선물","프로그램"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EC%99%B8%EA%B5%AD%EC%9D%B8%20%EA%B8%B0%EA%B4%80%20%EC%88%98%EA%B8%89%20%EC%84%A0%EB%AC%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EC%BD%94%EC%8A%A4%ED%94%BC200"},{"source":"변동성 리포트 검색","title":"변동성/파생 포지션: VKOSPI, 옵션, 만기, 헤지","date":"2026-06-10","keywords":["VKOSPI","옵션","만기","헤지"],"url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20VKOSPI%20%EC%98%B5%EC%85%98%20%EB%A7%8C%EA%B8%B0%20%ED%97%A4%EC%A7%80%20%EC%BD%94%EC%8A%A4%ED%94%BC200"}];
const FOMC_DATES = ["2026-06-16","2026-07-28","2026-09-15","2026-10-27","2026-12-08"];
const BOK_DATES = ["2026-07-09","2026-08-27","2026-10-15","2026-11-26"];
const APP_HTML = "<!DOCTYPE html>\n<html lang=\"ko\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Option Playbook Advisor ver 5.6</title>\n  <style>\n    :root {\n      --bg: #050806;\n      --panel: #143926;\n      --panel-alt: #ef7d21;\n      --panel-dark: #0d1510;\n      --card: #111714;\n      --card-soft: #1a211d;\n      --ink: #f5f0e6;\n      --muted: #d7cfbf;\n      --line: #050505;\n      --green: #0fb26f;\n      --blue: #79a8ff;\n      --orange: #ff7a00;\n      --red: #ff5d3d;\n      --yellow: #ffd84d;\n    }\n    * { box-sizing: border-box; }\n    body { margin: 0; font-family: \"Segoe UI\", \"Malgun Gothic\", Arial, sans-serif; background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)), var(--bg); color: var(--ink); }\n    .app { min-height: 100vh; padding: 24px; display: grid; gap: 22px; }\n    .topbar, .panel, .strategy-card, .news-item, .mini-card, .badge-card { border: 3px solid var(--line); box-shadow: none; border-radius: 0; }\n    .topbar { padding: 0; display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(300px, .9fr); background: #050505; color: #fff8ef; }\n    .hero-copy { padding: 28px; display: grid; gap: 14px; background: #0f4f31; min-height: 248px; }\n    .hero-warning { padding: 28px; display: grid; align-content: start; gap: 14px; background: #f67a18; color: #130b05; min-height: 248px; }\n    .hero-actions { display:flex; justify-content:flex-start; align-items:center; gap:12px; flex-wrap:wrap; }\n    h1 { margin: 0; font-size: clamp(34px, 7vw, 68px); line-height: .9; letter-spacing: 0; font-weight: 950; }\n    .topbar p { margin: 0; max-width: 980px; color: #fff3df; line-height: 1.8; font-size: 24px; }\n    .warning-title { display: inline-block; width: fit-content; padding: 6px 10px; background: #050505; color: #fff3df; font-size: 14px; font-weight: 950; text-transform: uppercase; }\n    .warning-copy { margin: 0; font-size: 23px; line-height: 1.8; font-weight: 850; color: #1b1109; }\n    .grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; align-items: start; }\n    .panel { padding: 22px; background: var(--panel); color: var(--ink); }\n    .panel.theme-orange { background: var(--panel-alt); color: #160d06; }\n    .panel.theme-orange .panel-date { background: #1c1109; color: #fff1df; }\n    .panel.theme-orange .panel h3 {}\n    .panel.theme-orange .mini-card,\n    .panel.theme-orange .badge-card,\n    .panel.theme-orange .news-item,\n    .panel.theme-orange .strategy-card { background: #23160d; color: var(--ink); }\n    .panel.theme-green { background: #165236; }\n    .panel.theme-dark { background: var(--panel-dark); }\n    .panel h2, .panel h3 { margin: 0 0 14px; }\n    .panel h2 { font-size: 36px; font-weight: 950; line-height: .98; }\n    .panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:14px; }\n    .panel-date { display:inline-block; padding:7px 12px; background:#fff3df; border:3px solid var(--line); font-size:16px; font-weight:950; color:#2f2518; }\n    .panel h3 { display: inline-block; padding: 5px 10px; background: var(--line); color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 0; font-weight: 950; }\n    .market-grid, .state-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }\n    .mini-card, .badge-card { padding: 18px; background: var(--card); min-height: 128px; color: var(--ink); }\n    .mini-card b, .badge-card b { display: block; font-size: 14px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; font-weight: 950; }\n    .mini-card span, .badge-card span { font-size: 31px; font-weight: 950; line-height: 1.05; color: var(--ink); }\n    .badge-card span { font-size: 29px; }\n    .badge-card.state-bull { background: #0f6a43; }\n    .badge-card.state-bear { background: #7f2818; }\n    .badge-card.state-neutral { background: #8b470d; }\n    .badge-card.state-vol-high { background: #8b470d; }\n    .badge-card.state-vol-mid { background: #654a1b; }\n    .badge-card.state-vol-low { background: #34571d; }\n    .badge-card.state-risk-high { background: #99331f; }\n    .badge-card.state-risk-mid { background: #734315; }\n    .badge-card.state-conviction-high { background: #1f5b3f; }\n    .badge-card.state-conviction-mid { background: #3b391f; }\n    .badge-card.state-conviction-low { background: #30322f; }\n    .positive { color: var(--green); }\n    .negative { color: var(--red); }\n    .neutral { color: var(--orange); }\n    .strategies { display: grid; gap: 16px; }\n    .strategy-card { padding: 20px; background: var(--card); color: var(--ink); min-height: 320px; }\n    .strategy-head { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }\n    .strategy-head h4 { margin: 0; font-size: 29px; line-height: 1.02; font-weight: 950; }\n    .score { min-width: 108px; padding: 11px 12px; text-align: right; background: var(--yellow); color: #111; font-weight: 950; font-size: 32px; line-height: .95; border: 3px solid var(--line); }\n    .sub { margin-top: 8px; color: var(--muted); font-size: 14px; font-weight: 800; text-transform: uppercase; }\n    .summary { margin: 16px 0 0; line-height: 1.8; color: #eee3cf; font-size: 24px; }\n    .bullets { margin: 14px 0 0; padding-left: 26px; display: grid; gap: 10px; color: #eee3cf; font-size: 20px; line-height: 1.8; }\n    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }\n    .cta, .secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 12px 18px; border: 3px solid var(--line); text-decoration: none; color: var(--ink); font-weight: 950; font-size: 18px; }\n    .cta { background: var(--yellow); color: #131313; }\n    .secondary { background: var(--orange); color: #160d06; }\n    .update-button { min-width: 180px; box-shadow: 5px 5px 0 #050505; transition: transform .08s ease, box-shadow .08s ease; }\n    .update-button:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #050505; }\n    .update-button:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #050505; }\n    .rationale-list, .watch-grid, .news-list { display: grid; gap: 14px; }\n    .news-item { padding: 18px; background: var(--card); color: var(--ink); min-height: 132px; display: grid; align-content: start; }\n    .news-item b { display: block; margin-bottom: 8px; font-size: 24px; line-height: 1.35; }\n    .news-item a { color: #fff7ea; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }\n    .news-item a:hover { color: var(--yellow); }\n    .commentary-tile { display: grid; gap: 10px; min-height: 220px; }\n    .commentary-line { color: #f2e6d1; line-height: 1.85; font-size: 23px; }\n    .foot { color: var(--muted); font-size: 18px; line-height: 1.8; }\n    .source-tag { display:inline-block; margin-right:8px; padding:4px 8px; background: var(--orange); color:#170e06; border:2px solid var(--line); font-size:14px; font-weight:950; text-transform:uppercase; }\n    .sub { margin-top: 10px; color: var(--muted); font-size: 18px; font-weight: 850; text-transform: uppercase; line-height: 1.65; }\n    .theme-orange .source-tag { background: var(--green); color:#08130d; }\n    @media (max-width: 980px) {\n      .topbar { grid-template-columns: 1fr; }\n      .grid { grid-template-columns: 1fr; }\n      .market-grid, .state-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }\n    }\n    @media (max-width: 640px) {\n      .app { padding: 12px; gap: 14px; }\n      .hero-copy, .hero-warning, .panel, .strategy-card { padding: 14px; min-height: auto; }\n      .news-item, .mini-card, .badge-card { min-height: auto; }\n      .market-grid, .state-grid { grid-template-columns: 1fr; }\n      .strategy-head { flex-direction: column; }\n      .score { width: 100%; text-align: left; }\n    }\n  </style>\n</head>\n  <body>\n  <main class=\"app\">\n    <section class=\"topbar\">\n      <div class=\"hero-copy\">\n        <div class=\"hero-actions\">\n          <button class=\"secondary update-button\" id=\"refreshButton\" type=\"button\">데이터 업데이트</button>\n        </div>\n        <h1>Option Playbook Advisor</h1>\n        <p>현재 KOSPI200 레벨, 추정 변동성, 공개 뉴스 헤드라인과 예정 이벤트를 결합해 오늘 가장 적합한 옵션 합성전략을 3개 우선순위로 제안합니다.</p>\n      </div>\n      <aside class=\"hero-warning\">\n        <span class=\"warning-title\">Important</span>\n        <p class=\"warning-copy\">이 Advisor는 공개 시장 데이터와 헤드라인, 규칙 기반 해석을 결합한 참고용 도구입니다. 실제 투자 판단과 손익 책임은 전적으로 본인에게 있으며, 실전 적용 전에는 옵션 이론가와 유동성, 이벤트 일정, 포지션 한도를 반드시 별도로 점검해야 합니다.</p>\n      </aside>\n    </section>\n\n    <section class=\"panel theme-green\">\n      <div class=\"panel-head\">\n        <h2>오늘의 시장 상태</h2>\n        <span class=\"panel-date\" id=\"marketAsOf\">기준일 -</span>\n      </div>\n      <div class=\"market-grid\" id=\"marketGrid\"></div>\n      <div style=\"height:10px\"></div>\n      <div class=\"state-grid\" id=\"stateGrid\"></div>\n    </section>\n\n    <section class=\"panel theme-orange\">\n      <h2>뉴스 키워드 테마 View</h2>\n      <div class=\"rationale-list\" id=\"headlineCommentary\"></div>\n      <div style=\"height:14px\"></div>\n      <div class=\"news-list\" id=\"newsList\"></div>\n    </section>\n\n    <section class=\"panel theme-green\">\n      <h2>증권사 리포트 검색 View</h2>\n      <div class=\"rationale-list\" id=\"reportCommentary\"></div>\n      <div style=\"height:14px\"></div>\n      <div class=\"news-list\" id=\"reportList\"></div>\n    </section>\n\n    <section class=\"grid\">\n      <section class=\"panel theme-dark\">\n        <h2>추천 전략 TOP 3</h2>\n        <div class=\"strategies\" id=\"strategyList\"></div>\n      </section>\n\n      <section class=\"panel theme-orange\">\n        <h2>시장 해석</h2>\n        <div class=\"rationale-list\" id=\"rationaleList\"></div>\n        <div style=\"height:18px\"></div>\n        <h3>Watchlist</h3>\n        <div class=\"watch-grid\" id=\"watchList\"></div>\n        <div style=\"height:18px\"></div>\n        <h3>Avoid Now</h3>\n        <div class=\"watch-grid\" id=\"avoidList\"></div>\n      </section>\n    </section>\n\n    <section class=\"grid\">\n      <section class=\"panel theme-green\">\n        <h2>운영 메모</h2>\n        <div class=\"rationale-list\" id=\"opsNotes\"></div>\n        <div style=\"height:14px\"></div>\n        <div class=\"cta-row\">\n          <a class=\"cta\" href=\"https://bitter-morning-77fd.jager001.workers.dev\" target=\"_blank\" rel=\"noreferrer\">Option Playbook 열기</a>\n        </div>\n      </section>\n    </section>\n  </main>\n  <script>\n    const BOOTSTRAP = {\"market\":{\"asOfDate\":\"2026-06-10\",\"spot\":1227.12,\"change1d\":0.8,\"change5d\":2.1,\"change21d\":5.6,\"realizedVol20\":24.8},\"headlines\":[{\"title\":\"반도체/AI 수급: 삼성전자, SK하이닉스, HBM, 외국인 매수\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4%20HBM%20%EC%99%B8%EA%B5%AD%EC%9D%B8\",\"keywords\":[\"삼성전자\",\"SK하이닉스\",\"HBM\",\"외국인 매수\"],\"rank\":1},{\"title\":\"금리/환율 이벤트: 연준, 한국은행, 달러원, 국채금리\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EB%8B%AC%EB%9F%AC%EC%9B%90\",\"keywords\":[\"연준\",\"한국은행\",\"달러원\",\"국채금리\"],\"rank\":2},{\"title\":\"지수 모멘텀: 코스피200, 신고가, 차익실현, 프로그램 매매\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%A7%80%EC%88%98%20%EB%AA%A8%EB%A9%98%ED%85%80%20%EC%8B%A0%EA%B3%A0%EA%B0%80%20%EC%B0%A8%EC%9D%B5%EC%8B%A4%ED%98%84%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EB%A7%A4%EB%A7%A4\",\"keywords\":[\"코스피200\",\"신고가\",\"차익실현\",\"프로그램 매매\"],\"rank\":3},{\"title\":\"변동성/옵션 이벤트: VKOSPI, 옵션만기, 변동성, 이벤트 리스크\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20VKOSPI%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%98%B5%EC%85%98%EB%A7%8C%EA%B8%B0%20%EB%B3%80%EB%8F%99%EC%84%B1%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EB%A6%AC%EC%8A%A4%ED%81%AC\",\"keywords\":[\"VKOSPI\",\"옵션만기\",\"변동성\",\"이벤트 리스크\"],\"rank\":4},{\"title\":\"대외 리스크: 미국 증시, 중국 경기, 관세, 지정학\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%AF%B8%EA%B5%AD%20%EC%A6%9D%EC%8B%9C%20%EC%A4%91%EA%B5%AD%20%EA%B2%BD%EA%B8%B0%20%EA%B4%80%EC%84%B8%20%EC%A7%80%EC%A0%95%ED%95%99%20%EB%A6%AC%EC%8A%A4%ED%81%AC\",\"keywords\":[\"미국 증시\",\"중국 경기\",\"관세\",\"지정학\"],\"rank\":5}],\"reports\":[{\"title\":\"시장전략 컨센서스: 운용전략, 코스피 전망, 상단/하단, 리스크\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9A%B4%EC%9A%A9%EC%A0%84%EB%9E%B5%20%EC%BD%94%EC%8A%A4%ED%94%BC%20%EC%A0%84%EB%A7%9D%20%EC%83%81%EB%8B%A8%20%ED%95%98%EB%8B%A8%20%EB%A6%AC%EC%8A%A4%ED%81%AC\",\"keywords\":[\"운용전략\",\"코스피 전망\",\"상단/하단\",\"리스크\"],\"source\":\"전략 리포트 검색\",\"rank\":1},{\"title\":\"반도체 이익전망: 반도체, AI, 이익전망, 목표주가\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%9D%B4%EC%9D%B5%EC%A0%84%EB%A7%9D%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4\",\"keywords\":[\"반도체\",\"AI\",\"이익전망\",\"목표주가\"],\"source\":\"업종 리포트 검색\",\"rank\":2},{\"title\":\"금리/환율 시나리오: 금리, 환율, 연준, 한국은행\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EC%BD%94%EC%8A%A4%ED%94%BC\",\"keywords\":[\"금리\",\"환율\",\"연준\",\"한국은행\"],\"source\":\"매크로 리포트 검색\",\"rank\":3},{\"title\":\"외국인/기관 수급: 외국인, 기관, 선물, 프로그램\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EC%99%B8%EA%B5%AD%EC%9D%B8%20%EA%B8%B0%EA%B4%80%20%EC%88%98%EA%B8%89%20%EC%84%A0%EB%AC%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EC%BD%94%EC%8A%A4%ED%94%BC200\",\"keywords\":[\"외국인\",\"기관\",\"선물\",\"프로그램\"],\"source\":\"수급 리포트 검색\",\"rank\":4},{\"title\":\"변동성/파생 포지션: VKOSPI, 옵션, 만기, 헤지\",\"date\":\"2026-06-10\",\"url\":\"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20VKOSPI%20%EC%98%B5%EC%85%98%20%EB%A7%8C%EA%B8%B0%20%ED%97%A4%EC%A7%80%20%EC%BD%94%EC%8A%A4%ED%94%BC200\",\"keywords\":[\"VKOSPI\",\"옵션\",\"만기\",\"헤지\"],\"source\":\"변동성 리포트 검색\",\"rank\":5}],\"events\":[],\"state\":{\"bias\":\"강세\",\"volatility\":\"보통\",\"eventRisk\":\"높음\",\"conviction\":\"보통\",\"rationale\":[\"최근 1개월 KOSPI200 변화율은 +5.6%이며, 1주 변화율은 +2.1%입니다.\",\"20일 실현변동성 추정치는 +24.8%로 읽히며, 현재 변동성 레짐은 보통으로 분류했습니다.\",\"헤드라인 신호는 강세 1, 약세 3, 이벤트/변동성 3건으로 집계했습니다.\"],\"signalCounts\":{\"bull\":1,\"bear\":3,\"vol\":3}},\"headlineCommentary\":[\"헤드라인 묶음의 중심 톤은 강세 쪽이며, 현재 확신도는 보통 수준으로 해석했습니다.\",\"최근 1개월 +5.6% 흐름과 1주 +2.1% 변화율을 함께 보면, 단기 모멘텀은 위쪽으로 기울어 있습니다.\",\"변동성 신호는 3건으로 집계되어, 시장이 방향 자체보다 이벤트 경로와 속도에 민감한 상태로 읽힙니다.\",\"약세 키워드가 더 많아, 긴축·차익실현·지정학 리스크가 헤드라인의 주도 서사로 읽힙니다.\",\"따라서 단순한 방향 베팅 하나보다, 현재 레짐에 맞는 손실 구조와 변동성 노출을 함께 보는 전략 선택이 중요합니다.\",\"오늘 묶은 5개 헤드라인은 모두 같은 결론을 말하진 않지만, 공통적으로 '추세는 남아 있고 이벤트 민감도도 높다'는 메시지를 줍니다.\"],\"reportCommentary\":[\"증권사 운용전략 헤드라인은 뉴스보다 문장이 덜 급하지만, 실제로는 포지션 추천의 결을 더 직접적으로 드러내는 경우가 많습니다.\",\"현재 묶음에서는 중립적 선별 대응 쪽 메시지가 상대적으로 더 자주 보입니다.\",\"시장 상태 기준으로는 강세 해석이 우세하고, 최근 1개월 +5.6% 흐름을 감안하면 리포트도 추세 추종과 레짐 점검을 함께 요구하는 구간으로 읽힙니다.\",\"반도체와 AI 관련 표현이 포함되어 있어, 실제 수급과 지수 기여도가 큰 대형주 모멘텀이 리포트의 핵심 배경 중 하나로 보입니다.\",\"금리와 환율, 중앙은행 이벤트 언급이 섞여 있어 방향성 자체보다 할인율 변화와 외국인 수급 경로를 함께 봐야 하는 장세라는 신호가 보입니다.\",\"변동성·불확실성 키워드가 반복되면, 단순 상방 추정이 맞더라도 프리미엄 구조와 손실 한도 설계가 더 중요해집니다.\",\"따라서 이 섹션은 뉴스보다 한 단계 정제된 컨센서스 확인용으로 보고, 최종 전략 선택은 헤드라인 신호와 함께 교차 검증하는 용도로 쓰는 편이 좋습니다.\"],\"recommendations\":{\"top\":[{\"slug\":\"risk-reversal\",\"title\":\"Risk Reversal\",\"category\":\"방향성 전략\",\"bias\":\"bull\",\"vol\":\"mixed\",\"risk\":\"tail\",\"eventFit\":\"high\",\"cost\":\"low\",\"summary\":\"강한 강세 뷰를 프리미엄 절감형으로 표현하지만 하단 tail risk를 안습니다.\",\"score\":92,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\",\"가까운 거시 이벤트를 감안해 이벤트 적합도가 높은 구조를 우대했습니다.\"],\"cautions\":[]},{\"slug\":\"collar\",\"title\":\"Collar\",\"category\":\"헤지 전략\",\"bias\":\"bull\",\"vol\":\"mixed\",\"risk\":\"defined\",\"eventFit\":\"high\",\"cost\":\"low\",\"summary\":\"상방 일부를 포기하고 하단을 방어하는 보수형 구조입니다.\",\"score\":92,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\",\"가까운 거시 이벤트를 감안해 이벤트 적합도가 높은 구조를 우대했습니다.\"],\"cautions\":[]},{\"slug\":\"call-backspread\",\"title\":\"Call Backspread\",\"category\":\"변동성 매수 전략\",\"bias\":\"bull\",\"vol\":\"buy\",\"risk\":\"defined\",\"eventFit\":\"high\",\"cost\":\"medium\",\"summary\":\"급등과 변동성 확대에 유리한 상방 볼록성 구조입니다.\",\"score\":84,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\",\"가까운 거시 이벤트를 감안해 이벤트 적합도가 높은 구조를 우대했습니다.\"],\"cautions\":[]}],\"watchlist\":[{\"slug\":\"call-calendar-spread\",\"title\":\"Call Calendar Spread\",\"category\":\"만기 구조 전략\",\"bias\":\"bull\",\"vol\":\"mixed\",\"risk\":\"defined\",\"eventFit\":\"medium\",\"cost\":\"medium\",\"summary\":\"완만한 강세와 시간가치 차이를 동시에 활용하는 구조입니다.\",\"score\":82,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\"],\"cautions\":[]},{\"slug\":\"one-by-two-call-spread\",\"title\":\"1x2 Call Ratio Spread\",\"category\":\"비대칭 Ratio\",\"bias\":\"bull\",\"vol\":\"mixed\",\"risk\":\"tail\",\"eventFit\":\"medium\",\"cost\":\"low\",\"summary\":\"상승 목표구간에는 효율적이지만 상단 과속 시 리스크가 커집니다.\",\"score\":82,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\"],\"cautions\":[]},{\"slug\":\"bull-call-spread\",\"title\":\"Bull Call Spread\",\"category\":\"방향성 전략\",\"bias\":\"bull\",\"vol\":\"buy\",\"risk\":\"defined\",\"eventFit\":\"medium\",\"cost\":\"medium\",\"summary\":\"완만한 상승과 정의된 손실을 동시에 추구하는 기본 강세 구조입니다.\",\"score\":74,\"reasons\":[\"시장 방향 해석이 강세 쪽으로 기울어 있습니다.\"],\"cautions\":[]}],\"avoided\":[{\"slug\":\"one-by-two-put-spread\",\"title\":\"1x2 Put Ratio Spread\",\"category\":\"비대칭 Ratio\",\"bias\":\"bear\",\"vol\":\"mixed\",\"risk\":\"tail\",\"eventFit\":\"medium\",\"cost\":\"low\",\"summary\":\"하락 목표구간에 효율적이지만 급락 tail risk가 존재합니다.\",\"score\":38,\"reasons\":[],\"cautions\":[\"현재 방향 해석과 반대편 구조입니다.\"]},{\"slug\":\"bear-put-spread\",\"title\":\"Bear Put Spread\",\"category\":\"방향성 전략\",\"bias\":\"bear\",\"vol\":\"buy\",\"risk\":\"defined\",\"eventFit\":\"medium\",\"cost\":\"medium\",\"summary\":\"완만한 하락에 맞는 약세 기본 구조로, 손실은 제한되고 방향성은 선명합니다.\",\"score\":30,\"reasons\":[],\"cautions\":[\"현재 방향 해석과 반대편 구조입니다.\"]},{\"slug\":\"bear-call-spread\",\"title\":\"Bear Call Spread\",\"category\":\"방향성 전략\",\"bias\":\"bear\",\"vol\":\"sell\",\"risk\":\"defined\",\"eventFit\":\"low\",\"cost\":\"credit\",\"summary\":\"상방이 제한될 것이라는 뷰에 맞는 크레딧형 약세 구조입니다.\",\"score\":22,\"reasons\":[],\"cautions\":[\"현재 방향 해석과 반대편 구조입니다.\",\"이벤트 직전에는 해당 구조의 손익경로 리스크가 큽니다.\"]}]},\"meta\":{\"generatedAt\":\"2026-06-11 18:00 KST\",\"live\":false,\"notes\":[\"파일럿 단계에서는 지수 레벨, 20일 실현변동성, 공개 헤드라인 신호를 결합해 전략을 점수화합니다.\",\"증권사 리포트 View는 네이버 증권 운용전략 헤드라인 기준의 파일럿 구조이며, 접근 불가 시 준비된 샘플로 대체됩니다.\",\"표시되는 KOSPI200 레벨은 현재 Playbook 전략 체계와 같은 기준으로 맞춰진 지수 레벨입니다.\",\"실전 적용 전에는 옵션 이론가, 당일 이벤트, 포지션 한도를 별도로 재검토해야 합니다.\"]}};\n    const LIVE_MODE = true;\n    const REFRESH_MS = 15 * 60 * 1000;\n\n    function fmtPct(value) {\n      const sign = value > 0 ? \"+\" : \"\";\n      return sign + Number(value).toFixed(1) + \"%\";\n    }\n\n    function classFor(value) {\n      return value > 0 ? \"positive\" : value < 0 ? \"negative\" : \"neutral\";\n    }\n\n    function stateTone(label, value) {\n      if (label === \"방향\") {\n        if (value === \"강세\") return \"state-bull\";\n        if (value === \"약세\") return \"state-bear\";\n        return \"state-neutral\";\n      }\n      if (label === \"변동성\") {\n        if (value === \"높음\") return \"state-vol-high\";\n        if (value === \"낮음\") return \"state-vol-low\";\n        return \"state-vol-mid\";\n      }\n      if (label === \"이벤트 리스크\") {\n        return value === \"높음\" ? \"state-risk-high\" : \"state-risk-mid\";\n      }\n      if (label === \"확신도\") {\n        if (value === \"높음\") return \"state-conviction-high\";\n        if (value === \"낮음\") return \"state-conviction-low\";\n        return \"state-conviction-mid\";\n      }\n      return \"\";\n    }\n\n    function render(snapshot) {\n      document.getElementById(\"marketAsOf\").textContent = '기준 ' + (snapshot.market.asOfTime || snapshot.market.asOfDate || snapshot.meta.generatedAt?.slice(0, 16) || '-');\n      const marketGrid = document.getElementById(\"marketGrid\");\n      marketGrid.innerHTML = [\n        [\"KOSPI200\", Number(snapshot.market.spot).toFixed(2)],\n        [\"1D\", '<span class=\"' + classFor(snapshot.market.change1d) + '\">' + fmtPct(snapshot.market.change1d) + '</span>'],\n        [\"1W\", '<span class=\"' + classFor(snapshot.market.change5d) + '\">' + fmtPct(snapshot.market.change5d) + '</span>'],\n        [\"20D RV\", fmtPct(snapshot.market.realizedVol20)]\n      ].map(([k, v]) => '<div class=\"mini-card\"><b>' + k + '</b><span>' + v + '</span></div>').join(\"\");\n\n      document.getElementById(\"stateGrid\").innerHTML = [\n        [\"방향\", snapshot.state.bias],\n        [\"변동성\", snapshot.state.volatility],\n        [\"이벤트 리스크\", snapshot.state.eventRisk],\n        [\"확신도\", snapshot.state.conviction]\n      ].map(([k, v]) => '<div class=\"badge-card ' + stateTone(k, v) + '\"><b>' + k + '</b><span>' + v + '</span></div>').join(\"\");\n\n      document.getElementById(\"headlineCommentary\").innerHTML = '<div class=\"news-item commentary-tile\"><b>공통 메시지</b>' + snapshot.headlineCommentary.map(text => '<div class=\"commentary-line\">' + text + '</div>').join('') + '</div>';\n      document.getElementById(\"reportCommentary\").innerHTML = '<div class=\"news-item commentary-tile\"><b>공통 메시지</b>' + (snapshot.reportCommentary || []).map(text => '<div class=\"commentary-line\">' + text + '</div>').join('') + '</div>';\n\n      document.getElementById(\"strategyList\").innerHTML = snapshot.recommendations.top.map((item, idx) => {\n        const reasons = item.reasons.map(text => '<li>' + text + '</li>').join(\"\");\n        const cautions = item.cautions.length ? '<ul class=\"bullets\">' + item.cautions.map(text => '<li>' + text + '</li>').join(\"\") + '</ul>' : '';\n        return '<article class=\"strategy-card\">' +\n          '<div class=\"strategy-head\"><div><h4>' + (idx + 1) + '. ' + item.title + '</h4><div class=\"sub\">' + item.category + ' | ' + item.slug + '</div></div><div class=\"score\">' + item.score + '점</div></div>' +\n          '<p class=\"summary\">' + item.summary + '</p>' +\n          '<ul class=\"bullets\">' + reasons + '</ul>' +\n          cautions +\n          '<div class=\"cta-row\"><a class=\"secondary\" href=\"https://bitter-morning-77fd.jager001.workers.dev#strategy/' + item.slug + '\" target=\"_blank\" rel=\"noreferrer\">전략 상세 보기</a></div>' +\n        '</article>';\n      }).join(\"\");\n\n      document.getElementById(\"rationaleList\").innerHTML = '<div class=\"news-item commentary-tile\"><b>핵심 해석</b>' + snapshot.state.rationale.map(text => '<div class=\"commentary-line\">' + text + '</div>').join('') + '</div>';\n      document.getElementById(\"watchList\").innerHTML = snapshot.recommendations.watchlist.map(item => '<div class=\"news-item\"><b>' + item.title + '</b><div>' + item.summary + '</div></div>').join(\"\");\n      document.getElementById(\"avoidList\").innerHTML = snapshot.recommendations.avoided.map(item => '<div class=\"news-item\"><b>' + item.title + '</b><div>' + (item.cautions[0] || item.summary) + '</div></div>').join(\"\");\n      document.getElementById(\"newsList\").innerHTML = snapshot.headlines.map((item, idx) => '<div class=\"news-item\"><b>' + (idx + 1) + '. ' + (item.url ? ('<a href=\"' + item.url + '\" target=\"_blank\" rel=\"noreferrer\">' + item.title + '</a>') : item.title) + '</b><div class=\"sub\">검색기준 ' + (item.date || '-') + (item.keywords ? (' · 키워드 ' + item.keywords.join(' · ')) : '') + '</div></div>').join(\"\");\n      document.getElementById(\"reportList\").innerHTML = (snapshot.reports || []).map((item, idx) => '<div class=\"news-item\"><b>' + (idx + 1) + '. ' + (item.url ? ('<a href=\"' + item.url + '\" target=\"_blank\" rel=\"noreferrer\">' + item.title + '</a>') : item.title) + '</b><div class=\"sub\"><span class=\"source-tag\">' + (item.source || '리포트 검색') + '</span>검색기준 ' + (item.date || '-') + (item.keywords ? (' · 키워드 ' + item.keywords.join(' · ')) : '') + '</div></div>').join(\"\");\n\n      document.getElementById(\"opsNotes\").innerHTML = snapshot.meta.notes.map(text => '<div class=\"news-item\"><b>운영 노트</b><div>' + text + '</div></div>').join(\"\");\n    }\n\n    async function refreshLive() {\n      if (!LIVE_MODE) return;\n      try {\n        const response = await fetch('/api/advisor?ts=' + Date.now(), { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });\n        if (!response.ok) throw new Error('live fetch failed');\n        const data = await response.json();\n        render(data);\n      } catch (error) {\n        render(BOOTSTRAP);\n      }\n    }\n\n    document.getElementById(\"refreshButton\").addEventListener(\"click\", refreshLive);\n    render(BOOTSTRAP);\n    if (LIVE_MODE) {\n      refreshLive();\n      setInterval(refreshLive, REFRESH_MS);\n    }\n  </script>\n</body>\n</html>";

function normalizeHeadline(title) {
  return title
    .replace(/\s+-\s+Reuters.*$/i, "")
    .replace(/\s+-\s+MarketWatch.*$/i, "")
    .replace(/\s+-\s+Bloomberg.*$/i, "")
    .trim();
}
function tallySignals(headlines) {
  const bullWords = ["rally", "surge", "gain", "record", "ai", "semiconductor", "chip", "outperform", "buying", "rebound", "optimism", "외국인", "반도체", "상승", "랠리", "삼성전자", "sk하이닉스", "hbm", "수급", "실적", "회복", "강세"];
  const bearWords = ["selloff", "drop", "slump", "tariff", "tightening", "hawkish", "downturn", "war", "miss", "fall", "decline", "급락", "긴축", "하락", "관세", "차익실현", "환율", "달러", "경계", "둔화", "조정", "약세"];
  const volWords = ["volatility", "uncertainty", "fomc", "cpi", "rate", "bank of korea", "election", "shock", "earnings", "event", "변동성", "금리", "지정학", "한국은행", "연준", "물가", "이벤트", "리스크", "옵션만기"];
  let bull = 0;
  let bear = 0;
  let vol = 0;
  for (const raw of headlines) {
    const title = (typeof raw === "string" ? raw : raw.title || "").toLowerCase();
    bull += bullWords.some(word => title.includes(word.toLowerCase())) ? 1 : 0;
    bear += bearWords.some(word => title.includes(word.toLowerCase())) ? 1 : 0;
    vol += volWords.some(word => title.includes(word.toLowerCase())) ? 1 : 0;
  }
  return { bull, bear, vol };
}
function daysUntil(dateStr, now = new Date()) {
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.ceil((target - now) / 86400000);
}
function nextMacroEvents(now = new Date()) {
  const items = [
    ...FOMC_DATES.map(date => ({ type: "FOMC", date })),
    ...BOK_DATES.map(date => ({ type: "BOK", date }))
  ]
    .map(item => ({ ...item, dte: daysUntil(item.date, now) }))
    .filter(item => item.dte >= 0)
    .sort((a, b) => a.dte - b.dte);
  return items.slice(0, 4);
}
function formatPct(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(1)}%`;
}
function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}
function deriveState(market, headlines, events) {
  const signals = tallySignals(headlines);
  let biasScore = 0;
  biasScore += market.change21d >= 4 ? 2 : market.change21d <= -4 ? -2 : 0;
  biasScore += market.change5d >= 1.5 ? 1 : market.change5d <= -1.5 ? -1 : 0;
  biasScore += Math.min(2, signals.bull) - Math.min(2, signals.bear);
  const bias = biasScore >= 2 ? "강세" : biasScore <= -2 ? "약세" : "중립";

  let volScore = 0;
  volScore += market.realizedVol20 >= 30 ? 2 : market.realizedVol20 >= 22 ? 1 : 0;
  volScore += signals.vol >= 2 ? 1 : 0;
  const volatility = volScore >= 3 ? "높음" : volScore >= 1 ? "보통" : "낮음";

  const imminentEvent = events.some(event => event.dte <= 7);
  const eventRisk = imminentEvent || signals.vol >= 2 ? "높음" : "보통";

  const conviction = Math.abs(biasScore) >= 3 ? "높음" : Math.abs(biasScore) >= 2 ? "보통" : "낮음";

  const rationales = [];
  rationales.push(`최근 1개월 KOSPI200 변화율은 ${formatPct(market.change21d)}이며, 1주 변화율은 ${formatPct(market.change5d)}입니다.`);
  rationales.push(`20일 실현변동성 추정치는 ${formatPct(market.realizedVol20)}로 읽히며, 현재 변동성 레짐은 ${volatility}으로 분류했습니다.`);
  if (signals.bull || signals.bear || signals.vol) {
    rationales.push(`헤드라인 신호는 강세 ${signals.bull}, 약세 ${signals.bear}, 이벤트/변동성 ${signals.vol}건으로 집계했습니다.`);
  }
  if (events.length) {
    rationales.push(`가장 가까운 거시 이벤트는 ${events[0].type} (${events[0].date}, D-${events[0].dte})입니다.`);
  }

  return {
    bias,
    volatility,
    eventRisk,
    conviction,
    rationale: rationales,
    signalCounts: signals
  };
}
function buildHeadlineCommentary(market, state, headlines, events) {
  const comments = [];
  comments.push(`헤드라인 묶음의 중심 톤은 ${state.bias} 쪽이며, 현재 확신도는 ${state.conviction} 수준으로 해석했습니다.`);
  comments.push(`최근 1개월 ${formatPct(market.change21d)} 흐름과 1주 ${formatPct(market.change5d)} 변화율을 함께 보면, 단기 모멘텀은 ${market.change5d >= 0 ? "위쪽" : "아래쪽"}으로 기울어 있습니다.`);
  comments.push(`변동성 신호는 ${state.signalCounts.vol}건으로 집계되어, 시장이 방향 자체보다 이벤트 경로와 속도에 민감한 상태로 읽힙니다.`);
  if (state.signalCounts.bull > state.signalCounts.bear) {
    comments.push(`강세 키워드가 약세 키워드보다 우세해, 반도체·AI·외국인 수급 같은 위험선호 요인이 상대적으로 더 많이 반영됐습니다.`);
  } else if (state.signalCounts.bear > state.signalCounts.bull) {
    comments.push(`약세 키워드가 더 많아, 긴축·차익실현·지정학 리스크가 헤드라인의 주도 서사로 읽힙니다.`);
  } else {
    comments.push(`강세와 약세 신호가 비슷하게 섞여 있어, 뚜렷한 컨센서스보다는 혼조 장세 해석이 더 자연스럽습니다.`);
  }
  if (events.length) {
    comments.push(`가장 가까운 이벤트는 ${events[0].type} (${events[0].date}, D-${events[0].dte})로, 실제 손익은 방향 적중 여부보다 이벤트 전후 변동성 반응에 더 크게 좌우될 수 있습니다.`);
  }
  comments.push(`따라서 단순한 방향 베팅 하나보다, 현재 레짐에 맞는 손실 구조와 변동성 노출을 함께 보는 전략 선택이 중요합니다.`);
  if (headlines.length >= 5) {
    comments.push(`오늘 묶은 ${headlines.length}개 헤드라인은 모두 같은 결론을 말하진 않지만, 공통적으로 '추세는 남아 있고 이벤트 민감도도 높다'는 메시지를 줍니다.`);
  }
  return comments.slice(0, 7);
}
function normalizeHeadlineItems(headlines) {
  return headlines.map((item, index) => {
    if (typeof item === "string") {
      return { title: normalizeHeadline(item), date: null, url: null, rank: index + 1 };
    }
    return {
      title: normalizeHeadline(item.title || ""),
      date: item.date || null,
      url: item.url || null,
      keywords: item.keywords || null,
      rank: index + 1
    };
  });
}
async function resolveHeadlineLinks(items) {
  return await Promise.all((items || []).map(async item => {
    try {
      const response = await fetch(item.url, { redirect: "follow", cf: { cacheTtl: 300, cacheEverything: true } });
      const finalUrl = response?.url && !/news\\.google\\.com/i.test(response.url) ? response.url : item.url;
      return { ...item, url: finalUrl };
    } catch {
      return item;
    }
  }));
}
function normalizeReportItems(reports) {
  return (reports || []).map((item, index) => {
    if (typeof item === "string") {
      return { title: normalizeHeadline(item), date: null, url: null, source: "리포트", rank: index + 1 };
    }
    return {
      title: normalizeHeadline(item.title || ""),
      date: item.date || null,
      url: item.url || null,
      keywords: item.keywords || null,
      source: item.source || "리포트",
      rank: index + 1
    };
  });
}
function buildReportCommentary(market, state, reports, events) {
  const comments = [];
  const titles = reports.map(item => item.title).join(" | ");
  const hasSemi = /반도체|AI|삼성전자|SK\s*하이닉스/i.test(titles);
  const hasRates = /금리|FOMC|연준|한국은행|달러|환율/i.test(titles);
  const hasRisk = /변동성|불확실성|리스크|관세|지정학|경계/i.test(titles);
  const bullishCount = reports.filter(item => /상승|반등|랠리|회복|확대|강세|매수/i.test(item.title)).length;
  const bearishCount = reports.filter(item => /하락|조정|둔화|긴축|경계|약세|매도/i.test(item.title)).length;

  comments.push(`증권사 운용전략 헤드라인은 뉴스보다 문장이 덜 급하지만, 실제로는 포지션 추천의 결을 더 직접적으로 드러내는 경우가 많습니다.`);
  comments.push(`현재 묶음에서는 ${bullishCount > bearishCount ? "상방 기회" : bullishCount < bearishCount ? "방어와 경계" : "중립적 선별 대응"} 쪽 메시지가 상대적으로 더 자주 보입니다.`);
  comments.push(`시장 상태 기준으로는 ${state.bias} 해석이 우세하고, 최근 1개월 ${formatPct(market.change21d)} 흐름을 감안하면 리포트도 추세 추종과 레짐 점검을 함께 요구하는 구간으로 읽힙니다.`);
  if (hasSemi) {
    comments.push(`반도체와 AI 관련 표현이 포함되어 있어, 실제 수급과 지수 기여도가 큰 대형주 모멘텀이 리포트의 핵심 배경 중 하나로 보입니다.`);
  }
  if (hasRates) {
    comments.push(`금리와 환율, 중앙은행 이벤트 언급이 섞여 있어 방향성 자체보다 할인율 변화와 외국인 수급 경로를 함께 봐야 하는 장세라는 신호가 보입니다.`);
  }
  if (hasRisk) {
    comments.push(`변동성·불확실성 키워드가 반복되면, 단순 상방 추정이 맞더라도 프리미엄 구조와 손실 한도 설계가 더 중요해집니다.`);
  }
  if (events.length) {
    comments.push(`가까운 거시 이벤트 ${events[0].type} (${events[0].date}) 전후에는 리포트 문구가 낙관적으로 보여도 실제 옵션 손익은 변동성 재평가에 크게 흔들릴 수 있습니다.`);
  }
  comments.push(`따라서 이 섹션은 뉴스보다 한 단계 정제된 컨센서스 확인용으로 보고, 최종 전략 선택은 헤드라인 신호와 함께 교차 검증하는 용도로 쓰는 편이 좋습니다.`);
  return comments.slice(0, 7);
}
function stateTone(label, value) {
  if (label === "방향") {
    if (value === "강세") return "state-bull";
    if (value === "약세") return "state-bear";
    return "state-neutral";
  }
  if (label === "변동성") {
    if (value === "높음") return "state-vol-high";
    if (value === "낮음") return "state-vol-low";
    return "state-vol-mid";
  }
  if (label === "이벤트 리스크") {
    return value === "높음" ? "state-risk-high" : "state-risk-mid";
  }
  if (label === "확신도") {
    if (value === "높음") return "state-conviction-high";
    if (value === "낮음") return "state-conviction-low";
    return "state-conviction-mid";
  }
  return "";
}
function scoreStrategy(profile, state) {
  let score = 50;
  const reasons = [];
  const cautions = [];

  if (state.bias === "강세") {
    if (profile.bias === "bull") { score += 24; reasons.push("시장 방향 해석이 강세 쪽으로 기울어 있습니다."); }
    if (profile.bias === "bear") { score -= 20; cautions.push("현재 방향 해석과 반대편 구조입니다."); }
    if (profile.bias === "neutral") { score += state.volatility === "높음" ? 8 : -2; }
  }
  if (state.bias === "약세") {
    if (profile.bias === "bear") { score += 24; reasons.push("시장 방향 해석이 약세 쪽으로 기울어 있습니다."); }
    if (profile.bias === "bull") { score -= 20; cautions.push("현재 방향 해석과 반대편 구조입니다."); }
    if (profile.bias === "neutral") { score += state.volatility === "높음" ? 8 : -2; }
  }
  if (state.bias === "중립") {
    if (profile.bias === "neutral") { score += 20; reasons.push("방향성이 약할수록 레인지형 구조가 유리합니다."); }
    if (profile.bias !== "neutral") { score -= 6; cautions.push("방향 확신이 낮아 노출이 선명한 구조는 점수를 낮췄습니다."); }
  }

  if (state.volatility === "높음") {
    if (profile.vol === "buy") { score += 18; reasons.push("높은 변동성/이벤트 구간에는 롱 볼 구조가 유리합니다."); }
    if (profile.vol === "sell") { score -= 14; cautions.push("높은 변동성 국면에서 숏 프리미엄 구조는 보수적으로 봤습니다."); }
  } else if (state.volatility === "낮음") {
    if (profile.vol === "sell") { score += 14; reasons.push("낮은 변동성에서는 시간가치 수취 구조가 더 효율적입니다."); }
    if (profile.vol === "buy") { score -= 10; cautions.push("변동성 매수 구조는 현재 레짐에 비해 비효율적일 수 있습니다."); }
  } else {
    if (profile.vol === "mixed") score += 8;
  }

  if (state.eventRisk === "높음") {
    if (profile.eventFit === "high") { score += 10; reasons.push("가까운 거시 이벤트를 감안해 이벤트 적합도가 높은 구조를 우대했습니다."); }
    if (profile.eventFit === "low") { score -= 8; cautions.push("이벤트 직전에는 해당 구조의 손익경로 리스크가 큽니다."); }
  }

  if (state.conviction === "낮음") {
    if (profile.risk === "defined") { score += 8; reasons.push("확신이 낮은 국면에서는 최대손실이 정의된 구조를 우대했습니다."); }
    if (profile.risk === "tail") { score -= 10; cautions.push("확신이 낮은 상태에서 tail risk 구조는 보수적으로 제외했습니다."); }
  }

  if (profile.cost === "credit" && state.volatility === "높음") cautions.push("프리미엄 수취 구조는 변동성 확대 지속 시 불리해질 수 있습니다.");
  if (profile.cost === "high" && state.volatility === "낮음") cautions.push("진입 프리미엄 부담이 현재 레짐 대비 클 수 있습니다.");

  return {
    ...profile,
    score: Math.max(0, Math.min(100, score)),
    reasons: uniqueList(reasons).slice(0, 3),
    cautions: uniqueList(cautions).slice(0, 2)
  };
}
function buildRecommendations(state) {
  const scored = STRATEGY_CATALOG.map(profile => scoreStrategy(profile, state)).sort((a, b) => b.score - a.score);
  return {
    top: scored.slice(0, 3),
    watchlist: scored.slice(3, 6),
    avoided: scored.slice(-3)
  };
}

function buildSnapshot({ market, headlines, reports, live, notes, generatedAt }) {
  const headlineItems = normalizeHeadlineItems(headlines);
  const reportItems = normalizeReportItems(reports);
  const events = nextMacroEvents(new Date(generatedAt));
  const state = deriveState(market, headlineItems, events);
  const recommendations = buildRecommendations(state);
  const headlineCommentary = buildHeadlineCommentary(market, state, headlineItems, events);
  const reportCommentary = buildReportCommentary(market, state, reportItems, events);
  return { market, headlines: headlineItems, reports: reportItems, events, state, headlineCommentary, reportCommentary, recommendations, meta: { generatedAt, live, notes } };
}

function formatDateUtc(date) {
  return date.toISOString().slice(0, 10);
}

function previousBusinessDateKst(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - 1);
  while (kst.getUTCDay() === 0 || kst.getUTCDay() === 6) {
    kst.setUTCDate(kst.getUTCDate() - 1);
  }
  return formatDateUtc(kst);
}

function buildMarketFromDailySeries(series, targetDate, source) {
  const rows = series
    .filter(row => Number.isFinite(row.close) && row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 22) throw new Error("insufficient daily closes");
  let selectedIndex = -1;
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].date <= targetDate) selectedIndex = index;
  }
  if (selectedIndex < 21) throw new Error("insufficient closes before target date");
  const latest = rows[selectedIndex];
  const prev = rows[selectedIndex - 1];
  const week = rows[selectedIndex - 5];
  const month = rows[selectedIndex - 21];
  const returns = [];
  for (let i = selectedIndex - 19; i <= selectedIndex; i += 1) {
    returns.push(Math.log(rows[i].close / rows[i - 1].close));
  }
  const mean = returns.reduce((sum, x) => sum + x, 0) / returns.length;
  const variance = returns.reduce((sum, x) => sum + (x - mean) ** 2, 0) / Math.max(returns.length - 1, 1);
  const scale = latest.close < 800 ? PLAYBOOK_SCALE : 1;
  return {
    asOfDate: latest.date,
    asOfTime: latest.date + " 종가 기준",
    targetDate,
    source,
    spot: Number((latest.close * scale).toFixed(2)),
    change1d: Number((((latest.close / prev.close) - 1) * 100).toFixed(1)),
    change5d: Number((((latest.close / week.close) - 1) * 100).toFixed(1)),
    change21d: Number((((latest.close / month.close) - 1) * 100).toFixed(1)),
    realizedVol20: Number((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(1)),
    dataPolicy: "previous-business-day-close"
  };
}

function parseYahooDailyChart(payload, targetDate) {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const rawCloses = result?.indicators?.quote?.[0]?.close || [];
  const series = rawCloses.map((close, index) => ({
    close,
    date: Number.isFinite(timestamps[index]) ? new Date(timestamps[index] * 1000).toISOString().slice(0, 10) : null
  }));
  return buildMarketFromDailySeries(series, targetDate, "Yahoo Finance ^KS200 daily close");
}

function parseNaverKpi200Rows(html) {
  return html.split('class="date"').slice(1)
    .map(block => {
      const dateMatch = block.match(/>[^0-9]*([0-9.]+)/);
      const numberMatch = block.match(/class=["']number_1["'][^>]*>[^0-9.-]*([0-9,.-]+)/);
      return {
        date: dateMatch ? dateMatch[1].split(".").filter(Boolean).join("-") : null,
        close: numberMatch ? Number(numberMatch[1].replace(/,/g, "")) : NaN
      };
    })
    .filter(row => row.date && Number.isFinite(row.close));
}

async function fetchNaverKpi200Daily(targetDate) {
  const series = [];
  for (let page = 1; page <= 8; page += 1) {
    const response = await fetch("https://finance.naver.com/sise/sise_index_day.naver?code=KPI200&page=" + page + "&v=" + encodeURIComponent(targetDate), {
      headers: { "cache-control": "no-cache", "user-agent": "Mozilla/5.0" },
      cf: { cacheTtl: 60, cacheEverything: false }
    });
    if (!response.ok) continue;
    series.push(...parseNaverKpi200Rows(await response.text()));
    if (series.length >= 45 && series.some(row => row.date <= targetDate)) break;
  }
  return buildMarketFromDailySeries(series, targetDate, "Naver Finance KPI200 daily close");
}

async function fetchMarket() {
  const targetDate = previousBusinessDateKst(new Date());
  const yahooUrls = [
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EKS200?interval=1d&range=1y&includePrePost=false",
    "https://query2.finance.yahoo.com/v8/finance/chart/%5EKS200?interval=1d&range=1y&includePrePost=false"
  ];
  for (const url of yahooUrls) {
    try {
      const response = await fetch(url + "&t=" + encodeURIComponent(targetDate), {
        headers: { "cache-control": "no-cache" },
        cf: { cacheTtl: 60, cacheEverything: false }
      });
      if (!response.ok) continue;
      return parseYahooDailyChart(await response.json(), targetDate);
    } catch {}
  }
  try {
    return await fetchNaverKpi200Daily(targetDate);
  } catch {}
  return { ...FALLBACK_MARKET, asOfTime: FALLBACK_MARKET.asOfDate + " 저장 스냅샷", targetDate, stale: true };
}

function googleSearchUrl(query) {
  return "https://www.google.com/search?q=" + encodeURIComponent(query);
}

function buildNewsThemes(date) {
  const themes = [
    { theme: "반도체/AI 수급", keywords: ["삼성전자", "SK하이닉스", "HBM", "외국인 매수"], query: "코스피200 반도체 AI 삼성전자 SK하이닉스 HBM 외국인" },
    { theme: "금리/환율 이벤트", keywords: ["연준", "한국은행", "달러원", "국채금리"], query: "코스피200 금리 환율 연준 한국은행 달러원" },
    { theme: "지수 모멘텀", keywords: ["코스피200", "신고가", "차익실현", "프로그램 매매"], query: "코스피200 지수 모멘텀 신고가 차익실현 프로그램 매매" },
    { theme: "변동성/옵션 이벤트", keywords: ["VKOSPI", "옵션만기", "변동성", "이벤트 리스크"], query: "VKOSPI 코스피200 옵션만기 변동성 이벤트 리스크" },
    { theme: "대외 리스크", keywords: ["미국 증시", "중국 경기", "관세", "지정학"], query: "코스피200 미국 증시 중국 경기 관세 지정학 리스크" }
  ];
  return themes.map(item => ({
    title: item.theme + ": " + item.keywords.join(", "),
    date,
    keywords: item.keywords,
    url: googleSearchUrl(date + " " + item.query)
  }));
}

function buildReportThemes(date) {
  const themes = [
    { source: "전략 리포트 검색", theme: "시장전략 컨센서스", keywords: ["운용전략", "코스피 전망", "상단/하단", "리스크"], query: "증권사 운용전략 코스피 전망 상단 하단 리스크" },
    { source: "업종 리포트 검색", theme: "반도체 이익전망", keywords: ["반도체", "AI", "이익전망", "목표주가"], query: "증권사 리포트 반도체 AI 이익전망 삼성전자 SK하이닉스" },
    { source: "매크로 리포트 검색", theme: "금리/환율 시나리오", keywords: ["금리", "환율", "연준", "한국은행"], query: "증권사 리포트 금리 환율 연준 한국은행 코스피" },
    { source: "수급 리포트 검색", theme: "외국인/기관 수급", keywords: ["외국인", "기관", "선물", "프로그램"], query: "증권사 리포트 외국인 기관 수급 선물 프로그램 코스피200" },
    { source: "변동성 리포트 검색", theme: "변동성/파생 포지션", keywords: ["VKOSPI", "옵션", "만기", "헤지"], query: "증권사 리포트 VKOSPI 옵션 만기 헤지 코스피200" }
  ];
  return themes.map(item => ({
    source: item.source,
    title: item.theme + ": " + item.keywords.join(", "),
    date,
    keywords: item.keywords,
    url: googleSearchUrl(date + " " + item.query)
  }));
}

function parseRssTitles(xml) {
  return [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)]
    .map(match => ({
      title: normalizeHeadline(match[1]),
      url: match[2],
      date: new Date(match[3]).toISOString().slice(0, 10)
    }))
    .filter(Boolean)
    .slice(0, 8);
}

async function fetchHeadlines() {
  const targetDate = previousBusinessDateKst(new Date());
  return buildNewsThemes(targetDate);
}


function decodeHtml(text) {
  return (text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, String.fromCharCode(34))
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNaverResearchItems(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const items = [];
  for (const row of rows) {
    const block = row[1];
    const linkMatch = block.match(/<a[^>]+href="([^"]*market_read\.naver[^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const sourceMatch = block.match(/<td[^>]*class="info"[^>]*>([\s\S]*?)<\/td>/i);
    const dateMatch = block.match(/<td[^>]*class="date"[^>]*>([\s\S]*?)<\/td>/i);
    items.push({
      title: normalizeHeadline(decodeHtml(linkMatch[2])),
      url: linkMatch[1].startsWith("http") ? linkMatch[1] : "https://finance.naver.com" + linkMatch[1],
      source: decodeHtml(sourceMatch?.[1] || "리포트"),
      date: decodeHtml(dateMatch?.[1] || "") || null
    });
  }
  return items.filter(item => item.title).slice(0, 6);
}

async function fetchBrokerReports() {
  const targetDate = previousBusinessDateKst(new Date());
  return buildReportThemes(targetDate);
}


async function buildLiveSnapshot() {
  const [market, headlines, reports] = await Promise.all([fetchMarket(), fetchHeadlines(), fetchBrokerReports()]);
  const notes = [
    market.stale
      ? "시장 데이터 연결 실패로 저장 스냅샷을 표시했습니다. 업데이트 후 기준일 문구를 확인하세요."
      : "시장 데이터는 조회 시점의 직전 영업일 종가 기준으로 KOSPI200 일봉에서 계산합니다.",
    "뉴스와 리포트는 원문 파싱 대신 한국어 테마 키워드와 Google 검색 링크로 제공합니다.",
    "공개 헤드라인 신호가 약하거나 상충하면 최대손실이 정의된 구조에 가중치를 더 줍니다.",
    "검색 링크 방식은 원문 파싱보다 안정적이며, 사용자가 검색 결과에서 최신 원문을 직접 확인하는 구조입니다."
  ];
  return buildSnapshot({
    market,
    headlines,
    reports,
    live: true,
    generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
    notes
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/api/advisor") {
      const data = await buildLiveSnapshot();
      return new Response(JSON.stringify(data), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "access-control-allow-origin": "*"
        }
      });
    }
    return new Response(APP_HTML, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300"
      }
    });
  }
};