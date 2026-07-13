package com.example.kiosk.kioskOrder.repository.projection;

public interface MonthlyStatProjection {
    String getMonth();
    Long getRevenue();
}