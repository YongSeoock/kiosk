package com.example.kiosk.kioskOrder;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.kiosk.kioskOrder.entity.OrderMaster;
import com.example.kiosk.kioskOrder.entity.OrderOption;
import com.example.kiosk.kioskOrder.entity.OrderParticular;
import com.example.kiosk.kioskOrder.repository.OrderMasterRepository;
import com.example.kiosk.kioskOrder.repository.OrderOptionRepository;
import com.example.kiosk.kioskOrder.repository.OrderParticularRepository;
import com.example.kiosk.kioskOrder.repository.projection.DayStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.HourStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MenuStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.MonthlyStatProjection;
import com.example.kiosk.kioskOrder.repository.projection.TodayRevenueProjection;
import com.example.kiosk.kioskMenu.entity.Menu;
import com.example.kiosk.kioskMenu.entity.ProductOption;
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

    public record SalesReportDto(
        Long totalRevenue,
        List<MenuStatProjection> menuStats,
        List<DayStatProjection> dailyStats,
        List<HourStatProjection> hourlyStats,
        List<MonthlyStatProjection> monthlyStats,
        Long todayOrderCount,
        Long todayTotalRevenue,
        Long todayPureRevenue
    ) {}

   @Transactional(readOnly = true)
        public SalesReportDto getSalesReportSummary() {
        List<MenuStatProjection> menuStats = orderParticularRepository.getMenuStats();
        List<DayStatProjection> dailyStats = orderMasterRepository.getDailyStats();
        List<HourStatProjection> hourlyStats = orderMasterRepository.getHourlyStats();
        List<MonthlyStatProjection> monthlyStats = orderMasterRepository.getMonthlyStats();

        TodayRevenueProjection today = orderMasterRepository.getTodayRevenue();
        Long todayPure = orderParticularRepository.getTodayPureRevenue();
        Long totalRevenue = orderMasterRepository.getTotalRevenue();

        return new SalesReportDto(
                totalRevenue != null ? totalRevenue : 0L,
                menuStats,
                dailyStats,
                hourlyStats,
                monthlyStats,
                today.getOrderCount() != null ? today.getOrderCount() : 0L,
                today.getRevenue() != null ? today.getRevenue() : 0L,
                todayPure != null ? todayPure : 0L
        );
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

    private List<OrderResponseDto> convertToResponseDtoList(List<OrderMaster> masters) {

    // 1. 주문 ID 목록
    List<Long> masterIds = masters.stream()
            .map(OrderMaster::getId)
            .toList();

    // 2. order_menu 한 번에 조회
    List<OrderParticular> allParticulars = orderParticularRepository.findByOrderIdIn(masterIds);

    // 3. order_menu_id 목록
    List<Long> particularIds = allParticulars.stream()
            .map(OrderParticular::getId)
            .toList();

    // 4. menu, order_menu_option, product_option 한 번에 조회
    List<Long> menuIds = allParticulars.stream()
            .map(OrderParticular::getMenuId)
            .distinct()
            .toList();
    List<Menu> allMenus = menuRepository.findByIdIn(menuIds);
    Map<Long, Menu> menuMap = allMenus.stream()
            .collect(Collectors.toMap(Menu::getId, m -> m));

    List<OrderOption> allOptions = orderOptionRepository.findByOrderMenuIdIn(particularIds);
    List<Long> optionIds = allOptions.stream()
            .map(OrderOption::getOptionId)
            .distinct()
            .toList();
    List<ProductOption> allProductOptions = productOptionRepository.findByIdIn(optionIds);
    Map<Long, ProductOption> productOptionMap = allProductOptions.stream()
            .collect(Collectors.toMap(ProductOption::getId, o -> o));

    // 5. order_menu_option을 order_menu_id 기준으로 그룹핑
    Map<Long, List<OrderOption>> optionsByParticularId = allOptions.stream()
            .collect(Collectors.groupingBy(OrderOption::getOrderMenuId));

    // 6. order_menu를 order_id 기준으로 그룹핑
    Map<Long, List<OrderParticular>> particularsByOrderId = allParticulars.stream()
            .collect(Collectors.groupingBy(OrderParticular::getOrderId));

    // 7. 조합
    return masters.stream()
            .map(master -> {
                OrderResponseDto responseDto = new OrderResponseDto(master);
                List<OrderParticular> particulars = particularsByOrderId
                        .getOrDefault(master.getId(), List.of());

                List<OrderResponseDto.OrderDetailDto> detailDtos = particulars.stream()
                        .map(part -> {
                            OrderResponseDto.OrderDetailDto detailDto = new OrderResponseDto.OrderDetailDto();
                            detailDto.setQuantity(part.getQuantity());

                            Menu menu = menuMap.get(part.getMenuId());
                            if (menu != null) {
                                detailDto.setMenuName(menu.getName());
                                detailDto.setPrice(menu.getPrice());
                                detailDto.setCategory(menu.getCategory());
                            } else {
                                detailDto.setMenuName("알 수 없는 메뉴(ID:" + part.getMenuId() + ")");
                                detailDto.setPrice(0);
                                detailDto.setCategory("기타");
                            }

                            List<OrderOption> options = optionsByParticularId
                                    .getOrDefault(part.getId(), List.of());
                            String combinedOptions = options.stream()
                                    .map(opt -> {
                                        ProductOption po = productOptionMap.get(opt.getOptionId());
                                        return po != null
                                                ? po.getName() + "(+" + opt.getQuantity() + "개)"
                                                : "옵션(ID:" + opt.getOptionId() + ")";
                                    })
                                    .collect(Collectors.joining(", "));

                            detailDto.setOptions(combinedOptions.isEmpty() ? "선택 옵션 없음" : combinedOptions);
                            return detailDto;
                        })
                        .toList();

                responseDto.setOrderItems(detailDtos);
                return responseDto;
            })
            .toList();
    }

    // 💡 초기 개발 방식
    /*private List<OrderResponseDto> convertToResponseDtoList(List<OrderMaster> masters) {
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
    }*/
}