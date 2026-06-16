import React, { useEffect, useState } from 'react';
import './kioskMain.css';

function KioskMain() {
  // === 상태 관리 구역 (useState) ===
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [chosenIce, setChosenIce] = useState(null);
  const [chosenAdds, setChosenAdds] = useState({});
  const [receipt, setReceipt] = useState(null); 

  // 🌟 [NEW] 현재 선택된 카테고리 상태 추가 (기본값: '전체')
  const [currentCategory, setCurrentCategory] = useState('전체');

  // 카테고리 탭 리스트 정의
  const categories = ['전체', '신메뉴', '커피', '음료', '디저트'];

  // === 서버 연동 구역 ===
  // 🌟 [수정] currentCategory가 변경될 때마다 서버에 해당 카테고리 데이터를 요청합니다.
  useEffect(() => {
    fetch(`http://localhost:8080/api/menus?category=${currentCategory}`)
      .then(response => response.json())
      .then(data => { if (Array.isArray(data)) setMenus(data); })
      .catch(err => console.error("서버 연결 실패 :", err));
  }, [currentCategory]);

  // === 기능 함수 구역 (Methods) ===
  const openOptionModal = (menu) => {
    setSelectedMenu(menu);
    const iceOptions = menu.options?.filter(o => o.category === "ICE") || [];
    setChosenIce(iceOptions.length > 0 ? iceOptions[0] : null);
    
    const addOptions = menu.options?.filter(o => o.category === "ADD") || [];
    const initialAdds = {};
    addOptions.forEach(o => { initialAdds[o.id] = 0; });
    setChosenAdds(initialAdds);
  };

  const changeAddCount = (optionId, amount) => {
    setChosenAdds(prev => ({
      ...prev,
      [optionId]: Math.max(0, (prev[optionId] || 0) + amount)
    }));
  };

  const handleFinalAddToCart = () => {
    const selectedAddsList = selectedMenu.options
      ?.filter(o => o.category === "ADD" && chosenAdds[o.id] > 0)
      .map(o => ({ ...o, count: chosenAdds[o.id] })) || [];

    const finalItem = {
      id: `${selectedMenu.id}-${chosenIce?.id || 'none'}-${selectedAddsList.map(o => `${o.id}x${o.count}`).join('-')}`,
      menuId: selectedMenu.id,
      name: selectedMenu.name,
      basePrice: selectedMenu.price,
      iceOption: chosenIce,
      addOptions: selectedAddsList,
      singlePrice: selectedMenu.price + selectedAddsList.reduce((sum, o) => sum + (o.extraPrice * o.count), 0),
      count: 1
    };

    const isExist = cart.find(item => item.id === finalItem.id);
    if (isExist) {
      setCart(cart.map(item => item.id === finalItem.id ? { ...item, count: item.count + 1 } : item));
    } else {
      setCart([...cart, finalItem]);
    }
    setSelectedMenu(null);
  };

  const ClearCart = () => setCart([]);

  const decreaseCount = (item) => {
    if (item.count > 1) {
      setCart(cart.map(c => c.id === item.id ? { ...c, count: c.count - 1 } : c));
    } else {
      setCart(cart.filter(c => c.id !== item.id));
    }
  };

  const increaseCount = (item) => {
      setCart(cart.map(c => c.id === item.id ? { ...c, count: c.count + 1 } : c));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("장바구니가 비어 있습니다.");
      return;
    }

    const receiptItems = cart.map(item => ({
      name: item.name,
      count: item.count,
      iceName: item.iceOption ? item.iceOption.name : null,
      adds: item.addOptions.map(o => `${o.name} ${o.count}개`)
    }));

    const orderData = {
      totalPrice: totalAmount,
      orderItems: cart.map(item => {
        const options = [];
        if (item.iceOption) options.push({ optionId: item.iceOption.id, quantity: 1 });
        item.addOptions.forEach(opt => options.push({ optionId: opt.id, quantity: opt.count }));
        return { menuId: item.menuId, quantity: item.count, options: options };
      })
    };

    fetch("http://localhost:8080/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    })
    .then(response => {
      if (response.ok) return response.json();
      throw new Error("결제 실패");
    })
    .then(orderId => {
      alert("💳 결제가 완료되었습니다!"); 

      setReceipt({
        orderId: orderId,
        items: receiptItems,
        totalAmount: totalAmount
      });

      setCart([]); 
    })
    .catch(err => {
      console.error(err);
      alert("결제 처리 중 서버 오류가 발생했습니다.");
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.singlePrice * item.count), 0);

  {/* 메뉴판 구역 이모지 */}
  const categoryIcons = {
    '전체': '✨',
    '신메뉴': '🆕',
    '커피': '☕',
    '음료': '🍹',
    '디저트': '🍰'
  };

  return (
    <div className="kiosk-container">
      <h1 className="kiosk-title">🏪 카페 키오스크</h1>

      
      {/* 🌟 [NEW] 카테고리 탭 버튼 구역 */}
      <div className="category-tabs">
        {categories.map(tab => (
          <button 
            key={tab} 
            onClick={() => setCurrentCategory(tab)}
            className={`tab-button ${currentCategory === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 메뉴판 구역 */}
      <h2 className="menu-section-title">
        {categoryIcons[currentCategory] || '🍴'} {currentCategory} 메뉴
      </h2>
      
      <div className="menu-grid">
        {Array.isArray(menus) && menus.length > 0 ? (
          menus.map(menu => (
            <div key={menu.id} className="menu-card">
              <div className="menu-info">
                
                {/* 1. 현재 변수명인 'menu'에 맞춰 이미지 태그 삽입 */}
                <div className="menu-image-container">
                  <img 
                    src={menu.imageUrl ? `/menu-image/${menu.imageUrl}` : '/menu-image/default.jpg'} 
                    alt={menu.name} 
                    className="menu-image" 
                    onError={(e) => { e.target.src = '/menu-image/default.jpg'; }} // 이미지 로딩 실패 시 기본 이미지로 대체
                  />
                </div>

                <strong className="menu-name">{menu.name}</strong> <br />
                <span className="menu-price">{menu.price.toLocaleString()}원</span> {/* 가격 콤마 표시 기능 추가 */}
              </div>
              <button onClick={() => openOptionModal(menu)} className="btn-primary">담기</button>
            </div>
          ))
        ) : (
          <p style={{ color: '#888', textAlign: 'center', width: '100%' }}>등록된 메뉴가 없습니다.</p>
        )}
      </div>

      {/* 옵션 선택 팝업창 (모달) 구역 */}
      {selectedMenu && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{selectedMenu.name} 옵션</h2>
            <p className="modal-subtitle">기본 금액: {selectedMenu.price}원</p>

            {selectedMenu.options?.filter(o => o.category === "ICE").length > 0 && (
              <div className="modal-group">
                <h4 className="modal-group-title">❄️ 얼음 종류 (택 1)</h4>
                {selectedMenu.options.filter(o => o.category === "ICE").map(o => (
                  <label key={o.id} className="modal-radio-label">
                    <input type="radio" name="iceOption" checked={chosenIce?.id === o.id} onChange={() => setChosenIce(o)} style={{ marginRight: '8px' }} />
                    {o.name} (+{o.extraPrice}원)
                  </label>
                ))}
              </div>
            )}

            {selectedMenu.options?.filter(o => o.category === "ADD").length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 className="modal-group-title">➕ 옵션 추가 (여러 번 가능)</h4>
                {selectedMenu.options.filter(o => o.category === "ADD").map(o => (
                  <div key={o.id} className="modal-add-row">
                    <span style={{ fontSize: '15px' }}>{o.name} (+{o.extraPrice}원)</span>
                    <div className="counter-group">
                      <button onClick={() => changeAddCount(o.id, -1)} className="btn-counter">-</button>
                      <span className="counter-value">{chosenAdds[o.id] || 0}</span>
                      <button onClick={() => changeAddCount(o.id, 1)} className="btn-counter">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-btn-group">
              <button onClick={() => setSelectedMenu(null)} className="btn-cancel">취소</button>
              <button onClick={handleFinalAddToCart} className="btn-confirm">선택 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 장바구니 구역 */}
      <div className="cart-section">
        <div className="cart-header">
          <h2 className="cart-title">🛒 장바구니</h2>
          <button onClick={ClearCart} disabled={cart.length === 0} className="btn-clear-cart" style={{ backgroundColor: cart.length === 0 ? '#ddd' : '#ff4d4f', color: cart.length === 0 ? '#adb5bd' : '#ffffff',cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>전체 비우기</button>
        </div>

        {cart.length === 0 ? <p className="cart-empty-text">선택한 메뉴가 없습니다.</p> : (
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                <div>
                  <span className="item-main-text"><strong>{item.name}</strong></span>
                  <span className="item-price-text">({item.singlePrice}원)</span>
                  <div className="item-options-text">
                    {item.iceOption && `• ${item.iceOption.name} `}
                    {item.addOptions.map(o => `• ${o.name} ${o.count}개`).join(' ')}
                  </div>
                </div>
                <div className="counter-group">
                  <button onClick={() => decreaseCount(item)} className="btn-counter">-</button>
                  <span className="counter-value">{item.count}개</span>
                  <button onClick={() => increaseCount(item)} className="btn-counter">+</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <h3 className="total-amount-text">총 결제 금액: {totalAmount.toLocaleString()}원</h3>
        <button onClick={handleCheckout} disabled={cart.length === 0} className="btn-checkout">💳 결제하기</button>
      </div>

      {/* 주문 완료 영수증 팝업창 UI 구역 */}
      {receipt && (
        <div className="modal-overlay">
          <div className="receipt-modal">
            <h2 className="receipt-title">🧾 주문 번호 표</h2>
            <div className="receipt-number-box">
              <span className="receipt-number-label">주문 번호</span>
              <h1 className="receipt-number">{receipt.orderId}번</h1>
            </div>

            <div className="receipt-content">
              <h4>[주문 상품 목록]</h4>
              <ul className="receipt-list">
                {receipt.items.map((item, idx) => (
                  <li key={idx} className="receipt-item-row">
                    <div className="receipt-item-main">
                      <strong>{item.name}</strong> x {item.count}개
                    </div>
                    <div className="receipt-item-sub">
                      {item.iceName && `[${item.iceName}] `}
                      {item.adds.length > 0 && item.adds.join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="receipt-divider"></div>
              <h3 className="receipt-total">최종 결제 금액: {receipt.totalAmount.toLocaleString()}원</h3>
            </div>

            <button onClick={() => setReceipt(null)} className="btn-receipt-close">
              확인 (닫기)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default KioskMain;