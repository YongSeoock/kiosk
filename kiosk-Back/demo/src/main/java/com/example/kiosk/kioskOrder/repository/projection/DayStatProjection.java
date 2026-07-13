package com.example.kiosk.kioskOrder.repository.projection;

public interface DayStatProjection {
    String getDay(); 
    Long getOrderCount(); 
    Long getRevenue();
}
