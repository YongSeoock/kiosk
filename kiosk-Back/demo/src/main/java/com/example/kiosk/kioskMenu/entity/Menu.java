package com.example.kiosk.kioskMenu.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.ArrayList; 
import java.util.List;      

@Entity
@Table(name = "menu") 
@Getter @Setter       
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private int price;
    private String category; 
    private String imageUrl;
    
    @Column(name = "is_new")
    private boolean isNew; 

    // 🌟 품절 관련 필드 추가 (PostgreSQL 컬럼과 매핑)
    @Column(name = "is_sold_out")
    private boolean isSoldOut = false; 

    @Column(name = "sold_out_until")
    private LocalDateTime soldOutUntil;

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL)
    private List<MenuOption> menuOptions = new ArrayList<>();

    // 기본 생성자
    public Menu() {
    }

    // 초기 데이터용 생성자
    public Menu(String name, int price, String category, boolean isNew, String imageUrl, boolean isSoldOut) {
        this.name = name;
        this.price = price;
        this.category = category; 
        this.isNew = isNew; 
        this.imageUrl = imageUrl; 
        this.isSoldOut = isSoldOut; 
    }

    // 🌟 Jackson 및 JPA 매핑 오류를 방지하기 위한 명시적 Getter/Setter
    public boolean isSoldOut() { 
        return this.isSoldOut; 
    }

    public void setSoldOut(boolean isSoldOut) { 
        this.isSoldOut = isSoldOut; 
    }
}