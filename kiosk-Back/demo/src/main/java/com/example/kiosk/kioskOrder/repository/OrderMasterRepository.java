package com.example.kiosk.kioskOrder.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderMaster;

@Repository
public interface OrderMasterRepository extends JpaRepository<OrderMaster, Long> {
    List<OrderMaster> findByIsCompletedFalse();
}

