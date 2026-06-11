INSERT INTO menu (name, price) VALUES ('아메리카노', 2500);
INSERT INTO menu (name, price) VALUES ('카페라떼', 3000);
INSERT INTO menu (name, price) VALUES ('딸기에이드', 3500);

INSERT INTO product_option (category, extra_price, name) VALUES ('ICE', 0, '각얼음');
INSERT INTO product_option (category, extra_price, name) VALUES ('ICE', 0, '간얼음');
INSERT INTO product_option (category, extra_price, name) VALUES ('ADD', 500, '샷 추가');
INSERT INTO product_option (category, extra_price, name) VALUES ('ADD', 500, '헤이즐럿 시럽 추가');
INSERT INTO product_option (category, extra_price, name) VALUES ('ADD', 500, '딸기 베이스 추가');

INSERT INTO menu_option (menu_id, option_id) VALUES (1, 1);
INSERT INTO menu_option (menu_id, option_id) VALUES (1, 2);
INSERT INTO menu_option (menu_id, option_id) VALUES (1, 3);
INSERT INTO menu_option (menu_id, option_id) VALUES (1, 4);
INSERT INTO menu_option (menu_id, option_id) VALUES (2, 1);
INSERT INTO menu_option (menu_id, option_id) VALUES (2, 2);
INSERT INTO menu_option (menu_id, option_id) VALUES (2, 3);
INSERT INTO menu_option (menu_id, option_id) VALUES (2, 4);
INSERT INTO menu_option (menu_id, option_id) VALUES (3, 1);
INSERT INTO menu_option (menu_id, option_id) VALUES (3, 2);
INSERT INTO menu_option (menu_id, option_id) VALUES (3, 5);