package com.example.kiosk.kioskMenu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.kiosk.kioskMenu.entity.MenuOption;

@Repository
public interface MenuOptionRepository extends JpaRepository<MenuOption, Long> {

}