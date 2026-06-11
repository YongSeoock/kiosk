package com.example.kiosk.kioskOrder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "order_menu")
@Getter @Setter
public class OrderParticular {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(nullable = false)
    private Integer quantity;
}