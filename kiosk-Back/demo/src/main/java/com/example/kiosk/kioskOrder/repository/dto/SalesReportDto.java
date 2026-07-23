package com.example.kiosk.kioskOrder.repository.dto;

import java.util.List;

import com.example.kiosk.kioskOrder.repository.projection.DayStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.HourStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MenuStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MonthlyStatProjection;


public record SalesReportDto(
        Long totalRevenue,
        List<MenuStatProjection> menuStats,
        List<DayStatProjection> dailyStats,
        List<HourStatProjection> hourlyStats,
        List<MonthlyStatProjection> monthlyStats,
        Long todayOrderCount,
        Long todayTotalRevenue,
        Long todayPureRevenue
) {}