package com.example.kiosk.kioskMenu.repository;

import com.example.kiosk.kioskMenu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    // 1. 전체 조회 규칙 (성능 최적화를 위한 Fetch Join)
    @Query("SELECT DISTINCT m FROM Menu m LEFT JOIN FETCH m.menuOptions mo LEFT JOIN FETCH mo.productOption ORDER BY m.id ASC")
    List<Menu> findAllWithOptions();

    // 2. 신메뉴 필터링 규칙 (isNew 컬럼이 true인 것만)
    @Query("SELECT DISTINCT m FROM Menu m LEFT JOIN FETCH m.menuOptions mo LEFT JOIN FETCH mo.productOption WHERE m.isNew = true ORDER BY m.id ASC")
    List<Menu> findByIsNewTrue();

    // 3. 카테고리 필터링 규칙 (category 컬럼 매핑)
    @Query("SELECT DISTINCT m FROM Menu m LEFT JOIN FETCH m.menuOptions mo LEFT JOIN FETCH mo.productOption WHERE m.category = :category ORDER BY m.id ASC")
    List<Menu> findByCategory(@Param("category") String category);
}