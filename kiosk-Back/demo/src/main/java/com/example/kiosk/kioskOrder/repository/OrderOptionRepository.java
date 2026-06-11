package com.example.kiosk.kioskOrder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskOrder.entity.OrderOption;

@Repository
public interface OrderOptionRepository extends JpaRepository<OrderOption, Long> {
}