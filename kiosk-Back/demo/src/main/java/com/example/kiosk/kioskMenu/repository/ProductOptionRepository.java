package com.example.kiosk.kioskMenu.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskMenu.entity.ProductOption;

@Repository
public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {
    // 옵션 창고에서 데이터를 넣고 뺄 때 쓰는 일꾼!
    List<ProductOption> findByIdIn(List<Long> ids);
}