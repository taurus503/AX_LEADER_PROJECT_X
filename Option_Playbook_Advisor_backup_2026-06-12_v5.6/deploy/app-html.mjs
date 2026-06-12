export const APP_HTML = String.raw`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Option Playbook Advisor ver 5.7</title>
  <style>
    :root {
      --bg: #050806;
      --panel: #143926;
      --panel-alt: #ef7d21;
      --panel-dark: #0d1510;
      --card: #111714;
      --card-soft: #1a211d;
      --ink: #f5f0e6;
      --muted: #d7cfbf;
      --line: #050505;
      --green: #0fb26f;
      --blue: #79a8ff;
      --orange: #ff7a00;
      --red: #ff5d3d;
      --yellow: #ffd84d;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", "Malgun Gothic", Arial, sans-serif; background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)), var(--bg); color: var(--ink); }
    .app { min-height: 100vh; padding: 24px; display: grid; gap: 22px; }
    .topbar, .panel, .strategy-card, .news-item, .mini-card, .badge-card { border: 3px solid var(--line); box-shadow: none; border-radius: 0; }
    .topbar { padding: 0; display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(300px, .9fr); background: #050505; color: #fff8ef; }
    .hero-copy { padding: 28px; display: grid; gap: 14px; background: #0f4f31; min-height: 248px; }
    .hero-warning { padding: 28px; display: grid; align-content: start; gap: 14px; background: #f67a18; color: #130b05; min-height: 248px; }
    .hero-actions { display:flex; justify-content:flex-start; align-items:center; gap:12px; flex-wrap:wrap; }
    h1 { margin: 0; font-size: clamp(34px, 7vw, 68px); line-height: .9; letter-spacing: 0; font-weight: 950; }
    .topbar p { margin: 0; max-width: 980px; color: #fff3df; line-height: 1.8; font-size: 24px; }
    .warning-title { display: inline-block; width: fit-content; padding: 6px 10px; background: #050505; color: #fff3df; font-size: 14px; font-weight: 950; text-transform: uppercase; }
    .warning-copy { margin: 0; font-size: 23px; line-height: 1.8; font-weight: 850; color: #1b1109; }
    .grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; align-items: start; }
    .panel { padding: 22px; background: var(--panel); color: var(--ink); }
    .panel.theme-orange { background: var(--panel-alt); color: #160d06; }
    .panel.theme-orange .panel-date { background: #1c1109; color: #fff1df; }
    .panel.theme-orange .panel h3 {}
    .panel.theme-orange .mini-card,
    .panel.theme-orange .badge-card,
    .panel.theme-orange .news-item,
    .panel.theme-orange .strategy-card { background: #23160d; color: var(--ink); }
    .panel.theme-green { background: #165236; }
    .panel.theme-dark { background: var(--panel-dark); }
    .panel h2, .panel h3 { margin: 0 0 14px; }
    .panel h2 { font-size: 36px; font-weight: 950; line-height: .98; }
    .panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:14px; }
    .panel-date { display:inline-block; padding:7px 12px; background:#fff3df; border:3px solid var(--line); font-size:16px; font-weight:950; color:#2f2518; }
    .panel h3 { display: inline-block; padding: 5px 10px; background: var(--line); color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 0; font-weight: 950; }
    .market-grid, .state-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
    .mini-card, .badge-card { padding: 18px; background: var(--card); min-height: 128px; color: var(--ink); }
    .mini-card b, .badge-card b { display: block; font-size: 14px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; font-weight: 950; }
    .mini-card span, .badge-card span { font-size: 31px; font-weight: 950; line-height: 1.05; color: var(--ink); }
    .badge-card span { font-size: 29px; }
    .badge-card.state-bull { background: #0f6a43; }
    .badge-card.state-bear { background: #7f2818; }
    .badge-card.state-neutral { background: #8b470d; }
    .badge-card.state-vol-high { background: #8b470d; }
    .badge-card.state-vol-mid { background: #654a1b; }
    .badge-card.state-vol-low { background: #34571d; }
    .badge-card.state-risk-high { background: #99331f; }
    .badge-card.state-risk-mid { background: #734315; }
    .badge-card.state-conviction-high { background: #1f5b3f; }
    .badge-card.state-conviction-mid { background: #3b391f; }
    .badge-card.state-conviction-low { background: #30322f; }
    .positive { color: var(--green); }
    .negative { color: var(--red); }
    .neutral { color: var(--orange); }
    .strategies { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .strategy-card { padding: 20px; background: var(--card); color: var(--ink); min-height: 320px; }
    .strategy-head { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
    .strategy-head h4 { margin: 0; font-size: 29px; line-height: 1.02; font-weight: 950; }
    .score { min-width: 108px; padding: 11px 12px; text-align: right; background: var(--yellow); color: #111; font-weight: 950; font-size: 32px; line-height: .95; border: 3px solid var(--line); }
    .sub { margin-top: 8px; color: var(--muted); font-size: 14px; font-weight: 800; text-transform: uppercase; }
    .summary { margin: 16px 0 0; line-height: 1.8; color: #eee3cf; font-size: 24px; }
    .bullets { margin: 14px 0 0; padding-left: 26px; display: grid; gap: 10px; color: #eee3cf; font-size: 20px; line-height: 1.8; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .cta, .secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 12px 18px; border: 3px solid var(--line); text-decoration: none; color: var(--ink); font-weight: 950; font-size: 18px; }
    .cta { background: var(--yellow); color: #131313; }
    .secondary { background: var(--orange); color: #160d06; }
    .update-button { min-width: 180px; box-shadow: 5px 5px 0 #050505; transition: transform .08s ease, box-shadow .08s ease; }
    .update-button:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 #050505; }
    .update-button:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #050505; }
    .rationale-list, .watch-grid, .news-list { display: grid; gap: 14px; }
    .news-item { padding: 18px; background: var(--card); color: var(--ink); min-height: 132px; display: grid; align-content: start; }
    .news-item b { display: block; margin-bottom: 8px; font-size: 24px; line-height: 1.35; }
    .news-item a { color: #fff7ea; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
    .news-item a:hover { color: var(--yellow); }
    .commentary-tile { display: grid; gap: 10px; min-height: 220px; }
    .commentary-line { color: #f2e6d1; line-height: 1.85; font-size: 23px; }
    .foot { color: var(--muted); font-size: 18px; line-height: 1.8; }
    .source-tag { display:inline-block; margin-right:8px; padding:4px 8px; background: var(--orange); color:#170e06; border:2px solid var(--line); font-size:14px; font-weight:950; text-transform:uppercase; }
    .sub { margin-top: 10px; color: var(--muted); font-size: 18px; font-weight: 850; text-transform: uppercase; line-height: 1.65; }
    .theme-orange .source-tag { background: var(--green); color:#08130d; }
    @media (max-width: 980px) {
      .topbar { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr; }
      .market-grid, .state-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 640px) {
      .app { padding: 12px; gap: 14px; }
      .hero-copy, .hero-warning, .panel, .strategy-card { padding: 14px; min-height: auto; }
      .news-item, .mini-card, .badge-card { min-height: auto; }
      .market-grid, .state-grid { grid-template-columns: 1fr; }
      .strategy-head { flex-direction: column; }
      .score { width: 100%; text-align: left; }
    }
  </style>
</head>
  <body>
  <main class="app">
    <section class="topbar">
      <div class="hero-copy">
        <div class="hero-actions">
          <button class="secondary update-button" id="refreshButton" type="button">?곗씠???낅뜲?댄듃</button>
        </div>
        <h1>Option Playbook Advisor</h1>
        <p>?꾩옱 KOSPI200 ?덈꺼, 異붿젙 蹂?숈꽦, 怨듦컻 ?댁뒪 ?ㅻ뱶?쇱씤怨??덉젙 ?대깽?몃? 寃고빀???ㅻ뒛 媛???곹빀???듭뀡 ?⑹꽦?꾨왂 9媛쒖? ?쇳빐?????꾨왂 6媛쒕? ?④퍡 鍮꾧탳?⑸땲??</p>
      </div>
      <aside class="hero-warning">
        <span class="warning-title">Important</span>
        <p class="warning-copy">??Advisor??怨듦컻 ?쒖옣 ?곗씠?곗? ?ㅻ뱶?쇱씤, 洹쒖튃 湲곕컲 ?댁꽍??寃고빀??李멸퀬???꾧뎄?낅땲?? ?ㅼ젣 ?ъ옄 ?먮떒怨??먯씡 梨낆엫? ?꾩쟻?쇰줈 蹂몄씤?먭쾶 ?덉쑝硫? ?ㅼ쟾 ?곸슜 ?꾩뿉???듭뀡 ?대줎媛? ?좊룞?? ?대깽???쇱젙, ?ъ????쒕룄瑜?諛섎뱶??蹂꾨룄濡??먭??댁빞 ?⑸땲??</p>
      </aside>
    </section>

    <section class="panel theme-green">
      <div class="panel-head">
        <h2>?ㅻ뒛???쒖옣 ?곹깭</h2>
        <span class="panel-date" id="marketAsOf">湲곗???-</span>
      </div>
      <div class="market-grid" id="marketGrid"></div>
      <div style="height:10px"></div>
      <div class="state-grid" id="stateGrid"></div>
    </section>

    <section class="panel theme-orange">
      <h2>?댁뒪 ?ㅼ썙???뚮쭏 View</h2>
      <div class="rationale-list" id="headlineCommentary"></div>
      <div style="height:14px"></div>
      <div class="news-list" id="newsList"></div>
    </section>

    <section class="panel theme-green">
      <h2>利앷텒??由ы룷??寃??View</h2>
      <div class="rationale-list" id="reportCommentary"></div>
      <div style="height:14px"></div>
      <div class="news-list" id="reportList"></div>
    </section>

    <section class="grid">
      <section class="panel theme-dark">
        <h2>?곸쐞 異붿쿇 ?꾨왂 TOP 9</h2>
        <div class="strategies" id="strategyList"></div>
      </section>

      <section class="panel theme-orange">
        <h2>?쒖옣 ?댁꽍</h2>
        <div class="rationale-list" id="rationaleList"></div>
        <div style="height:18px"></div>
        <h3>Avoid Now 6</h3>
        <div class="strategies" id="avoidList"></div>
      </section>
    </section>

    <section class="grid">
      <section class="panel theme-green">
        <h2>?댁쁺 硫붾え</h2>
        <div class="rationale-list" id="opsNotes"></div>
        <div style="height:14px"></div>
        <div class="cta-row">
          <a class="cta" href="https://bitter-morning-77fd.jager001.workers.dev" target="_blank" rel="noreferrer">Option Playbook ?닿린</a>
        </div>
      </section>
    </section>
  </main>
  <script>
    const BOOTSTRAP = {"market":{"asOfDate":"2026-06-10","spot":1227.12,"change1d":0.8,"change5d":2.1,"change21d":5.6,"realizedVol20":24.8},"headlines":[{"title":"諛섎룄泥?AI ?섍툒: ?쇱꽦?꾩옄, SK?섏씠?됱뒪, HBM, ?멸뎅??留ㅼ닔","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4%20HBM%20%EC%99%B8%EA%B5%AD%EC%9D%B8","keywords":["?쇱꽦?꾩옄","SK?섏씠?됱뒪","HBM","?멸뎅??留ㅼ닔"],"rank":1},{"title":"湲덈━/?섏쑉 ?대깽?? ?곗?, ?쒓뎅??? ?щ윭?? 援?콈湲덈━","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EB%8B%AC%EB%9F%AC%EC%9B%90","keywords":["?곗?","?쒓뎅???,"?щ윭??,"援?콈湲덈━"],"rank":2},{"title":"吏??紐⑤찘?: 肄붿뒪??00, ?좉퀬媛, 李⑥씡?ㅽ쁽, ?꾨줈洹몃옩 留ㅻℓ","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%A7%80%EC%88%98%20%EB%AA%A8%EB%A9%98%ED%85%80%20%EC%8B%A0%EA%B3%A0%EA%B0%80%20%EC%B0%A8%EC%9D%B5%EC%8B%A4%ED%98%84%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EB%A7%A4%EB%A7%A4","keywords":["肄붿뒪??00","?좉퀬媛","李⑥씡?ㅽ쁽","?꾨줈洹몃옩 留ㅻℓ"],"rank":3},{"title":"蹂?숈꽦/?듭뀡 ?대깽?? VKOSPI, ?듭뀡留뚭린, 蹂?숈꽦, ?대깽??由ъ뒪??,"date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20VKOSPI%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EC%98%B5%EC%85%98%EB%A7%8C%EA%B8%B0%20%EB%B3%80%EB%8F%99%EC%84%B1%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%EB%A6%AC%EC%8A%A4%ED%81%AC","keywords":["VKOSPI","?듭뀡留뚭린","蹂?숈꽦","?대깽??由ъ뒪??],"rank":4},{"title":"???由ъ뒪?? 誘멸뎅 利앹떆, 以묎뎅 寃쎄린, 愿?? 吏?뺥븰","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%BD%94%EC%8A%A4%ED%94%BC200%20%EB%AF%B8%EA%B5%AD%20%EC%A6%9D%EC%8B%9C%20%EC%A4%91%EA%B5%AD%20%EA%B2%BD%EA%B8%B0%20%EA%B4%80%EC%84%B8%20%EC%A7%80%EC%A0%95%ED%95%99%20%EB%A6%AC%EC%8A%A4%ED%81%AC","keywords":["誘멸뎅 利앹떆","以묎뎅 寃쎄린","愿??,"吏?뺥븰"],"rank":5}],"reports":[{"title":"?쒖옣?꾨왂 而⑥꽱?쒖뒪: ?댁슜?꾨왂, 肄붿뒪???꾨쭩, ?곷떒/?섎떒, 由ъ뒪??,"date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9A%B4%EC%9A%A9%EC%A0%84%EB%9E%B5%20%EC%BD%94%EC%8A%A4%ED%94%BC%20%EC%A0%84%EB%A7%9D%20%EC%83%81%EB%8B%A8%20%ED%95%98%EB%8B%A8%20%EB%A6%AC%EC%8A%A4%ED%81%AC","keywords":["?댁슜?꾨왂","肄붿뒪???꾨쭩","?곷떒/?섎떒","由ъ뒪??],"source":"?꾨왂 由ы룷??寃??,"rank":1},{"title":"諛섎룄泥??댁씡?꾨쭩: 諛섎룄泥? AI, ?댁씡?꾨쭩, 紐⑺몴二쇨?","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EB%B0%98%EB%8F%84%EC%B2%B4%20AI%20%EC%9D%B4%EC%9D%B5%EC%A0%84%EB%A7%9D%20%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90%20SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4","keywords":["諛섎룄泥?,"AI","?댁씡?꾨쭩","紐⑺몴二쇨?"],"source":"?낆쥌 由ы룷??寃??,"rank":2},{"title":"湲덈━/?섏쑉 ?쒕굹由ъ삤: 湲덈━, ?섏쑉, ?곗?, ?쒓뎅???,"date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EA%B8%88%EB%A6%AC%20%ED%99%98%EC%9C%A8%20%EC%97%B0%EC%A4%80%20%ED%95%9C%EA%B5%AD%EC%9D%80%ED%96%89%20%EC%BD%94%EC%8A%A4%ED%94%BC","keywords":["湲덈━","?섏쑉","?곗?","?쒓뎅???],"source":"留ㅽ겕濡?由ы룷??寃??,"rank":3},{"title":"?멸뎅??湲곌? ?섍툒: ?멸뎅?? 湲곌?, ?좊Ъ, ?꾨줈洹몃옩","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20%EC%99%B8%EA%B5%AD%EC%9D%B8%20%EA%B8%B0%EA%B4%80%20%EC%88%98%EA%B8%89%20%EC%84%A0%EB%AC%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%20%EC%BD%94%EC%8A%A4%ED%94%BC200","keywords":["?멸뎅??,"湲곌?","?좊Ъ","?꾨줈洹몃옩"],"source":"?섍툒 由ы룷??寃??,"rank":4},{"title":"蹂?숈꽦/?뚯깮 ?ъ??? VKOSPI, ?듭뀡, 留뚭린, ?ㅼ?","date":"2026-06-10","url":"https://www.google.com/search?q=2026-06-10%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EB%A6%AC%ED%8F%AC%ED%8A%B8%20VKOSPI%20%EC%98%B5%EC%85%98%20%EB%A7%8C%EA%B8%B0%20%ED%97%A4%EC%A7%80%20%EC%BD%94%EC%8A%A4%ED%94%BC200","keywords":["VKOSPI","?듭뀡","留뚭린","?ㅼ?"],"source":"蹂?숈꽦 由ы룷??寃??,"rank":5}],"events":[],"state":{"bias":"媛뺤꽭","volatility":"蹂댄넻","eventRisk":"?믪쓬","conviction":"蹂댄넻","rationale":["理쒓렐 1媛쒖썡 KOSPI200 蹂?붿쑉? +5.6%?대ŉ, 1二?蹂?붿쑉? +2.1%?낅땲??","20???ㅽ쁽蹂?숈꽦 異붿젙移섎뒗 +24.8%濡??쏀엳硫? ?꾩옱 蹂?숈꽦 ?덉쭚? 蹂댄넻?쇰줈 遺꾨쪟?덉뒿?덈떎.","?ㅻ뱶?쇱씤 ?좏샇??媛뺤꽭 1, ?쎌꽭 3, ?대깽??蹂?숈꽦 3嫄댁쑝濡?吏묎퀎?덉뒿?덈떎."],"signalCounts":{"bull":1,"bear":3,"vol":3}},"headlineCommentary":["?ㅻ뱶?쇱씤 臾띠쓬??以묒떖 ?ㅼ? 媛뺤꽭 履쎌씠硫? ?꾩옱 ?뺤떊?꾨뒗 蹂댄넻 ?섏??쇰줈 ?댁꽍?덉뒿?덈떎.","理쒓렐 1媛쒖썡 +5.6% ?먮쫫怨?1二?+2.1% 蹂?붿쑉???④퍡 蹂대㈃, ?④린 紐⑤찘?? ?꾩そ?쇰줈 湲곗슱???덉뒿?덈떎.","蹂?숈꽦 ?좏샇??3嫄댁쑝濡?吏묎퀎?섏뼱, ?쒖옣??諛⑺뼢 ?먯껜蹂대떎 ?대깽??寃쎈줈? ?띾룄??誘쇨컧???곹깭濡??쏀옓?덈떎.","?쎌꽭 ?ㅼ썙?쒓? ??留롮븘, 湲댁텞쨌李⑥씡?ㅽ쁽쨌吏?뺥븰 由ъ뒪?ш? ?ㅻ뱶?쇱씤??二쇰룄 ?쒖궗濡??쏀옓?덈떎.","?곕씪???⑥닚??諛⑺뼢 踰좏똿 ?섎굹蹂대떎, ?꾩옱 ?덉쭚??留욌뒗 ?먯떎 援ъ“? 蹂?숈꽦 ?몄텧???④퍡 蹂대뒗 ?꾨왂 ?좏깮??以묒슂?⑸땲??","?ㅻ뒛 臾띠? 5媛??ㅻ뱶?쇱씤? 紐⑤몢 媛숈? 寃곕줎??留먰븯吏??딆?留? 怨듯넻?곸쑝濡?'異붿꽭???⑥븘 ?덇퀬 ?대깽??誘쇨컧?꾨룄 ?믩떎'??硫붿떆吏瑜?以띾땲??"],"reportCommentary":["利앷텒???댁슜?꾨왂 ?ㅻ뱶?쇱씤? ?댁뒪蹂대떎 臾몄옣????湲됲븯吏留? ?ㅼ젣濡쒕뒗 ?ъ???異붿쿇??寃곗쓣 ??吏곸젒?곸쑝濡??쒕윭?대뒗 寃쎌슦媛 留롮뒿?덈떎.","?꾩옱 臾띠쓬?먯꽌??以묐┰???좊퀎 ???履?硫붿떆吏媛 ?곷??곸쑝濡????먯＜ 蹂댁엯?덈떎.","?쒖옣 ?곹깭 湲곗??쇰줈??媛뺤꽭 ?댁꽍???곗꽭?섍퀬, 理쒓렐 1媛쒖썡 +5.6% ?먮쫫??媛먯븞?섎㈃ 由ы룷?몃룄 異붿꽭 異붿쥌怨??덉쭚 ?먭????④퍡 ?붽뎄?섎뒗 援ш컙?쇰줈 ?쏀옓?덈떎.","諛섎룄泥댁? AI 愿???쒗쁽???ы븿?섏뼱 ?덉뼱, ?ㅼ젣 ?섍툒怨?吏??湲곗뿬?꾧? ????뺤＜ 紐⑤찘???由ы룷?몄쓽 ?듭떖 諛곌꼍 以??섎굹濡?蹂댁엯?덈떎.","湲덈━? ?섏쑉, 以묒븰????대깽???멸툒???욎뿬 ?덉뼱 諛⑺뼢???먯껜蹂대떎 ?좎씤??蹂?붿? ?멸뎅???섍툒 寃쎈줈瑜??④퍡 遊먯빞 ?섎뒗 ?μ꽭?쇰뒗 ?좏샇媛 蹂댁엯?덈떎.","蹂?숈꽦쨌遺덊솗?ㅼ꽦 ?ㅼ썙?쒓? 諛섎났?섎㈃, ?⑥닚 ?곷갑 異붿젙??留욌뜑?쇰룄 ?꾨━誘몄뾼 援ъ“? ?먯떎 ?쒕룄 ?ㅺ퀎媛 ??以묒슂?댁쭛?덈떎.","?곕씪?????뱀뀡? ?댁뒪蹂대떎 ???④퀎 ?뺤젣??而⑥꽱?쒖뒪 ?뺤씤?⑹쑝濡?蹂닿퀬, 理쒖쥌 ?꾨왂 ?좏깮? ?ㅻ뱶?쇱씤 ?좏샇? ?④퍡 援먯감 寃利앺븯???⑸룄濡??곕뒗 ?몄씠 醫뗭뒿?덈떎."],"recommendations":{"top":[{"slug":"risk-reversal","title":"Risk Reversal","category":"諛⑺뼢???꾨왂","bias":"bull","vol":"mixed","risk":"tail","eventFit":"high","cost":"low","summary":"媛뺥븳 媛뺤꽭 酉곕? ?꾨━誘몄뾼 ?덇컧?뺤쑝濡??쒗쁽?섏?留??섎떒 tail risk瑜??덉뒿?덈떎.","score":92,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎.","媛源뚯슫 嫄곗떆 ?대깽?몃? 媛먯븞???대깽???곹빀?꾧? ?믪? 援ъ“瑜??곕??덉뒿?덈떎."],"cautions":[]},{"slug":"collar","title":"Collar","category":"?ㅼ? ?꾨왂","bias":"bull","vol":"mixed","risk":"defined","eventFit":"high","cost":"low","summary":"?곷갑 ?쇰?瑜??ш린?섍퀬 ?섎떒??諛⑹뼱?섎뒗 蹂댁닔??援ъ“?낅땲??","score":92,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎.","媛源뚯슫 嫄곗떆 ?대깽?몃? 媛먯븞???대깽???곹빀?꾧? ?믪? 援ъ“瑜??곕??덉뒿?덈떎."],"cautions":[]},{"slug":"call-backspread","title":"Call Backspread","category":"蹂?숈꽦 留ㅼ닔 ?꾨왂","bias":"bull","vol":"buy","risk":"defined","eventFit":"high","cost":"medium","summary":"湲됰벑怨?蹂?숈꽦 ?뺣????좊━???곷갑 蹂쇰줉??援ъ“?낅땲??","score":84,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎.","媛源뚯슫 嫄곗떆 ?대깽?몃? 媛먯븞???대깽???곹빀?꾧? ?믪? 援ъ“瑜??곕??덉뒿?덈떎."],"cautions":[]}],"watchlist":[{"slug":"call-calendar-spread","title":"Call Calendar Spread","category":"留뚭린 援ъ“ ?꾨왂","bias":"bull","vol":"mixed","risk":"defined","eventFit":"medium","cost":"medium","summary":"?꾨쭔??媛뺤꽭? ?쒓컙媛移?李⑥씠瑜??숈떆???쒖슜?섎뒗 援ъ“?낅땲??","score":82,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎."],"cautions":[]},{"slug":"one-by-two-call-spread","title":"1x2 Call Ratio Spread","category":"鍮꾨?移?Ratio","bias":"bull","vol":"mixed","risk":"tail","eventFit":"medium","cost":"low","summary":"?곸듅 紐⑺몴援ш컙?먮뒗 ?⑥쑉?곸씠吏留??곷떒 怨쇱냽 ??由ъ뒪?ш? 而ㅼ쭛?덈떎.","score":82,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎."],"cautions":[]},{"slug":"bull-call-spread","title":"Bull Call Spread","category":"諛⑺뼢???꾨왂","bias":"bull","vol":"buy","risk":"defined","eventFit":"medium","cost":"medium","summary":"?꾨쭔???곸듅怨??뺤쓽???먯떎???숈떆??異붽뎄?섎뒗 湲곕낯 媛뺤꽭 援ъ“?낅땲??","score":74,"reasons":["?쒖옣 諛⑺뼢 ?댁꽍??媛뺤꽭 履쎌쑝濡?湲곗슱???덉뒿?덈떎."],"cautions":[]}],"avoided":[{"slug":"one-by-two-put-spread","title":"1x2 Put Ratio Spread","category":"鍮꾨?移?Ratio","bias":"bear","vol":"mixed","risk":"tail","eventFit":"medium","cost":"low","summary":"?섎씫 紐⑺몴援ш컙???⑥쑉?곸씠吏留?湲됰씫 tail risk媛 議댁옱?⑸땲??","score":38,"reasons":[],"cautions":["?꾩옱 諛⑺뼢 ?댁꽍怨?諛섎???援ъ“?낅땲??"]},{"slug":"bear-put-spread","title":"Bear Put Spread","category":"諛⑺뼢???꾨왂","bias":"bear","vol":"buy","risk":"defined","eventFit":"medium","cost":"medium","summary":"?꾨쭔???섎씫??留욌뒗 ?쎌꽭 湲곕낯 援ъ“濡? ?먯떎? ?쒗븳?섍퀬 諛⑺뼢?깆? ?좊챸?⑸땲??","score":30,"reasons":[],"cautions":["?꾩옱 諛⑺뼢 ?댁꽍怨?諛섎???援ъ“?낅땲??"]},{"slug":"bear-call-spread","title":"Bear Call Spread","category":"諛⑺뼢???꾨왂","bias":"bear","vol":"sell","risk":"defined","eventFit":"low","cost":"credit","summary":"?곷갑???쒗븳??寃껋씠?쇰뒗 酉곗뿉 留욌뒗 ?щ젅?㏉삎 ?쎌꽭 援ъ“?낅땲??","score":22,"reasons":[],"cautions":["?꾩옱 諛⑺뼢 ?댁꽍怨?諛섎???援ъ“?낅땲??","?대깽??吏곸쟾?먮뒗 ?대떦 援ъ“???먯씡寃쎈줈 由ъ뒪?ш? ?쎈땲??"]}]},"meta":{"generatedAt":"2026-06-11 18:00 KST","live":false,"notes":["?뚯씪???④퀎?먯꽌??吏???덈꺼, 20???ㅽ쁽蹂?숈꽦, 怨듦컻 ?ㅻ뱶?쇱씤 ?좏샇瑜?寃고빀???꾨왂???먯닔?뷀빀?덈떎.","利앷텒??由ы룷??View???ㅼ씠踰?利앷텒 ?댁슜?꾨왂 ?ㅻ뱶?쇱씤 湲곗????뚯씪??援ъ“?대ŉ, ?묎렐 遺덇? ??以鍮꾨맂 ?섑뵆濡??泥대맗?덈떎.","?쒖떆?섎뒗 KOSPI200 ?덈꺼? ?꾩옱 Playbook ?꾨왂 泥닿퀎? 媛숈? 湲곗??쇰줈 留욎떠吏?吏???덈꺼?낅땲??","?ㅼ쟾 ?곸슜 ?꾩뿉???듭뀡 ?대줎媛, ?뱀씪 ?대깽?? ?ъ????쒕룄瑜?蹂꾨룄濡??ш??좏빐???⑸땲??"]}};
    const LIVE_MODE = true;
    const LIVE_API_URL = "https://bitter-morning-77fd.jager001.workers.dev/api/advisor";
    const SNAPSHOT_STORAGE_KEY = "option-playbook-advisor:last-good-snapshot";
    const REFRESH_MS = 15 * 60 * 1000;

    function fmtPct(value) {
      const sign = value > 0 ? "+" : "";
      return sign + Number(value).toFixed(1) + "%";
    }

    function classFor(value) {
      return value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
    }

    function loadSavedSnapshot() {
      try {
        const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function saveSnapshot(snapshot) {
      try {
        localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
      } catch {}
    }

    function getFallbackSnapshot() {
      return loadSavedSnapshot() || BOOTSTRAP;
    }

    function stateTone(label, value) {
      if (label === "諛⑺뼢") {
        if (value === "媛뺤꽭") return "state-bull";
        if (value === "?쎌꽭") return "state-bear";
        return "state-neutral";
      }
      if (label === "蹂?숈꽦") {
        if (value === "?믪쓬") return "state-vol-high";
        if (value === "??쓬") return "state-vol-low";
        return "state-vol-mid";
      }
      if (label === "?대깽??由ъ뒪??) {
        return value === "?믪쓬" ? "state-risk-high" : "state-risk-mid";
      }
      if (label === "?뺤떊??) {
        if (value === "?믪쓬") return "state-conviction-high";
        if (value === "??쓬") return "state-conviction-low";
        return "state-conviction-mid";
      }
      return "";
    }

    function render(snapshot) {
      const marketLabel = snapshot.market.asOfTime || snapshot.market.asOfDate || snapshot.meta.generatedAt?.slice(0, 16) || '-';
      const policyLabel = snapshot.market.dataPolicy ? ' · ' + snapshot.market.dataPolicy : '';
      document.getElementById("marketAsOf").textContent = '기준 ' + marketLabel + policyLabel;
      const marketGrid = document.getElementById("marketGrid");
      marketGrid.innerHTML = [
        ["KOSPI200", Number(snapshot.market.spot).toFixed(2)],
        ["1D", '<span class="' + classFor(snapshot.market.change1d) + '">' + fmtPct(snapshot.market.change1d) + '</span>'],
        ["1W", '<span class="' + classFor(snapshot.market.change5d) + '">' + fmtPct(snapshot.market.change5d) + '</span>'],
        ["20D RV", fmtPct(snapshot.market.realizedVol20)]
      ].map(([k, v]) => '<div class="mini-card"><b>' + k + '</b><span>' + v + '</span></div>').join("");

      document.getElementById("stateGrid").innerHTML = [
        ["諛⑺뼢", snapshot.state.bias],
        ["蹂?숈꽦", snapshot.state.volatility],
        ["?대깽??由ъ뒪??, snapshot.state.eventRisk],
        ["?뺤떊??, snapshot.state.conviction]
      ].map(([k, v]) => '<div class="badge-card ' + stateTone(k, v) + '"><b>' + k + '</b><span>' + v + '</span></div>').join("");

      document.getElementById("headlineCommentary").innerHTML = '<div class="news-item commentary-tile"><b>怨듯넻 硫붿떆吏</b>' + snapshot.headlineCommentary.map(text => '<div class="commentary-line">' + text + '</div>').join('') + '</div>';
      document.getElementById("reportCommentary").innerHTML = '<div class="news-item commentary-tile"><b>怨듯넻 硫붿떆吏</b>' + (snapshot.reportCommentary || []).map(text => '<div class="commentary-line">' + text + '</div>').join('') + '</div>';

      const topStrategies = (snapshot.recommendations.top || []).length >= 9
        ? (snapshot.recommendations.top || [])
        : (snapshot.recommendations.top || []).concat(snapshot.recommendations.watchlist || [], (snapshot.recommendations.avoided || []).slice(0, 3));
      const avoidStrategies = (snapshot.recommendations.avoided || []).length >= 6
        ? (snapshot.recommendations.avoided || [])
        : (snapshot.recommendations.avoided || []).concat(snapshot.recommendations.watchlist || []).slice(0, 6);

      document.getElementById("strategyList").innerHTML = topStrategies.map((item, idx) => {
        const reasons = item.reasons.map(text => '<li>' + text + '</li>').join("");
        const cautions = item.cautions.length ? '<ul class="bullets">' + item.cautions.map(text => '<li>' + text + '</li>').join("") + '</ul>' : '';
        return '<article class="strategy-card">' +
          '<div class="strategy-head"><div><h4>' + (idx + 1) + '. ' + item.title + '</h4><div class="sub">' + item.category + ' | ' + item.slug + '</div></div><div class="score">' + item.score + '??/div></div>' +
          '<p class="summary">' + item.summary + '</p>' +
          '<ul class="bullets">' + reasons + '</ul>' +
          cautions +
          '<div class="cta-row"><a class="secondary" href="https://bitter-morning-77fd.jager001.workers.dev#strategy/' + item.slug + '" target="_blank" rel="noreferrer">Option Playbook ?닿린</a></div>' +
        '</article>';
      }).join("");

      document.getElementById("rationaleList").innerHTML = '<div class="news-item commentary-tile"><b>?듭떖 ?댁꽍</b>' + snapshot.state.rationale.map(text => '<div class="commentary-line">' + text + '</div>').join('') + '</div>';
      document.getElementById("avoidList").innerHTML = avoidStrategies.map((item, idx) => {
        const reasons = item.reasons.map(text => '<li>' + text + '</li>').join("");
        const cautions = item.cautions.length ? '<ul class="bullets">' + item.cautions.map(text => '<li>' + text + '</li>').join("") + '</ul>' : '';
        return '<article class="strategy-card">' +
          '<div class="strategy-head"><div><h4>' + (idx + 1) + '. ' + item.title + '</h4><div class="sub">' + item.category + ' | ' + item.slug + '</div></div><div class="score">' + item.score + '??/div></div>' +
          '<p class="summary">' + item.summary + '</p>' +
          '<ul class="bullets">' + reasons + '</ul>' +
          cautions +
          '<div class="cta-row"><a class="secondary" href="https://bitter-morning-77fd.jager001.workers.dev#strategy/' + item.slug + '" target="_blank" rel="noreferrer">Option Playbook ?닿린</a></div>' +
        '</article>';
      }).join("");
      document.getElementById("newsList").innerHTML = snapshot.headlines.map((item, idx) => '<div class="news-item"><b>' + (idx + 1) + '. ' + (item.url ? ('<a href="' + item.url + '" target="_blank" rel="noreferrer">' + item.title + '</a>') : item.title) + '</b><div class="sub">寃?됯린以 ' + (item.date || '-') + (item.keywords ? (' 쨌 ?ㅼ썙??' + item.keywords.join(' 쨌 ')) : '') + '</div></div>').join("");
      document.getElementById("reportList").innerHTML = (snapshot.reports || []).map((item, idx) => '<div class="news-item"><b>' + (idx + 1) + '. ' + (item.url ? ('<a href="' + item.url + '" target="_blank" rel="noreferrer">' + item.title + '</a>') : item.title) + '</b><div class="sub"><span class="source-tag">' + (item.source || '由ы룷??寃??) + '</span>寃?됯린以 ' + (item.date || '-') + (item.keywords ? (' 쨌 ?ㅼ썙??' + item.keywords.join(' 쨌 ')) : '') + '</div></div>').join("");

      document.getElementById("opsNotes").innerHTML = snapshot.meta.notes.map(text => '<div class="news-item"><b>?댁쁺 ?명듃</b><div>' + text + '</div></div>').join("");
    }

    async function refreshLive() {
      if (!LIVE_MODE) return;
      try {
        const response = await fetch(LIVE_API_URL + '?ts=' + Date.now(), { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
        if (!response.ok) throw new Error('live fetch failed');
        const data = await response.json();
        saveSnapshot(data);
        render(data);
      } catch (error) {
        render(getFallbackSnapshot());
      }
    }

    document.getElementById("refreshButton").addEventListener("click", refreshLive);
    render(getFallbackSnapshot());
    if (LIVE_MODE) {
      refreshLive();
      setInterval(refreshLive, REFRESH_MS);
    }
  </script>
</body>
</html>
`;

