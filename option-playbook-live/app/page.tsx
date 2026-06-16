"use client";

import { useEffect, useState } from "react";
import type { MarketSnapshot, RegimeKey } from "@/lib/market";

const regimeCopy: Record<
  RegimeKey,
  { title: string; desc: string; pill: string; className: string }
> = {
  regime_1: {
    title: "Regime 1 · Put Skew / High Vol",
    desc: "하방 헤지 수요가 강하고 변동성이 높은 상태입니다. 방어적 포지션과 방향성 리스크를 함께 주의합니다.",
    pill: "Q1",
    className: "q1",
  },
  regime_2: {
    title: "Regime 2 · Call Skew / High Vol",
    desc: "상방 기대와 함께 변동성도 높은 구간입니다. 단기 반등이나 이벤트성 수급에 민감합니다.",
    pill: "Q2",
    className: "q2",
  },
  regime_3: {
    title: "Regime 3 · Put Skew / Low Vol",
    desc: "완만한 장세에서 하방 헤지 수요가 우세합니다. 보수적 수급과 추세 둔화가 같이 보일 수 있습니다.",
    pill: "Q3",
    className: "q3",
  },
  regime_4: {
    title: "Regime 4 · Call Skew / Low Vol",
    desc: "저변동성 속에서 상방 기대가 상대적으로 우세한 상태입니다. 프리미엄 수요의 방향을 살펴봅니다.",
    pill: "Q4",
    className: "q4",
  },
};

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [refreshToken, setRefreshToken] = useState(0);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSnapshot() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/snapshot?date=${encodeURIComponent(selectedDate)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as
          | MarketSnapshot
          | { error?: string };

        if (!response.ok) {
          throw new Error(payload && "error" in payload ? payload.error : "데이터를 불러오지 못했습니다.");
        }

        setSnapshot(payload as MarketSnapshot);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "데이터를 불러오지 못했습니다.");
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

  const activeRegimeKey = snapshot?.regimeKey ?? "regime_2";
  const activeRegime = regimeCopy[activeRegimeKey];
  const confidence = snapshot?.confidence ?? 0;
  const sourceLabel = snapshot?.source ?? (loading ? "loading" : "unknown");
  const confidenceWidth = Math.max(2, Math.min(100, confidence));

  return (
    <main className="app-root">
      <div className="blobs" />
      <div className="wrap">
        <section className="hero">
          <div className="title-card">
            <div className="eyebrow">Dynamic A-Wing Regime Monitor · Real-data HTML</div>
            <h1>
              시장 국면을
              <br />
              한 화면에 보여주는 초안
            </h1>
            <p className="subtitle">
              이 버전은 실데이터가 연결된 HTML 스타일 대시보드입니다. 날짜를 바꾸고 버튼을 누르면
              Yahoo Finance 공개 차트 API에서 가져온 KOSPI200 실데이터로 갱신됩니다.
            </p>
            <div className="pill-row" aria-label="status tags">
              <span className="pill">2x2 Regime Grid</span>
              <span className="pill">20D Realized Vol</span>
              <span className="pill">20D Return Skew</span>
              <span className="pill">Public market data</span>
            </div>
          </div>

          <div className="status-card">
            <div className="status-top">
              <div className="status-label">현재 상태</div>
              <div className="status-badge">source: {sourceLabel}</div>
            </div>
            <p className="big-score">
              {loading ? "Loading..." : activeRegime.title}
              <small>{loading ? "실데이터를 불러오는 중" : activeRegime.subtitle}</small>
            </p>
            <div>
              <div className="status-line">
                <span>신호 강도</span>
                <strong>{loading ? "--" : `${formatScore(confidence)}%`}</strong>
              </div>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{ width: `${confidenceWidth}%` }}
                />
              </div>
            </div>
          </div>
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
          <button type="button" onClick={() => setRefreshToken((value) => value + 1)}>
            데이터 업데이트 및 구역 분석
          </button>
        </section>

        <section className="metrics">
          <article className="metric">
            <div className="label">KOSPI200 지수</div>
            <div className="value">
              {snapshot ? `${formatNumber(snapshot.k200Close)} pt` : "..." }
            </div>
            <div className="delta">
              {snapshot ? `기준일: ${snapshot.actualDate}` : "실데이터 대기 중"}
            </div>
          </article>
          <article className="metric">
            <div className="label">20D Realized Vol</div>
            <div className="value">
              {snapshot ? `${formatScore(snapshot.realizedVol20)}` : "..."}
            </div>
            <div className="delta">
              {snapshot ? "실제 가격 변동성" : "데이터 로딩 중"}
            </div>
          </article>
          <article className="metric">
            <div className="label">Volatility Score (Y축)</div>
            <div className="value">{snapshot ? formatScore(snapshot.volScore) : "..."}</div>
            <div className="delta">{snapshot ? "Realized vol z-score" : "데이터 로딩 중"}</div>
          </article>
          <article className="metric">
            <div className="label">Skewness Score (X축)</div>
            <div className="value">{snapshot ? formatScore(snapshot.skewScore) : "..."}</div>
            <div className="delta">{snapshot ? "20D return skew proxy" : "데이터 로딩 중"}</div>
          </article>
        </section>

        <section className="grid">
          <div>
            <div className="regime-grid">
              {(
                Object.entries(regimeCopy) as Array<
                  [RegimeKey, (typeof regimeCopy)[RegimeKey]]
                >
              ).map(([key, item]) => (
                <article
                  key={key}
                  className={`regime-card ${item.className} ${activeRegimeKey === key ? "active" : ""}`}
                >
                  <div className="heading">{item.title}</div>
                  <div className="desc">{item.desc}</div>
                  <div className="signal">{item.pill}</div>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel">
            <h2>다음 단계 연결 포인트</h2>
            <p>
              이 초안은 실제 데이터가 연결된 HTML 기반 대시보드입니다. 다음 단계에서는 API
              라우트만 바꿔서 KRX 로그인형 데이터나 다른 데이터 소스로 교체할 수 있습니다.
            </p>
            <ul>
              <li>날짜 선택값을 API 요청 파라미터로 전송</li>
              <li>KOSPI200 실데이터와 20일 변동성 지표를 JSON으로 수신</li>
              <li>받은 값으로 활성 regime만 자동 강조</li>
              <li>실패 시에는 화면 하단에 에러 메시지만 표시</li>
            </ul>
            <div className="note-card">
              {error
                ? `데이터 연결 실패: ${error}`
                : snapshot?.note ??
                  "현재는 실데이터 연결 상태입니다. 다음 단계에서 옵션 기반 skew proxy로 바꿀 수도 있습니다."}
            </div>
            <div className="footer">
              {snapshot ? `series length: ${snapshot.seriesLength}` : "waiting for data"}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
