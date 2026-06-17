package com.example.kiosk.kioskOrder;

import com.example.kiosk.kioskOrder.entity.OrderMaster;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class OrderResponseDto {
    private Long id;                     // 주문 번호
    private int totalPrice;              // 총 결제 금액
    private List<OrderDetailDto> orderItems; // 🌟 상세 메뉴들을 담을 리스트 생성
    private LocalDateTime createdAt;  // ✅ 추가

    public OrderResponseDto(OrderMaster orderMaster) {
        this.id = orderMaster.getId();
        this.totalPrice = orderMaster.getTotalPrice();
        this.createdAt = orderMaster.getCreatedAt();  // ✅ 추가
    }

    // 🌟 메뉴 이름과 수량, 옵션을 묶어서 관리할 내부 내부 클래스(DTO)
    @Getter
    @Setter
    public static class OrderDetailDto {
        private String menuName; // 메뉴명 (예: 아메리카노)
        private int quantity;    // 수량
        private String options;  // 선택한 옵션들 (예: "샷추가, 시럽추가")
        private int price;       // 주문 메뉴 가격 가져오기
        private String category;
    }
}