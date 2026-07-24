import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './dashboardReport.css'; // 기존 스타일(ai-analysis-box, forecast-section 등) 재사용
import ReactMarkdown from 'react-markdown';

const API_BASE = process.env.REACT_APP_API_URL || '';

function SalesAnalysis() {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/orders/report/summary`)
            .then(res => res.json())
            .then(data => setSummary(data))
            .catch(err => console.error("데이터 로드 실패:", err));
    }, []);

    // AI 분석에 필요한 원본 통계 (백엔드 summary에서 그대로 사용)
    const allStats = (summary?.menuStats ?? []).map(m => ({
        name: m.menuName,
        category: m.category,
        count: m.count,
        totalSales: m.totalSales
    }));
    const dailyStats = summary?.dailyStats ?? [];
    const hourlyStats = summary?.hourlyStats ?? [];
    const monthlyStats = summary?.monthlyStats ?? [];

    // ── AI 매출 분석 ──
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const handleAiAnalysis = () => {
        setLoading(true);
        setAiError("");
        setAiAnalysis("");

        const salesList = allStats.map(item => ({
            menuName: item.name,
            category: item.category,
            price: item.count > 0 ? item.totalSales / item.count : 0,
            count: item.count
        }));

        fetch(`${API_BASE}/api/ai/sales-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salesList, dailyStats, hourlyStats })
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || data.detail || `서버 오류 (${res.status})`);
                }
                return data;
            })
            .then(data => {
                setAiAnalysis(data.analysis || "");
                setLoading(false);
            })
            .catch(err => {
                console.error("AI 분석 실패:", err);
                setAiError(err.message || "AI 분석 중 오류가 발생했습니다.");
                setLoading(false);
            });
    };

    // ── 매출 예측 ──
    const [forecastData, setForecastData] = useState([]);
    const [forecastInsight, setForecastInsight] = useState("");
    const [forecastLoading, setForecastLoading] = useState(false);
    const [growthRate, setGrowthRate] = useState(0);
    const [forecastError, setForecastError] = useState("");

    const handleForecast = () => {
        setForecastLoading(true);
        setForecastError("");
        setForecastData([]);
        setForecastInsight("");

        const monthlyData = monthlyStats.map(m => ({
            month: m.month,
            revenue: m.revenue
        }));

        fetch(`${API_BASE}/api/ai/sales-forecast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ monthlyData })
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || data.detail || `서버 오류 (${res.status})`);
                }
                return data;
            })
            .then(data => {
                setForecastData(data.forecastData || []);
                setForecastInsight(data.insight || "");
                setGrowthRate(data.growthRate || 0);
                setForecastLoading(false);
            })
            .catch(err => {
                console.error("예측 실패:", err);
                setForecastError(err.message || "예측 중 오류가 발생했습니다.");
                setForecastLoading(false);
            });
    };

    return (
        <div className="report-container">
            <h2>🤖 AI 매출 분석 &amp; 예측</h2>

            {/* 실행 버튼 */}
            <div className="ai-action-bar">
                <button className="ai-btn ai-btn--primary" onClick={handleAiAnalysis} disabled={loading}>
                    🤖 {loading ? "분석 중..." : "AI 매출 분석"}
                </button>
                <button className="ai-btn ai-btn--secondary" onClick={handleForecast} disabled={forecastLoading}>
                    📈 {forecastLoading ? "예측 중..." : "매출 예측"}
                </button>
            </div>

            {!aiAnalysis && !aiError && !forecastData.length && !forecastError && (
                <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    버튼을 눌러 AI 매출 분석 또는 매출 예측을 실행하세요.
                </div>
            )}

            {/* AI 분석 에러 */}
            {aiError && (
                <div style={{
                    marginTop: 20, padding: '16px 20px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 10, color: '#b91c1c', fontSize: 14
                }}>
                    ⚠️ {aiError}
                </div>
            )}

            {aiAnalysis && (
                <div className="ai-analysis-box">
                    <div className="ai-analysis-header">
                        <div className="ai-analysis-icon">🤖</div>
                        <span className="ai-analysis-title">AI 매출 분석 결과</span>
                        <span className="ai-analysis-badge">Gemini 2.5</span>
                    </div>
                    <div className="ai-analysis-body">
                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* 예측 에러 */}
            {forecastError && (
                <div style={{
                    marginTop: 20, padding: '16px 20px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 10, color: '#b91c1c', fontSize: 14
                }}>
                    ⚠️ {forecastError}
                </div>
            )}

            {forecastData.length > 0 && (
                <div className="forecast-section">
                    <div className="forecast-header">
                        <h3 className="forecast-title">📈 매출 예측</h3>
                        <div className="forecast-meta">
                            <span className="forecast-model-badge">Prophet</span>
                            <span className={`forecast-growth-badge ${growthRate >= 0 ? 'forecast-growth-badge--up' : 'forecast-growth-badge--down'}`}>
                                {growthRate >= 0 ? '▲' : '▼'} {Math.abs(growthRate)}%
                            </span>
                        </div>
                    </div>

                    <div className="forecast-legend">
                        <div className="forecast-legend-item">
                            <span className="forecast-legend-dot forecast-legend-dot--actual"></span>
                            실측 매출
                        </div>
                        <div className="forecast-legend-item">
                            <span className="forecast-legend-dot forecast-legend-dot--predicted"></span>
                            예측 매출
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={forecastData}>
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {forecastData.map((entry, index) => (
                                    <Cell key={index} fill={entry.isPredicted ? "#fecaca" : "#ef4444"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {forecastInsight && (
                        <div className="forecast-insight-box">
                            <span className="forecast-insight-icon">💡</span>
                            <div className="forecast-insight-text">
                                <span className="forecast-insight-label">AI Insight</span>
                                {forecastInsight}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SalesAnalysis;
