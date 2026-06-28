package com.example.kiosk.kioskOrder.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderParticular;

@Repository
public interface OrderParticularRepository extends JpaRepository<OrderParticular, Long> {
    List<OrderParticular> findByOrderId(Long orderId);
    List<OrderParticular> findByOrderIdIn(List<Long> orderIds);
}