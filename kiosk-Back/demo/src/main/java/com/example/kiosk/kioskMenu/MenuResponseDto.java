package com.example.kiosk.kioskMenu;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.example.kiosk.kioskMenu.entity.Menu;
import com.example.kiosk.kioskMenu.entity.ProductOption;
import lombok.Getter;

@Getter 
public class MenuResponseDto {
    private Long id;
    private String name;
    private int price;
    private String imageUrl; 
    // 🌟 소문자 boolean에서 대문자 Boolean으로 변경 (is 접두사 유지 목적)
    private Boolean isSoldOut;             
    private LocalDateTime soldOutUntil;    
    private List<OptionDto> options;

    public MenuResponseDto(Menu menu) {
        this.id = menu.getId();
        this.name = menu.getName();
        this.price = menu.getPrice();
        this.imageUrl = menu.getImageUrl(); 
        // 🌟 매핑은 기존 규칙 그대로 유지됩니다.
        this.isSoldOut = menu.isSoldOut();             
        this.soldOutUntil = menu.getSoldOutUntil();    
        
        this.options = menu.getMenuOptions().stream()
                .map(menuOption -> new OptionDto(menuOption.getProductOption()))
                .collect(Collectors.toList());
    }

    @Getter 
    public static class OptionDto {
        private Long id;
        private String name;
        private int extraPrice;
        private String category;

        public OptionDto(ProductOption option) {
            this.id = option.getId();
            this.name = option.getName();
            this.extraPrice = option.getExtraPrice();
            this.category = option.getCategory();
        }
    }
}