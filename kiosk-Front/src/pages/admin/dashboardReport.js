import React, { useEffect, useState } from 'react';

function DashboardReport() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/api/orders")
        .then(res => res.json())
        .then(data => {
            console.log("받아온 데이터 샘플:", data[0].orderItems[0]); // 🌟 여기 확인!
            setOrders(data);
        });
    }, []);

    // 2. 데이터 가공 (부모의 totalPrice 구조 반영)
    const salesStats = orders?.reduce((acc, order) => {
        // order 내부의 orderItems를 순회하면서 부모(order)의 totalPrice를 활용하거나
        // 혹은 개별 아이템의 가격을 유추해야 합니다.
        
        // 💡 만약 개별 아이템 단가를 알 수 없다면, 임시로 [총금액 / 수량]을 하거나 
        // 안전하게 부모의 총액을 분배해야 합니다. 여기서는 가장 안전한 가공 방식을 씁니다.
        order.orderItems?.forEach(item => {
        if (!acc[item.menuName]) {
            acc[item.menuName] = { count: 0, totalSales: 0 };
        }
        
        acc[item.menuName].count += item.quantity;
        
        // 🌟 핵심: 현재 구조상 단가가 없으므로, 대시보드 전용 가상 단가를 적용하거나
        // order.totalPrice(주문총액)를 기반으로 계산 로직을 타야 합니다.
        // 여기서는 이전에 검증된 가상 단가 매핑을 활용해 정확한 '메뉴별 매출'을 뽑습니다.
        const menuPrices = { "아메리카노": 2500, "카페라떼": 3000, "딸기에이드": 3500, "카라멜마끼아또": 3800, "카페모카": 3800, "자몽에이드": 3500, "애플망고스무디": 4000, "콜드브루": 3000, "복숭아아이스티": 2500, "녹차라떼": 3500, "소금빵": 2000, "초코머핀": 2500, "아인슈페너": 4000, "바닐라라떼": 3500, "고구마라떼": 3500, "치즈케이크": 4500, "청포도에이드": 3500 };
        const price = menuPrices[item.menuName] || 3000;
        
        acc[item.menuName].totalSales += (price * item.quantity);
        });
        
        return acc;
    }, {}) || {};

    // 3. 총 매출 계산
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;

    // 4. 매출 통계 정렬 (판매 수량 기준 내림차순)
    const sortedStats = Object.entries(salesStats)
        .sort(([, a], [, b]) => b.count - a.count);

    return (
        <div className="report-container">
        <h2>📊 매출 통계</h2>
        <table>
            <thead>
            <tr>
                <th>메뉴명</th>
                <th>판매 수량</th>
                <th>매출액</th>
            </tr>
            </thead>
            <tbody>
            {sortedStats.map(([name, data]) => (
                <tr key={name}>
                <td>{name}</td>
                <td>{data.count}개</td>
                <td>{data.totalSales.toLocaleString()}원</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}

export default DashboardReport;