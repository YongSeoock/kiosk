package com.example.kiosk.kioskMenu.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList; 
import java.util.List;      

@Entity
@Table(name = "menu") // pgAdmin 테이블 이름 명시
@Getter @Setter       // 🟢 롬복이 아래 모든 Getter/Setter를 대신 만들어줍니다!
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

    @OneToMany(mappedBy = "menu", cascade = CascadeType.ALL)
    private List<MenuOption> menuOptions = new ArrayList<>();

    // 기본 생성자
    public Menu() {
    }

    // 초기 데이터용 생성자
    public Menu(String name, int price, String category, boolean isNew, String imageUrl) {
        this.name = name;
        this.price = price;
        this.category = category; 
        this.isNew = isNew; 
        this.imageUrl = imageUrl; 
    }
    
}