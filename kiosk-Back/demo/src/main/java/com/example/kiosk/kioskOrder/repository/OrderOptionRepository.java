package com.example.kiosk.kioskOrder.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderOption;

@Repository
public interface OrderOptionRepository extends JpaRepository<OrderOption, Long> {
    List<OrderOption> findByOrderMenuId(Long orderMenuId); // order_menu_id로 옵션들 긁어오기
    List<OrderOption> findByOrderMenuIdIn(List<Long> orderMenuIds);
}