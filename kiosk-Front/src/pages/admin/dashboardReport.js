import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './dashboardReport.css';
import ReactMarkdown from 'react-markdown';

function DashboardReport() {
    const [orders, setOrders] = useState([]);
    
    // 카테고리 및 페이지네이션 상태 관리
    const [currentCategory, setCurrentCategory] = useState("전체");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; 

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/orders/report`)
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error("데이터 로드 실패:", err));
    }, []);

    // 🌟 안전하고 직관적인 방식으로 데이터 가공 
    const statsMap = {};

    // 💡 orders가 존재하고, '진짜 배열'일 때만 내부 로직을 실행하도록 방어막 추가
    if (orders && Array.isArray(orders)) {
        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                const cleanMenuName = item.menuName ? item.menuName.trim() : "";
                if (!cleanMenuName) return;

                if (!statsMap[cleanMenuName]) {
                    statsMap[cleanMenuName] = {
                        name: cleanMenuName,
                        count: 0,
                        totalSales: 0,
                        category: item.category || "기타" // 백엔드에서 준 카테고리 바로 매핑
                    };
                }
                
                statsMap[cleanMenuName].count += item.quantity;
                statsMap[cleanMenuName].totalSales += (item.price || 0) * item.quantity;
            });
        });
    } else {
        // 💡 5만 건 대용량 처리 시 API가 에러를 뱉거나 객체로 주면 여기에 걸립니다.
        console.warn("orders가 배열이 아니거나 비어있습니다. 현재 데이터 상태:", orders);
    }

    /*const statsMap = {};

    orders?.forEach(order => {
        order.orderItems?.forEach(item => {
            const cleanMenuName = item.menuName ? item.menuName.trim() : "";
            if (!cleanMenuName) return;

            if (!statsMap[cleanMenuName]) {
                statsMap[cleanMenuName] = {
                    name: cleanMenuName,
                    count: 0,
                    totalSales: 0,
                    category: item.category || "기타" // 백엔드에서 준 카테고리 바로 매핑
                };
            }
            
            statsMap[cleanMenuName].count += item.quantity;
            statsMap[cleanMenuName].totalSales += (item.price || 0) * item.quantity;
        });
    });*/

    // 가공된 객체를 배열로 변환
    const allStats = Object.values(statsMap);

    // DB에 존재하는 카테고리 종류 동적 추출
    const availableCategories = ["전체", ...new Set(allStats.map(item => item.category))];

    // 카테고리 필터링 적용
    const filteredStats = allStats.filter(item => 
        currentCategory === "전체" ? true : item.category === currentCategory
    );

    // 테이블용 정렬 (선택된 카테고리 내에서 판매량 순)
    const sortedStats = [...filteredStats].sort((a, b) => b.count - a.count);

    // 🌟 차트용 TOP 20 데이터 정렬 (차트가 사라지지 않도록 전체 데이터 기준으로 안전하게 추출)
    const chartData = [...allStats]
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(item => ({
            name: item.name,
            value: item.count,      // 수량 (Bar 차트가 그릴 값)
            sales: item.totalSales  // 툴팁용 매출액
        }));

    // 페이지네이션 계산
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedStats.slice(indexOfFirstItem, indexOfLastItem); 
    const totalPages = Math.ceil(sortedStats.length / itemsPerPage);

    const handleCategoryChange = (category) => {
        setCurrentCategory(category);
        setCurrentPage(1);
    };

    // 오늘 날짜 정산 데이터 계산
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayOrders = orders?.filter(order => {
        if (!order.createdAt) return false;
        const orderDateStr = order.createdAt.includes('T') ? order.createdAt.split('T')[0] : order.createdAt.slice(0, 10);
        return orderDateStr.trim() === todayStr;
    });

    // 1. 순수 매출 초기화 및 누적 계산 (가장 먼저 수행)
    let todayPureRevenue = 0;
    todayOrders?.forEach(order => {
        order.orderItems?.forEach(item => { todayPureRevenue += (item.price || 0) * item.quantity; });
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const todayTotalRevenue = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const todayOptionRevenue = todayTotalRevenue - todayPureRevenue;
    const todayOrderCount = todayOrders.length;
    const avgOrderPrice = todayOrderCount > 0 ? Math.round(todayTotalRevenue / todayOrderCount) : 0;

    // 인기메뉴 1위 추출
    const bestMenu = allStats.sort((a, b) => b.count - a.count)[0];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    const [aiAnalysis, setAiAnalysis] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAiAnalysis = () => {
        setLoading(true);

        // 기존 메뉴별 데이터
        const salesList = allStats.map(item => ({
            menuName: item.name,
            category: item.category,
            price: item.totalSales / item.count,
            count: item.count
        }));

        // 요일별 매출 집계
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayMap = {};
        orders.forEach(order => {
            if (!order.createdAt) return;
            const day = dayNames[new Date(order.createdAt).getDay()];
            if (!dayMap[day]) dayMap[day] = { count: 0, revenue: 0 };
            dayMap[day].count += 1;
            dayMap[day].revenue += order.totalPrice || 0;
        });
        const dailyStats = Object.entries(dayMap).map(([day, v]) => ({
            day,
            orderCount: v.count,
            revenue: v.revenue
        }));

        // 시간대별 매출 집계
        const hourMap = {};
        orders.forEach(order => {
            if (!order.createdAt) return;
            const hour = new Date(order.createdAt).getHours();
            const slot = `${hour}시`;
            if (!hourMap[slot]) hourMap[slot] = { count: 0, revenue: 0 };
            hourMap[slot].count += 1;
            hourMap[slot].revenue += order.totalPrice || 0;
        });
        const hourlyStats = Object.entries(hourMap)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([hour, v]) => ({
                hour,
                orderCount: v.count,
                revenue: v.revenue
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

    // AI 시각화를 위한 코드
    const [forecastData, setForecastData] = useState([]);
    const [forecastInsight, setForecastInsight] = useState("");
    const [forecastLoading, setForecastLoading] = useState(false);
    const [growthRate, setGrowthRate] = useState(0);

    const handleForecast = () => {
        setForecastLoading(true);

        // 월별 매출 합산
        const monthlyMap = {};
        orders.forEach(order => {
            if (!order.createdAt) return;
            const month = order.createdAt.slice(0, 7); // "2026-01"
            if (!monthlyMap[month]) monthlyMap[month] = 0;
            monthlyMap[month] += order.totalPrice || 0;
        });

        const monthlyData = Object.entries(monthlyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, revenue]) => ({ month, revenue }));

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
            <h2>📊 매출 통계 리포트</h2>

            {/* KPI 요약 카드 */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">전체 누적 매출</span>
                    <span className="kpi-value">{totalRevenue.toLocaleString()}원</span>
                    <span className="kpi-sub">전체 주문 기준</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">오늘 총 매출</span>
                    <span className="kpi-value">{todayTotalRevenue.toLocaleString()}원</span>
                    <span className="kpi-sub" style={{color: '#555', fontWeight: '500'}}>
                        (순수: {todayPureRevenue.toLocaleString()}원 / 옵션: {todayOptionRevenue.toLocaleString()}원)
                    </span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">오늘 주문 건수</span>
                    <span className="kpi-value">{todayOrderCount}건</span>
                    <span className="kpi-sub">오늘 기준</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">평균 객단가</span>
                    <span className="kpi-value">{avgOrderPrice.toLocaleString()}원</span>
                    <span className="kpi-sub">오늘 주문 평균</span>
                </div>
                <div className="kpi-card kpi-card--best">
                    <span className="kpi-label">🏆 인기 메뉴 1위</span>
                    <span className="kpi-value">{bestMenu ? bestMenu.name : '-'}</span>
                    <span className="kpi-sub">{bestMenu ? `${bestMenu.count}개 판매` : '데이터 없음'}</span>
                </div>
            </div>

            {/* 시각화 차트 구역 */}
            <div className="chart-section" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📈 메뉴별 판매 수량에 따른 순위</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {/* 🌟 데이터가 없을 때 차트가 깨지는 것을 방지하는 예외 조건문 추가 */}
                    {chartData.length > 0 ? (
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip formatter={(value, name) => [name === 'value' ? `${value}개` : `${value.toLocaleString()}원`, name === 'value' ? '판매 수량' : '순수 매출액']} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
                            차트를 표시할 판매 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 테이블 상단 필터 헤더 구역 */}
            <div className="section-header">
                <h3>📋 메뉴별 상세 판매 현황</h3>
                <div className="category-tabs">
                    {availableCategories.map(cat => (
                        <button 
                            key={cat}
                            className={`tab-btn ${currentCategory === cat ? "active" : ""}`}
                            onClick={() => handleCategoryChange(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 데이터 테이블 구역 */}
            <table className="report-table">
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>카테고리</th>
                        <th>메뉴명</th>
                        <th>판매 수량</th>
                        <th>순수 매출액 (옵션 제외)</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item, index) => (
                        <tr key={item.name}>
                            <td>{indexOfFirstItem + index + 1}</td>
                            <td><span className={`badge badge-${item.category}`}>{item.category}</span></td>
                            <td>{item.name}</td>
                            <td>{item.count}개</td>
                            <td>{item.totalSales.toLocaleString()}원</td>
                        </tr>
                    ))}
                    {currentItems.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                해당 카테고리에 판매 데이터가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* 숫자 버튼형 페이지네이션 */}
            {totalPages > 1 && (
                <div className="pagination" style={{ textAlign: 'center', marginTop: '20px' }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button 
                            key={i} 
                            style={{ 
                                padding: '5px 10px', 
                                margin: '0 4px', 
                                backgroundColor: currentPage === i + 1 ? '#007bff' : '#fff', 
                                color: currentPage === i + 1 ? '#fff' : '#000', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* 매출 분석 AI */}
            <div className="ai-action-bar">
                <button className="ai-btn ai-btn--primary" onClick={handleAiAnalysis} disabled={loading}>
                    🤖 {loading ? "분석 중..." : "AI 매출 분석"}
                </button>
                <button className="ai-btn ai-btn--secondary" onClick={handleForecast} disabled={forecastLoading}>
                    📈 {forecastLoading ? "예측 중..." : "매출 예측"}
                </button>
            </div>

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

export default DashboardReport;