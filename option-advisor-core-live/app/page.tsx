"use client";

import { useEffect, useMemo, useState } from "react";
import { ADVISOR_BASE_PATH } from "@/lib/paths";
import type { AdvisorSnapshot, ScoredStrategy, ThemeItem } from "@/lib/oae";
import type { RegimeKey } from "@/lib/market";

const regimeCopy: Record<
  RegimeKey,
  { title: string; desc: string; pill: string; className: string }
> = {
  regime_1: {
    title: "Regime 1 · Put Skew / High Vol",
    desc: "방어 수요가 강하고 변동성이 높은 국면입니다. 정의된 손실 구조와 헤지형 전략이 유리합니다.",
    pill: "Defensive",
    className: "q1",
  },
  regime_2: {
    title: "Regime 2 · Call Skew / High Vol",
    desc: "상방 기대는 살아 있지만 변동성도 높은 국면입니다. 방향성과 이벤트 적합도를 함께 봐야 합니다.",
    pill: "Momentum",
    className: "q2",
  },
  regime_3: {
    title: "Regime 3 · Put Skew / Low Vol",
    desc: "방어 심리는 남아 있지만 전체 변동성은 낮습니다. 보수적 인컴 구조와 방어적 프레임이 어울립니다.",
    pill: "Carry",
    className: "q3",
  },
  regime_4: {
    title: "Regime 4 · Call Skew / Low Vol",
    desc: "상방 선호가 우세하고 변동성은 낮은 국면입니다. 프리미엄 수취와 완만한 방향성 구조를 검토합니다.",
    pill: "Balanced",
    className: "q4",
  },
};

function todayIso() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatScore(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSignedPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatScore(value)}%`;
}

function useAdvisorSnapshot(selectedDate: string, refreshToken: number) {
  const [snapshot, setSnapshot] = useState<AdvisorSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSnapshot() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${ADVISOR_BASE_PATH}/api/advisor?date=${encodeURIComponent(selectedDate)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as AdvisorSnapshot | { error?: string };

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload ? payload.error ?? "Advisor fetch failed" : "Advisor fetch failed",
          );
        }

        setSnapshot(payload as AdvisorSnapshot);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Advisor fetch failed");
          setSnapshot(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSnapshot();

    return () => controller.abort();
  }, [selectedDate, refreshToken]);

  return { snapshot, loading, error };
}

function MetricCard({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "default" | "positive" | "negative" | "muted";
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-delta">{delta}</div>
    </article>
  );
}

function ThemeCard({ item, index }: { item: ThemeItem; index: number }) {
  return (
    <article className="theme-card">
      <div className="theme-index">{index + 1}</div>
      <div className="theme-body">
        <a href={item.url} target="_blank" rel="noreferrer" className="theme-title">
          {item.title}
        </a>
        <div className="theme-meta">
          <span className="source-tag">{item.source ?? "search view"}</span>
          <span>기준일 {item.date}</span>
        </div>
        <div className="theme-keywords">{item.keywords.join(" · ")}</div>
      </div>
    </article>
  );
}

function StrategyCard({
  item,
  index,
  compact = false,
}: {
  item: ScoredStrategy;
  index: number;
  compact?: boolean;
}) {
  return (
    <article className={`strategy-card ${compact ? "compact" : ""} band-${item.band}`}>
      <div className="strategy-head">
        <div>
          <div className="strategy-title">
            {index + 1}. {item.title}
          </div>
          <div className="strategy-meta">
            <span>{item.category}</span>
            <span>{item.slug}</span>
          </div>
        </div>
        <div className="score-chip">
          {item.score.toFixed(0)}
          <small>pts</small>
        </div>
      </div>
      <p className="strategy-summary">{item.summary}</p>
      <ul className="strategy-bullets">
        {item.reasons.length > 0 ? (
          item.reasons.map((reason) => <li key={reason}>{reason}</li>)
        ) : (
          <li>현재 시장 조건과의 정합성이 점수에 반영되었습니다.</li>
        )}
      </ul>
      {item.cautions.length > 0 ? (
        <ul className="strategy-bullets caution">
          {item.cautions.map((caution) => (
            <li key={caution}>{caution}</li>
          ))}
        </ul>
      ) : null}
      <div className="strategy-foot">
        <a href={item.playbookUrl} target="_blank" rel="noreferrer" className="playbook-link">
          Option Playbook 열기
        </a>
        <span className="band-label">{item.band === "top" ? "Top Recommended" : item.band === "watchlist" ? "Watchlist" : "Avoid Now"}</span>
      </div>
    </article>
  );
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [refreshToken, setRefreshToken] = useState(0);
  const { snapshot, loading, error } = useAdvisorSnapshot(selectedDate, refreshToken);

  const activeRegimeKey = snapshot?.state.regimeKey ?? "regime_2";
  const activeRegime = regimeCopy[activeRegimeKey];
  const topNine = useMemo(() => snapshot?.displayTopNine ?? [], [snapshot]);
  const avoidList = useMemo(() => snapshot?.avoidNow ?? [], [snapshot]);

  const marketSource = snapshot?.source ?? (loading ? "loading" : "unknown");
  const confidence = snapshot?.state.confidence ?? 0;
  const confidenceWidth = Math.max(2, Math.min(100, confidence));

  return (
    <main className="advisor-app">
      <div className="advisor-blobs" />

      <div className="advisor-shell">
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="hero-actions">
              <button
                className="refresh-button"
                id="refreshButton"
                type="button"
                onClick={() => setRefreshToken((value) => value + 1)}
              >
                데이터 업데이트
              </button>
              <span className="hero-chip">Codex 1 · Option Advisor Core</span>
              <span className="hero-chip">Codex 2 input ready</span>
            </div>
            <h1>
              Option Playbook
              <br />
              Advisor Core
            </h1>
            <p className="hero-subtitle">
              코스피200 시장 상태, 변동성, 스큐, 이벤트 리스크를 결합해 Top 9와 Avoid 6을 한 화면에서
              비교하는 옵션 어드바이저 대시보드입니다. Codex 2의 레짐 뷰가 들어오면 동일한 출력
              구조로 바로 연결됩니다.
            </p>
            <div className="pill-row" aria-label="status tags">
              <span className="pill">Top 9 recommendations</span>
              <span className="pill">Avoid 6 guardrail</span>
              <span className="pill">Regime-aware scoring</span>
              <span className="pill">Playbook-linked cards</span>
            </div>
          </div>

          <aside className="hero-status">
            <div className="status-top">
              <div className="status-label">Current view</div>
              <div className="status-badge">source: {marketSource}</div>
            </div>
            <p className="status-title">
              {loading ? "Loading..." : activeRegime.title}
              <small>{loading ? "시장을 불러오는 중입니다." : activeRegime.desc}</small>
            </p>
            <div>
              <div className="status-line">
                <span>Confidence</span>
                <strong>{loading ? "--" : `${formatScore(confidence)}%`}</strong>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${confidenceWidth}%` }} />
              </div>
            </div>
          </aside>
        </section>

        <section className="control-card">
          <div>
            <label htmlFor="tradeDate">기준 거래일</label>
            <input
              id="tradeDate"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <div className="control-actions">
            <button type="button" onClick={() => setRefreshToken((value) => value + 1)}>
              코어 재실행
            </button>
            <div className="control-hint">
              Codex 2의 market view가 있으면 {ADVISOR_BASE_PATH}/api/advisor 쿼리로 그대로 주입할 수
              있습니다.
            </div>
          </div>
        </section>

        <section className="metric-grid">
          <MetricCard
            label="KOSPI200"
            value={snapshot ? `${formatNumber(snapshot.market.k200Close)} pt` : "..."}
            delta={snapshot ? `actualDate ${snapshot.actualDate}` : "waiting for data"}
            tone="default"
          />
          <MetricCard
            label="1D Change"
            value={snapshot ? formatSignedPct(snapshot.market.change1d) : "..."}
            delta={snapshot ? "direct price drift" : "loading"}
            tone={snapshot ? (snapshot.market.change1d >= 0 ? "positive" : "negative") : "default"}
          />
          <MetricCard
            label="1W Change"
            value={snapshot ? formatSignedPct(snapshot.market.change5d) : "..."}
            delta={snapshot ? "weekly momentum" : "loading"}
            tone={snapshot ? (snapshot.market.change5d >= 0 ? "positive" : "negative") : "default"}
          />
          <MetricCard
            label="20D Realized Vol"
            value={snapshot ? formatScore(snapshot.market.realizedVol20) : "..."}
            delta={snapshot ? "realized volatility proxy" : "loading"}
            tone="muted"
          />
          <MetricCard
            label="Vol Score"
            value={snapshot ? formatScore(snapshot.market.volScore) : "..."}
            delta={snapshot ? "volatility z-style score" : "loading"}
            tone="default"
          />
          <MetricCard
            label="Skew Score"
            value={snapshot ? formatScore(snapshot.market.skewScore) : "..."}
            delta={snapshot ? "20D skew proxy" : "loading"}
            tone="default"
          />
        </section>

        <section className="panel-grid">
          <section className="panel panel-dark">
            <div className="panel-head">
              <h2>Regime Map</h2>
              <span className="panel-badge">{snapshot?.state.regimeLabel ?? "Regime 2"}</span>
            </div>
            <div className="regime-grid">
              {(Object.entries(regimeCopy) as Array<[RegimeKey, (typeof regimeCopy)[RegimeKey]]>).map(
                ([key, item]) => (
                  <article
                    key={key}
                    className={`regime-card ${item.className} ${activeRegimeKey === key ? "active" : ""}`}
                  >
                    <div className="regime-heading">{item.title}</div>
                    <div className="regime-desc">{item.desc}</div>
                    <div className="regime-pill">{item.pill}</div>
                  </article>
                ),
              )}
            </div>
          </section>

          <aside className="panel panel-orange">
            <div className="panel-head">
              <h2>Committee Brief</h2>
              <span className="panel-badge">Codex 1</span>
            </div>
            <div className="brief-copy">
              {snapshot?.committeeBrief ??
                "이 영역은 Codex 1이 선택한 Top/Watchlist/Avoid 구조를 한 문단으로 요약합니다."}
            </div>
            <div className="brief-list">
              {(snapshot?.rationale ?? []).map((text) => (
                <div key={text} className="brief-line">
                  {text}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="panel-grid">
          <section className="panel panel-green">
            <div className="panel-head">
              <h2>Headline Themes</h2>
              <span className="panel-badge">search view</span>
            </div>
            <div className="theme-grid">
              {(snapshot?.headlineThemes ?? []).map((item, index) => (
                <ThemeCard key={item.title + item.date} item={item} index={index} />
              ))}
            </div>
          </section>

          <section className="panel panel-dark">
            <div className="panel-head">
              <h2>Report Themes</h2>
              <span className="panel-badge">search view</span>
            </div>
            <div className="theme-grid">
              {(snapshot?.reportThemes ?? []).map((item, index) => (
                <ThemeCard key={item.title + item.date} item={item} index={index} />
              ))}
            </div>
          </section>
        </section>

        <section className="panel-grid">
          <section className="panel panel-dark">
            <div className="panel-head">
              <h2>Top Recommended 9</h2>
              <span className="panel-badge">ranked output</span>
            </div>
            <div className="strategy-grid">
              {topNine.map((item, index) => (
                <StrategyCard key={item.slug} item={item} index={index} />
              ))}
            </div>
          </section>

          <section className="panel panel-orange">
            <div className="panel-head">
              <h2>Avoid Now 6</h2>
              <span className="panel-badge">guardrail</span>
            </div>
            <div className="strategy-grid">
              {avoidList.map((item, index) => (
                <StrategyCard key={item.slug} item={item} index={index} compact />
              ))}
            </div>
          </section>
        </section>

        <section className="panel-grid">
          <section className="panel panel-green">
            <div className="panel-head">
              <h2>Validation Notes</h2>
              <span className="panel-badge">Codex 3 ready</span>
            </div>
            <div className="brief-list">
              {(snapshot?.validationNotes ?? []).map((text) => (
                <div key={text} className="brief-line">
                  {text}
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel-dark">
            <div className="panel-head">
              <h2>Ops Notes</h2>
              <span className="panel-badge">MLOps / DevOps</span>
            </div>
            <div className="brief-list">
              {(snapshot?.opsNotes ?? []).map((text) => (
                <div key={text} className="brief-line">
                  {text}
                </div>
              ))}
            </div>
            <div className="footer-note">
              {error ? `Advisor fetch failed: ${error}` : snapshot?.market.note ?? "waiting for advisor snapshot"}
            </div>
          </section>
        </section>

        <section className="panel panel-bottom">
          <div className="panel-head">
            <h2>Implementation Alignment</h2>
            <span className="panel-badge">backup-compatible</span>
          </div>
          <div className="alignment-grid">
            <div>
              <strong>Existing backup page</strong>
              <p>
                현재 레이아웃은 기존
                {" "}
                <code>Option_Playbook_Advisor_backup_2026-06-12_v5.6</code>
                {" "}
                스타일의 정보 밀도를 유지하면서, Codex 1 결과를 그대로 끼워 넣을 수 있도록 만들었습니다.
              </p>
            </div>
            <div>
              <strong>Codex 2 handshake</strong>
              <p>
                이후에는 <code>{ADVISOR_BASE_PATH}/api/advisor</code>에 regime, volScore, skewScore,
                confidence를 쿼리로 주입해 Regime &amp; Market View 에이전트가 만든 결과를 그대로 넘길 수
                있습니다.
              </p>
            </div>
            <div>
              <strong>Codex 3 / Codex 4</strong>
              <p>
                validation notes와 reasoning strings를 남겨 두어서 PASS/Review/Reject와 attribution preview를 붙이기 쉽게 했습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
