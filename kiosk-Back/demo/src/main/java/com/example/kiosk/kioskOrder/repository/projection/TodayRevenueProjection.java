package com.example.kiosk.kioskOrder.repository.projection;

public interface TodayRevenueProjection {
    Long getOrderCount(); 
    Long getRevenue();
}