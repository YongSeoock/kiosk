package com.example.kiosk.kioskOrder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "order_menu_option")
@Getter @Setter
public class OrderOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_menu_id", nullable = false)
    private Long orderMenuId;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(nullable = false)
    private Integer quantity;
}