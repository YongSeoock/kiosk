import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './dashboardReport.css';

function DashboardReport() {
    const [summary, setSummary] = useState(null);

    // 카테고리 및 페이지네이션 상태 관리
    const [currentCategory, setCurrentCategory] = useState("전체");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 🌟 기간 선택 (전체 / 특정 월) - 드롭다운으로 차트+테이블 동시 제어
    const [selectedPeriod, setSelectedPeriod] = useState("전체");

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/orders/report/summary`)
            .then(res => res.json())
            .then(data => setSummary(data))
            .catch(err => console.error("데이터 로드 실패:", err));
    }, []);

    const totalRevenue = summary?.totalRevenue ?? 0;
    const todayOrderCount = summary?.todayOrderCount ?? 0;
    const todayTotalRevenue = summary?.todayTotalRevenue ?? 0;
    const todayPureRevenue = summary?.todayPureRevenue ?? 0;
    const todayOptionRevenue = todayTotalRevenue - todayPureRevenue;
    const avgOrderPrice = todayOrderCount > 0 ? Math.round(todayTotalRevenue / todayOrderCount) : 0;

    const dailyStats = summary?.dailyStats ?? [];
    const hourlyStats = summary?.hourlyStats ?? [];
    const monthlyStats = summary?.monthlyStats ?? [];
    const monthlyMenuStats = summary?.monthlyMenuStats ?? []; // 월별 메뉴 통계 원본

    // 데이터가 존재하는 월 목록 (백엔드에서 이미 오름차순 정렬됨)
    const availableMonths = monthlyStats.map(m => m.month);

    // ── 전체 메뉴 통계 (원본, KPI '인기 메뉴 1위' 카드는 항상 전체 기준으로 유지) ──
    const allStatsOverall = (summary?.menuStats ?? []).map(m => ({
        name: m.menuName,
        category: m.category,
        count: m.count,
        totalSales: m.totalSales
    }));

    // ── 선택된 기간에 따라 차트/테이블이 사용할 데이터 결정 ──
    const allStats = selectedPeriod === "전체"
        ? allStatsOverall
        : monthlyMenuStats
            .filter(m => m.month === selectedPeriod)
            .map(m => ({
                name: m.menuName,
                category: m.category,
                count: m.count,
                totalSales: m.totalSales
            }));

    // DB에 존재하는 카테고리 종류 동적 추출 (선택된 기간 데이터 기준)
    const availableCategories = ["전체", ...new Set(allStats.map(item => item.category))];

    // 카테고리 필터링 적용
    const filteredStats = allStats.filter(item =>
        currentCategory === "전체" ? true : item.category === currentCategory
    );

    // 테이블용 정렬 (선택된 카테고리 내에서 판매량 순)
    const sortedStats = [...filteredStats].sort((a, b) => b.count - a.count);

    // 차트용 TOP 20 데이터 정렬
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

    // 기간 변경 시 카테고리/페이지 초기화 (다른 기간에서 고른 카테고리가 없을 수 있으므로)
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setCurrentCategory("전체");
        setCurrentPage(1);
    };

    // 인기 메뉴 1위는 항상 전체 기준으로 표시 (KPI 카드는 기간 선택과 무관)
    const bestMenu = [...allStatsOverall].sort((a, b) => b.count - a.count)[0];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
                    <span className="kpi-sub" style={{ color: '#555', fontWeight: '500' }}>
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

            {/* 🌟 기간 선택 드롭다운 (차트 + 테이블 동시 제어) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <label htmlFor="period-select" style={{ fontWeight: '600', color: '#333' }}>
                    📅 조회 기간
                </label>
                <select
                    id="period-select"
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="전체">전체</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            {/* 시각화 차트 구역 */}
            <div className="chart-section" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                    📈 메뉴별 판매 수량에 따른 순위 {selectedPeriod !== "전체" && `(${selectedPeriod})`}
                </h3>
                <div style={{ width: '100%', height: 300 }}>
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
                            {selectedPeriod === "전체" ? "차트를 표시할 판매 데이터가 없습니다." : `${selectedPeriod}에 판매 데이터가 없습니다.`}
                        </div>
                    )}
                </div>
            </div>

            {/* 테이블 상단 필터 헤더 구역 */}
            <div className="section-header">
                <h3>📋 메뉴별 상세 판매 현황 {selectedPeriod !== "전체" && `(${selectedPeriod})`}</h3>
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
                                {selectedPeriod === "전체" ? "해당 카테고리에 판매 데이터가 없습니다." : `${selectedPeriod}의 해당 카테고리에 판매 데이터가 없습니다.`}
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
        </div>
    );
}

export default DashboardReport;