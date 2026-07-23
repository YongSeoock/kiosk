package com.example.kiosk.kioskOrder.repository.projection;

public interface MonthlyMenuStatProjection {
    String getMonth();      // "2025-07" 형태
    String getMenuName();
    String getCategory();
    Long getCount();        // 판매 수량
    Long getTotalSales();   // 순매출 (옵션 제외, 메뉴가격*수량)
}