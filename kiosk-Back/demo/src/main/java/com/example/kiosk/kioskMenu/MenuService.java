package com.example.kiosk.kioskMenu;

import org.springframework.stereotype.Service;
import com.example.kiosk.kioskMenu.entity.Menu;
import com.example.kiosk.kioskMenu.repository.MenuRepository; // 패키지 경로에 맞게 확인 필요
import java.util.List;

@Service
public class MenuService {

    private final MenuRepository menuRepository;

    // 생성자로 주입받기 규칙 유지
    public MenuService(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    public List<MenuResponseDto> getMenusByCategory(String category) {
        List<Menu> menus;

        // 🌟 프론트엔드 탭 값에 따른 DB 조회 분기
        if ("신메뉴".equals(category)) {
            menus = menuRepository.findByIsNewTrue();
        } else if ("전체".equals(category)) {
            menus = menuRepository.findAllWithOptions(); // 옵션 데이터 fetch 조인 메서드
        } else {
            menus = menuRepository.findByCategory(category); // 커피, 음료, 디저트 조건 조회
        }

        // 기존에 컨트롤러나 Dto에서 쓰시던 stream 변환 정석 구조 유지
        return menus.stream()
                .map(MenuResponseDto::new)
                .toList();
    }
}