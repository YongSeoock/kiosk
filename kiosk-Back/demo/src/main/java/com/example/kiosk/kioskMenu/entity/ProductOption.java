package com.example.kiosk.kioskMenu.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_option") // pgAdmin 테이블 이름 명시
@Getter @Setter                 // 🟢 롬복이 모든 Getter/Setter를 자동으로 생성합니다.
public class ProductOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // 예: "샷 추가", "간얼음"
    
    @Column(name = "extra_price") // pgAdmin 컬럼명과 일치치시킴 (Snake Case)
    private int extraPrice;     // 옵션 가격 (예: 500원, 0원)
    
    private String category;    // 옵션 종류 (예: "ICE", "ADD")

    // 기본 생성자
    public ProductOption() {
    }

    // 초기 데이터용 생성자
    public ProductOption(String name, int extraPrice, String category) {
        this.name = name;
        this.extraPrice = extraPrice;
        this.category = category;
    }

    // 🟢 정석 Getter / Setter 메서드들은 롬복이 처리해주므로 싹 지웠습니다!
}