package com.example.kiosk.kioskMenu;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 👈 추가됨
import com.example.kiosk.kioskMenu.entity.Menu;
import com.example.kiosk.kioskMenu.repository.MenuRepository;
import java.util.List;

@Service
public class MenuService {

    private final MenuRepository menuRepository;

    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public List<MenuResponseDto> getMenusByCategory(String category) {
        List<Menu> menus;

        if ("신메뉴".equals(category)) {
            menus = menuRepository.findByIsNewTrue();
        } else if ("전체".equals(category)) {
            menus = menuRepository.findAllWithOptions(); 
        } else {
            menus = menuRepository.findByCategory(category); 
        }

        return menus.stream()
                .map(MenuResponseDto::new)
                .toList();
    }

    // 🌟 품절 상태 및 기간 업데이트 로직 추가
    @Transactional
    public void updateSoldOut(Long id, SoldOutRequestDto request) {
        Menu menu = menuRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("해당 메뉴가 없습니다. id=" + id));
        
        // 수동 DTO의 Getter 이름으로 정확히 매핑
        menu.setSoldOut(request.isIsSoldOut()); 
        menu.setSoldOutUntil(request.getSoldOutUntil());
    }
}