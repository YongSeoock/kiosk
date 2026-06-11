package com.example.kiosk.kioskOrder;

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
    
}