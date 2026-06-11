package com.example.kiosk.kioskOrder;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class OrderRequestDto {
    private int totalPrice;
    private List<OrderItemDto> orderItems;

    @Getter @Setter
    public static class OrderItemDto {
        private Long menuId;
        private int quantity;
        private List<OrderOptionDto> options; // 💡 옵션 리스트 추가받기!
    }

    @Getter @Setter
    public static class OrderOptionDto {
        private Long optionId;
        private int quantity;
    }
}