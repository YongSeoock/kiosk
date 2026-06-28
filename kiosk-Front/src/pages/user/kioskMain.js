import React, { useEffect, useState } from 'react';
import './kioskMain.css';
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

function KioskMain() {
  // === 상태 관리 구역 (useState) ===
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [chosenIce, setChosenIce] = useState(null);
  const [chosenAdds, setChosenAdds] = useState({});
  const [receipt, setReceipt] = useState(null); 

  // 토스 결제 인스턴스 상태 관리
  const clientKey = "test_ck_nRQoOaPz8LL2N6nEbaPe8y47BMw6";
  const customerKey = "PwnwqzG6BnQZDh0882bU5";
  const [payment, setPayment] = useState(null);

  // 현재 선택된 카테고리 상태 추가 (기본값: '전체')
  const [currentCategory, setCurrentCategory] = useState('전체');

  // 카테고리 탭 리스트 정의
  const categories = ['전체', '신메뉴', '커피', '음료', '디저트'];

  // === 메뉴 데이터 로드 ===
  useEffect(() => {
    fetch(`http://localhost:8080/api/menus?category=${currentCategory}`)
      .then(response => response.json())
      .then(data => { if (Array.isArray(data)) setMenus(data); })
      .catch(err => console.error("서버 연결 실패 :", err));
  }, [currentCategory]);

  // === 토스 SDK 초기화 ===
  useEffect(() => {
    async function initToss() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const paymentInstance = tossPayments.payment({ customerKey });
        setPayment(paymentInstance);
      } catch (error) {
        console.error("토스 SDK 초기화 실패:", error);
      }
    }
    initToss();
  }, []);

  // === 🌟 [수정] 결제가 완료되어 Success 페이지에서 복귀했는지 체크하는 장치 ===
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isFinished = searchParams.get("paymentFinished");
    const orderId = searchParams.get("orderId");

    // 결제가 무사히 끝나고 복귀했다면 로컬 스토리지에 백업해둔 영수증 정보를 꺼내서 모달 띄우기!
    if (isFinished === "true" && orderId) {
      const savedReceipt = JSON.parse(localStorage.getItem(`receipt_${orderId}`));
      if (savedReceipt) {
        setReceipt(savedReceipt);
        setCart([]); // 장바구니 비우기
        
        // 주소창 깔끔하게 청소 (?paymentFinished=true 제거)
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.removeItem(`receipt_${orderId}`);
      }
    }
  }, []);

  // === 기능 함수 구역 (Methods) ===
  const openOptionModal = (menu) => {
    if (menu.isSoldOut) return; 

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

  const totalAmount = cart.reduce((sum, item) => sum + (item.singlePrice * item.count), 0);

  // === 🌟 [수정] 표준 리다이렉트 방식 결제창 호출 함수 (에러 완벽 차단) ===
  const handleCheckout = async () => {
    if (!payment) {
      alert("결제 모듈이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const generatedOrderId = "ORDER-" + new Date().getTime();
    const orderName = cart.length > 1 
      ? `${cart[0].name} 외 ${cart.length - 1}건` 
      : cart[0].name;

    const orderData = {
      totalPrice: totalAmount,
      orderItems: cart.map(item => {
        const options = [];
        if (item.iceOption) options.push({ optionId: item.iceOption.id, quantity: 1 });
        item.addOptions.forEach(opt => options.push({ optionId: opt.id, quantity: opt.count }));
        return { menuId: item.menuId, quantity: item.count, options: options };
      })
    };

    const receiptItems = cart.map(item => ({
      name: item.name,
      count: item.count,
      iceName: item.iceOption ? item.iceOption.name : null,
      adds: item.addOptions.map(o => `${o.name} ${o.count}개`)
    }));

    // 나중에 메인으로 돌아와서 띄워줄 영수증 미리 세션에 백업
    sessionStorage.setItem(generatedOrderId, JSON.stringify({ orderData, receiptItems, totalAmount }));

    // 결제 성공 화면 호출
    //const fakePaymentKey = "fake_payment_key_" + new Date().getTime();
    //window.location.href = `/success?paymentKey=${fakePaymentKey}&orderId=${generatedOrderId}&amount=${totalAmount}`;

    // 실제 구동하는 코드 이 부분을 지우고 결제 성공 화면 호출만 하면 테스트할때 편함
    try {
      // 🌟 windowTarget 옵션을 삭제하여 안전하게 토스 기본 창으로 결제 요청 진행
      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: totalAmount,
        },
        orderId: generatedOrderId, 
        orderName: orderName,
        successUrl: window.location.origin + "/success", 
        failUrl: window.location.origin + "/fail",
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
          // 잔액 부족 에러 강제 발생
          //variant: "INSUFFICIENT_BALANCE"
        }
      });
    } catch (error) {
      alert(error.message);

      // 결제 실패 화면 호출
      //window.location.href = `/fail?code=${error.code}&message=${encodeURIComponent(error.message)}`;
    }
  };

  const categoryIcons = {
    '전체': '✨',
    '신메뉴': '🆕',
    '커피': '☕',
    '음료': '🍹',
    '디저트': '🍰'
  };

  return (
    <div className="kiosk-container">
      <h1 className="kiosk-title">카페 키오스크</h1>

      {/* 카테고리 탭 버튼 구역 */}
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
            <div key={menu.id} className={`menu-card ${menu.isSoldOut ? 'disabled' : ''}`}>
              <div className="menu-info">
                <div className="menu-image-container" style={{ position: 'relative' }}>
                  {menu.isSoldOut && (
                    <div className="sold-out-overlay">
                      <span>품절</span>
                    </div>
                  )}
                  <img 
                    src={menu.imageUrl ? `/menu-image/${menu.imageUrl}` : '/menu-image/default.jpg'} 
                    alt={menu.name} 
                    className="menu-image" 
                    onError={(e) => { e.target.src = '/menu-image/default.jpg'; }} 
                  />
                </div>
                <strong className="menu-name">{menu.name}</strong> <br />
                <span className="menu-price">{menu.price.toLocaleString()}원</span>
              </div>
              
              <button 
                onClick={() => openOptionModal(menu)} 
                className="btn-primary"
                disabled={menu.isSoldOut}
              >
                {menu.isSoldOut ? '품절' : '담기'}
              </button>
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
          <h2 className="cart-title">장바구니</h2>
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