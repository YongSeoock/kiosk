package com.example.kiosk.kioskOrder.repository.projection;

public interface MenuStatProjection {
    String getMenuName(); 
    String getCategory(); 
    Long getCount(); 
    Long getTotalSales();
}
