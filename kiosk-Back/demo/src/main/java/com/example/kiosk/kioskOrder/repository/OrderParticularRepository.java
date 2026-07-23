package com.example.kiosk.kioskOrder.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderParticular;
import com.example.kiosk.kioskOrder.repository.projection.MenuStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MonthlyMenuStatProjection;

@Repository
// OrderParticularRepository.java
public interface OrderParticularRepository extends JpaRepository<OrderParticular, Long> {

    List<OrderParticular> findByOrderId(Long orderId);

    List<OrderParticular> findByOrderIdIn(List<Long> orderIds);

     // 메뉴별 판매 수량 / 순수 매출 집계 (메뉴 개수만큼만 반환되므로 주문이 늘어도 크기 고정)
    @Query(value = """
        SELECT m.name AS menuName, m.category AS category,
               SUM(op.quantity) AS count,
               SUM(op.quantity * m.price) AS totalSales
        FROM order_menu op
        JOIN menu m ON m.id = op.menu_id
        GROUP BY m.id, m.name, m.category
        """, nativeQuery = true)
    List<MenuStatProjection> getMenuStats();

    // 오늘자 순수 매출 (옵션 제외, 메뉴 가격 * 수량)
    @Query(value = """
        SELECT SUM(op.quantity * m.price)
        FROM order_menu op
        JOIN orders o ON o.id = op.order_id
        JOIN menu m ON m.id = op.menu_id
        WHERE DATE(o.created_at) = CURRENT_DATE
        """, nativeQuery = true)
    Long getTodayPureRevenue();

    // 월별 + 메뉴별 판매 통계 전체 (달마다 몇 개씩 팔렸는지, count 내림차순)
    // 프론트에서 month 기준으로 그룹핑해서 "이 달 클릭 -> 메뉴 리스트" 형태로 쓰면 됨
    @Query(value = """
        SELECT TO_CHAR(o.created_at, 'YYYY-MM') AS month,
               m.name AS menuName,
               m.category AS category,
               SUM(op.quantity) AS count,
               SUM(op.quantity * m.price) AS totalSales
        FROM order_menu op
        JOIN orders o ON o.id = op.order_id
        JOIN menu m ON m.id = op.menu_id
        GROUP BY TO_CHAR(o.created_at, 'YYYY-MM'), m.id, m.name, m.category
        ORDER BY month, count DESC
        """, nativeQuery = true)
    List<MonthlyMenuStatProjection> getMonthlyMenuStats();

    // 특정 월 하나만 콕 집어서 조회 (드릴다운 클릭 시 이걸 호출해도 됨)
    @Query(value = """
        SELECT TO_CHAR(o.created_at, 'YYYY-MM') AS month,
               m.name AS menuName,
               m.category AS category,
               SUM(op.quantity) AS count,
               SUM(op.quantity * m.price) AS totalSales
        FROM order_menu op
        JOIN orders o ON o.id = op.order_id
        JOIN menu m ON m.id = op.menu_id
        WHERE TO_CHAR(o.created_at, 'YYYY-MM') = :month
        GROUP BY m.id, m.name, m.category
        ORDER BY count DESC
        """, nativeQuery = true)
    List<MonthlyMenuStatProjection> getMenuStatsByMonth(@Param("month") String month);
}