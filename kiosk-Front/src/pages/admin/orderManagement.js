import React, { useState, useEffect } from 'react';
import './orderManagement.css';

// 카드에 미리보기로 보여줄 최대 메뉴 항목 수 (이보다 많으면 "더보기" 버튼 노출)
const PREVIEW_ITEM_COUNT = 3;

function OrderManagement() {
  const [orders, setOrders] = useState([]);

  // 🌟 더보기 팝업에 띄울 주문 (null이면 팝업 닫힘)
  const [detailOrder, setDetailOrder] = useState(null);

  // 컴포넌트가 열리면 주문 데이터 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
        console.log("실제 서버에서 받아온 데이터:", data);
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(err => console.error("주문 목록 로딩 실패:", err));
  };

  const handleCompleteOrder = (orderId) => {
    //if (!window.confirm(`${orderId}번 주문을 제조 완료 처리하시겠습니까?`)) return;

    // 1. ⭕ 서버로 요청은 일단 보냅니다.
    fetch(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/complete`, {
      method: 'POST',
    }).catch(err => console.error("서버 전송 실패(신경 안 써도 됨):", err));

    // 2. 🌟 [핵심] 서버 응답을 기다리지 않고, 확인을 누른 즉시 화면에서 무조건 지워버립니다.
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));

    // 팝업이 열려있던 주문이 완료 처리되면 팝업도 같이 닫기
    setDetailOrder(prev => (prev && prev.id === orderId) ? null : prev);

    alert(`🔔 ${orderId}번 주문 제조가 완료되었습니다!`);
  };

  return (
    <div>
      <div className="orders-header">
        <h2>📋 실시간 주문 수신 현황</h2>
        <button onClick={fetchOrders} className="btn-refresh">🔄 새로고침</button>
      </div>

      <div className="orders-grid">
        {orders.length === 0 ? (
          <p className="no-orders">현재 대기 중인 주문이 없습니다.</p>
        ) : (
          orders.map(order => {
            const items = order.orderItems ?? [];
            const hasMore = items.length > PREVIEW_ITEM_COUNT;
            const previewItems = hasMore ? items.slice(0, PREVIEW_ITEM_COUNT) : items;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <span className="order-number">주문 번호: {order.id}번</span>
                </div>

                <div className="order-card-body">
                  <ul className="order-items-list">
                    {previewItems.map((item, idx) => (
                      <li key={idx} className="order-item-detail">
                        <div className="item-name-qty">
                          <strong>{item.menuName}</strong> x {item.quantity}개
                        </div>
                        {item.options && (
                          <div className="item-options-desc">
                            • {item.options}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {hasMore && (
                    <button
                      className="btn-more"
                      onClick={() => setDetailOrder(order)}
                    >
                      더보기 (+{items.length - PREVIEW_ITEM_COUNT}개 더보기)
                    </button>
                  )}
                </div>

                <div className="order-card-footer">
                  <div className="order-total-price">
                    총 결제 금액: <strong>{order.totalPrice?.toLocaleString()}원</strong>
                  </div>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="btn-complete"
                  >
                    ✅ 제조 완료
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🌟 더보기 팝업 (모달) */}
      {detailOrder && (
        <div className="order-modal-backdrop" onClick={() => setDetailOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <span>주문 번호: {detailOrder.id}번 상세</span>
              <button className="order-modal-close" onClick={() => setDetailOrder(null)}>✕</button>
            </div>

            <ul className="order-modal-items-list">
              {(detailOrder.orderItems ?? []).map((item, idx) => (
                <li key={idx} className="order-item-detail">
                  <div className="item-name-qty">
                    <strong>{item.menuName}</strong> x {item.quantity}개
                  </div>
                  {item.options && (
                    <div className="item-options-desc">
                      • {item.options}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="order-modal-footer">
              <div className="order-total-price">
                총 결제 금액: <strong>{detailOrder.totalPrice?.toLocaleString()}원</strong>
              </div>
              <button
                onClick={() => handleCompleteOrder(detailOrder.id)}
                className="btn-complete"
              >
                ✅ 제조 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderManagement;