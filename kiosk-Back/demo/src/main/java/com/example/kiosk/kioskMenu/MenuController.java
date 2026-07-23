package com.example.kiosk.kioskMenu;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<List<MenuResponseDto>> getMenus(
            @RequestParam(value = "category", defaultValue = "전체") String category) {
        return ResponseEntity.ok(menuService.getMenusByCategory(category));
    }

    @PatchMapping("/{id}/soldout")
    public ResponseEntity<Void> updateSoldOut(
            @PathVariable Long id,
            @RequestBody SoldOutRequestDto request) {
        menuService.updateSoldOut(id, request);
        return ResponseEntity.ok().build();
    }
}
