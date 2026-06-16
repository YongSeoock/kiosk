package com.example.kiosk.kioskOrder;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 프론트엔드와 연결 시 CORS 에러 방지
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Long> placeOrder(@RequestBody OrderRequestDto requestDto) {
        Long orderId = orderService.createOrder(requestDto); // 💡 생성된 주문 ID 받아오기
        return ResponseEntity.ok(orderId); // 💡 숫자로 주문번호 직접 응답
    }
    
    // 🌟 [추가] 관리자 페이지에서 주문 목록을 불러올 때 쓰는 메서드
    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getAllOrders() {
        // 아직 OrderService에 전체 조회 메서드가 없다면 아래 💡 체크포인트를 참고해 만들어야 합니다.
        List<OrderResponseDto> orders = orderService.getAllOrders(); 
        return ResponseEntity.ok(orders);
    }
    
}