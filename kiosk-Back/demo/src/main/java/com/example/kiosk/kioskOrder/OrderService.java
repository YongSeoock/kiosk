package com.example.kiosk.kioskOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        return savedMaster.getId(); 
    }

    // 기존의 전체 조회 (필요 시 보존)
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllOrders() {
        List<OrderMaster> masters = orderMasterRepository.findAll();
        return convertToResponseDtoList(masters);
    }

    // ⭕ [추가] 컨트롤러가 요청하는 '대기 중인 주문 목록'만 필터링 조회
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getActiveOrders() {
        // Repository에 새로 추가할 findByIsCompletedFalseOrderByIdDesc() 메서드 호출
        List<OrderMaster> activeMasters = orderMasterRepository.findByIsCompletedFalse();
        return convertToResponseDtoList(activeMasters);
    }

    // ⭕ [추가] 제조 완료 클릭 시 상태값만 true로 업데이트 (정석 더티체킹)
    @Transactional
    public void completeOrder(Long orderId) {
        OrderMaster orderMaster = orderMasterRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문이 존재하지 않습니다. ID: " + orderId));
        
        // 🌟 OrderMaster 엔티티에 세터가 생성되어 있어야 합니다. (예: setCompleted 혹은 setisCompleted)
        orderMaster.setCompleted(true); 
    }

    // 💡 getAllOrders와 getActiveOrders에서 중복되는 매핑 로직을 분리한 메서드입니다.
    private List<OrderResponseDto> convertToResponseDtoList(List<OrderMaster> masters) {
        return masters.stream()
                .map(master -> {
                    OrderResponseDto responseDto = new OrderResponseDto(master);
                    
                    List<OrderParticular> particulars = orderParticularRepository.findByOrderId(master.getId());
                    
                    List<OrderResponseDto.OrderDetailDto> detailDtos = particulars.stream()
                            .map(part -> {
                                OrderResponseDto.OrderDetailDto detailDto = new OrderResponseDto.OrderDetailDto();
                                detailDto.setQuantity(part.getQuantity());
                                
                                menuRepository.findById(part.getMenuId()).ifPresent(menu -> {
                                    detailDto.setMenuName(menu.getName());
                                    detailDto.setPrice(menu.getPrice());
                                    detailDto.setCategory(menu.getCategory());
                                });

                                if (detailDto.getMenuName() == null) {
                                    detailDto.setMenuName("알 수 없는 메뉴(ID:" + part.getMenuId() + ")");
                                    detailDto.setPrice(0);
                                    detailDto.setCategory("기타");
                                }

                                String realMenuName = menuRepository.findById(part.getMenuId())
                                        .map(menu -> menu.getName()) 
                                        .orElse("알 수 없는 메뉴(ID:" + part.getMenuId() + ")");
                                detailDto.setMenuName(realMenuName);
                                
                                List<OrderOption> options = orderOptionRepository.findByOrderMenuId(part.getId());
                                
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