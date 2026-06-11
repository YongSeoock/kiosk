package com.example.kiosk.kioskMenu;

import java.util.List;
import java.util.stream.Collectors;

import com.example.kiosk.kioskMenu.entity.Menu;
import com.example.kiosk.kioskMenu.entity.ProductOption;

public class MenuResponseDto {
    private Long id;
    private String name;
    private int price;
    private List<OptionDto> options; // 무한루프 유발하는 중간테이블 대신 진짜 옵션 정보만 쏙!

    public MenuResponseDto(Menu menu) {
        this.id = menu.getId();
        this.name = menu.getName();
        this.price = menu.getPrice();
        // 무한 루프를 끊어내고 진짜 옵션 알맹이만 추출하는 마법
        this.options = menu.getMenuOptions().stream()
                .map(menuOption -> new OptionDto(menuOption.getProductOption()))
                .collect(Collectors.toList());
    }

    // 정석 Getter들
    public Long getId() { return id; }
    public String getName() { return name; }
    public int getPrice() { return price; }
    public List<OptionDto> getOptions() { return options; }

    // 내부용 옵션 박스
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

        // 정석 Getter들
        public Long getId() { return id; }
        public String getName() { return name; }
        public int getExtraPrice() { return extraPrice; }
        public String getCategory() { return category; }
    }
}