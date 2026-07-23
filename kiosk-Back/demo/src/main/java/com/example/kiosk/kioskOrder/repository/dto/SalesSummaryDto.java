package com.example.kiosk.kioskOrder.repository.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SalesSummaryDto {
    private String menuName;
    private int totalQuantity;
    private int totalSales;

    public SalesSummaryDto(String menuName, int totalQuantity, int totalSales) {
        this.menuName = menuName;
        this.totalQuantity = totalQuantity;
        this.totalSales = totalSales;
    }
}