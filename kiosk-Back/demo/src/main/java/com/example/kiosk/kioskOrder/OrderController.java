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
        Long orderId = orderService.createOrder(requestDto); // 생성된 주문 ID 받아오기
        return ResponseEntity.ok(orderId); // 숫자로 주문번호 직접 응답
    }
    
    // 전체 조회가 아니라 '대기 중인 주문 목록'만 불러오도록 변경
    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getActiveOrders() {
        // Service에서 대기 중인 주문(isCompleted = false)만 조회하는 메서드로 변경
        List<OrderResponseDto> orders = orderService.getActiveOrders(); 
        return ResponseEntity.ok(orders);
    }

    // 리액트에서 완료 버튼을 눌렀을 때 호출할 API
    @PostMapping("/{orderId}/complete")
    public ResponseEntity<Void> completeOrder(@PathVariable(name = "orderId") Long orderId) {
        orderService.completeOrder(orderId);
        return ResponseEntity.ok().build(); // 리액트의 res.ok를 만족시키기 위해 200 OK 응답
    }
}