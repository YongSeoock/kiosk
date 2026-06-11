package com.example.kiosk.kioskOrder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter @Setter
public class OrderMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now(); // 주문 시간 자동 입력
}