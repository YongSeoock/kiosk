import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './dashboardReport.css'; // 기존 스타일(ai-analysis-box, forecast-section 등) 재사용
import ReactMarkdown from 'react-markdown';

function SalesAnalysis() {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/orders/report/summary`)
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

    const handleAiAnalysis = () => {
        setLoading(true);

        const salesList = allStats.map(item => ({
            menuName: item.name,
            category: item.category,
            price: item.count > 0 ? item.totalSales / item.count : 0,
            count: item.count
        }));

        fetch("http://127.0.0.1:8000/api/v1/kiosk/sales-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salesList, dailyStats, hourlyStats })
        })
            .then(res => res.json())
            .then(data => {
                setAiAnalysis(data.analysis);
                setLoading(false);
            })
            .catch(err => {
                console.error("AI 분석 실패:", err);
                setLoading(false);
            });
    };

    // ── 매출 예측 ──
    const [forecastData, setForecastData] = useState([]);
    const [forecastInsight, setForecastInsight] = useState("");
    const [forecastLoading, setForecastLoading] = useState(false);
    const [growthRate, setGrowthRate] = useState(0);

    const handleForecast = () => {
        setForecastLoading(true);

        const monthlyData = monthlyStats.map(m => ({
            month: m.month,
            revenue: m.revenue
        }));

        fetch("http://127.0.0.1:8000/api/v1/kiosk/sales-forecast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ monthlyData })
        })
            .then(res => res.json())
            .then(data => {
                setForecastData(data.forecastData);
                setForecastInsight(data.insight);
                setGrowthRate(data.growthRate);
                setForecastLoading(false);
            })
            .catch(err => {
                console.error("예측 실패:", err);
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

            {!aiAnalysis && !forecastData.length && (
                <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    버튼을 눌러 AI 매출 분석 또는 매출 예측을 실행하세요.
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