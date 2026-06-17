package com.example.kiosk.kioskMenu;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000") // 리액트 연동 허용
@RequestMapping("/api/menus") // 경로 매핑 깔끔하게 정리
public class MenuController {

    private final MenuService menuService;

    // 생성자로 주입받기 규칙 유지
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<MenuResponseDto> getMenus(@RequestParam(value = "category", defaultValue = "전체") String category) {
        // 기존의 stream() 변환 로직을 비즈니스 레이어(Service) 내부로 이관하여 가독성을 높였습니다.
        return menuService.getMenusByCategory(category);
    }

   @PatchMapping("/{id}/soldout")
    public void updateSoldOut(@PathVariable Long id, @RequestBody SoldOutRequestDto request) {
        menuService.updateSoldOut(id, request);
    }
}