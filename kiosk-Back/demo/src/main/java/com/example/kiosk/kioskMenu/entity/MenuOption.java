package com.example.kiosk.kioskMenu.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "menu_option") // pgAdmin 테이블 이름 명시
@Getter @Setter              // 🟢 롬복이 모든 Getter/Setter를 자동으로 만들어줍니다!
public class MenuOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 메뉴판과 연결되는가?
    @ManyToOne
    @JoinColumn(name = "menu_id")
    private Menu menu;

    // 어떤 옵션판과 연결되는가?
    @ManyToOne
    @JoinColumn(name = "option_id")
    private ProductOption productOption;

    // 기본 생성자
    public MenuOption() {
    }

    // 🟢 직접 작성했던 긴 Getter / Setter 메서드들은 롬복이 처리해주므로 싹 지웠습니다!
}