//여기서 백엔드 서버 가동

package com.example.kiosk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class KioskApplication {
    public static void main(String[] args) {
        SpringApplication.run(KioskApplication.class, args);
    }
}