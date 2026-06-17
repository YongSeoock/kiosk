package com.example.kiosk.kioskMenu;

import com.example.kiosk.kioskMenu.repository.MenuRepository; // 본인의 Repository 패키지 경로에 맞게 수정
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
public class MenuScheduler {

    private final MenuRepository menuRepository;

    public MenuScheduler(MenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    // 🌟 1분마다 실행 (60000ms = 1분)
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkExpiredSoldOutMenus() {
        LocalDateTime now = LocalDateTime.now();

        // 🌟 품절 기한(sold_out_until)이 현재 시간(now)보다 과거인 메뉴들을 찾아서 자동으로 판매중 처리
        menuRepository.findAll().stream()
            .filter(menu -> menu.isSoldOut() && menu.getSoldOutUntil() != null && menu.getSoldOutUntil().isBefore(now))
            .forEach(menu -> {
                menu.setSoldOut(false);
                menu.setSoldOutUntil(null); // 기한도 초기화
                System.out.println("⏰ [스케줄러] 기한 만료로 메뉴 품절 자동 해제: " + menu.getName());
            });
    }
}