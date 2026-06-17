package com.example.kiosk.kioskMenu;

import java.time.LocalDateTime;

public class SoldOutRequestDto {
    private boolean isSoldOut;
    private LocalDateTime soldOutUntil;

    // 기본 생성자 (Jackson 매핑에 필수)
    public SoldOutRequestDto() {
    }

    // 리액트의 'isSoldOut'을 정확히 매칭하기 위한 수동 Getter/Setter
    public boolean isIsSoldOut() {
        return isSoldOut;
    }

    public void setIsSoldOut(boolean isSoldOut) {
        this.isSoldOut = isSoldOut;
    }

    public LocalDateTime getSoldOutUntil() {
        return soldOutUntil;
    }

    public void setSoldOutUntil(LocalDateTime soldOutUntil) {
        this.soldOutUntil = soldOutUntil;
    }
}