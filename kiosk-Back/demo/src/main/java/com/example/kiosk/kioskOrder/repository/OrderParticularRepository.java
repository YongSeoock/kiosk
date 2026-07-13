package com.example.kiosk.kioskOrder.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderParticular;
import com.example.kiosk.kioskOrder.repository.projection.MenuStatProjection;

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
}