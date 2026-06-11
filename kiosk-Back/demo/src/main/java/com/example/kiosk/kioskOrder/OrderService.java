package com.example.kiosk.kioskOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.kiosk.kioskOrder.entity.OrderMaster;
import com.example.kiosk.kioskOrder.entity.OrderOption;
import com.example.kiosk.kioskOrder.entity.OrderParticular;
import com.example.kiosk.kioskOrder.repository.OrderMasterRepository;
import com.example.kiosk.kioskOrder.repository.OrderOptionRepository;
import com.example.kiosk.kioskOrder.repository.OrderParticularRepository;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMasterRepository orderMasterRepository;
    private final OrderParticularRepository orderParticularRepository;
    private final OrderOptionRepository orderOptionRepository;

    @Transactional
    public Long createOrder(OrderRequestDto requestDto) {
        // 1. orders 테이블 저장
        OrderMaster orderMaster = new OrderMaster();
        orderMaster.setTotalPrice(requestDto.getTotalPrice());
        OrderMaster savedMaster = orderMasterRepository.save(orderMaster);

        // 2. order_menu 테이블 저장
        for (OrderRequestDto.OrderItemDto itemDto : requestDto.getOrderItems()) {
            OrderParticular orderParticular = new OrderParticular();
            orderParticular.setOrderId(savedMaster.getId());
            orderParticular.setMenuId(itemDto.getMenuId());
            orderParticular.setQuantity(itemDto.getQuantity());
            
            OrderParticular savedParticular = orderParticularRepository.save(orderParticular);

            // 3. order_menu_option 테이블에 상세 옵션들 저장
            if (itemDto.getOptions() != null) {
                for (OrderRequestDto.OrderOptionDto optDto : itemDto.getOptions()) {
                    OrderOption orderOption = new OrderOption();
                    orderOption.setOrderMenuId(savedParticular.getId());
                    orderOption.setOptionId(optDto.getOptionId());
                    orderOption.setQuantity(optDto.getQuantity());
                    
                    orderOptionRepository.save(orderOption);
                }
            }
        }

        // 💡 [여기 추가!!] 생성된 주문 마스터의 ID(주문번호)를 반드시 리턴해줘야 합니다.
        return savedMaster.getId(); 
    }
}