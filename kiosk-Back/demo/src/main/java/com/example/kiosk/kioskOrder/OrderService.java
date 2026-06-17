package com.example.kiosk.kioskOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.kiosk.kioskOrder.entity.OrderMaster;
import com.example.kiosk.kioskOrder.entity.OrderOption;
import com.example.kiosk.kioskOrder.entity.OrderParticular;
import com.example.kiosk.kioskOrder.repository.OrderMasterRepository;
import com.example.kiosk.kioskOrder.repository.OrderOptionRepository;
import com.example.kiosk.kioskOrder.repository.OrderParticularRepository;
import com.example.kiosk.kioskMenu.repository.MenuRepository;
import com.example.kiosk.kioskMenu.repository.ProductOptionRepository;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMasterRepository orderMasterRepository;
    private final OrderParticularRepository orderParticularRepository;
    private final OrderOptionRepository orderOptionRepository;
    private final MenuRepository menuRepository;
    private final ProductOptionRepository productOptionRepository;

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

    // 🌟 [추가] 관리자 페이지를 위한 전체 주문 목록 조회
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllOrders() {
        List<OrderMaster> masters = orderMasterRepository.findAll();
        
        return masters.stream()
                .map(master -> {
                    OrderResponseDto responseDto = new OrderResponseDto(master);
                    
                    // 주문 번호에 해당하는 상세 메뉴 리스트 조회
                    List<OrderParticular> particulars = orderParticularRepository.findByOrderId(master.getId());
                    
                    List<OrderResponseDto.OrderDetailDto> detailDtos = particulars.stream()
                            .map(part -> {
                                OrderResponseDto.OrderDetailDto detailDto = new OrderResponseDto.OrderDetailDto();
                                detailDto.setQuantity(part.getQuantity());
                                
                                // [메뉴명 매핑] menuRepository를 사용해 진짜 메뉴 이름을 찾아옵니다.
                                String realMenuName = menuRepository.findById(part.getMenuId())
                                        .map(menu -> menu.getName()) 
                                        .orElse("알 수 없는 메뉴(ID:" + part.getMenuId() + ")");
                                detailDto.setMenuName(realMenuName);
                                
                                // [옵션명 매핑] orderOptionRepository에서 해당 상세 메뉴에 걸린 옵션들을 찾습니다.
                                List<OrderOption> options = orderOptionRepository.findByOrderMenuId(part.getId());
                                
                                // 🌟 2. 장착한 productOptionRepository를 사용하여 진짜 이름을 한 줄로 합칩니다!
                                String combinedOptions = options.stream()
                                        .map(opt -> {
                                            return productOptionRepository.findById(opt.getOptionId())
                                                    .map(o -> o.getName() + "(+" + opt.getQuantity() + "개)")
                                                    .orElse("옵션(ID:" + opt.getOptionId() + ")");
                                        })
                                        .collect(java.util.stream.Collectors.joining(", "));
                                
                                detailDto.setOptions(combinedOptions.isEmpty() ? "선택 옵션 없음" : combinedOptions);
                                
                                return detailDto;
                            })
                            .toList();
                    
                    responseDto.setOrderItems(detailDtos);
                    return responseDto;
                })
                .toList();
    }
}