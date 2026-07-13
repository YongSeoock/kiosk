package com.example.kiosk.kioskOrder.repository.projection;

public interface HourStatProjection {
    String getHour(); 
    Long getOrderCount(); 
    Long getRevenue();
}
