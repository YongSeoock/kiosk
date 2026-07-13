package com.example.kiosk.kioskOrder.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderMaster;
import com.example.kiosk.kioskOrder.repository.projection.DayStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.HourStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MonthlyStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.TodayRevenueProjection;

@Repository
public interface OrderMasterRepository extends JpaRepository<OrderMaster, Long> {

    List<OrderMaster> findByIsCompletedFalse();

    @Query(value = "SELECT SUM(total_price) FROM orders", nativeQuery = true)
    Long getTotalRevenue();

    // 오늘자 주문 건수 / 총 매출 (옵션 포함)
    @Query(value = """
        SELECT COUNT(*) AS orderCount, SUM(total_price) AS revenue
        FROM orders WHERE DATE(created_at) = CURRENT_DATE
        """, nativeQuery = true)
    TodayRevenueProjection getTodayRevenue();

    // 요일별 집계 (PostgreSQL: EXTRACT(DOW ...) → 0=일요일 ~ 6=토요일)
    @Query(value = """
        SELECT CASE EXTRACT(DOW FROM created_at)::int
                 WHEN 0 THEN '일' WHEN 1 THEN '월' WHEN 2 THEN '화'
                 WHEN 3 THEN '수' WHEN 4 THEN '목' WHEN 5 THEN '금' ELSE '토'
               END AS day,
               COUNT(*) AS orderCount,
               SUM(total_price) AS revenue
        FROM orders
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY EXTRACT(DOW FROM created_at)
        """, nativeQuery = true)
    List<DayStatProjection> getDailyStats();

    // 시간대별 집계 (PostgreSQL: EXTRACT(HOUR ...), 문자열 이어붙이기는 ||)
    @Query(value = """
        SELECT EXTRACT(HOUR FROM created_at)::int || '시' AS hour,
               COUNT(*) AS orderCount,
               SUM(total_price) AS revenue
        FROM orders
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY EXTRACT(HOUR FROM created_at)
        """, nativeQuery = true)
    List<HourStatProjection> getHourlyStats();

    // 월별 집계 (매출 예측 그래프용)
    @Query(value = """
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
               SUM(total_price) AS revenue
        FROM orders
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<MonthlyStatProjection> getMonthlyStats();
    
}