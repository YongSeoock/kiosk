import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function Success() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get("orderId");
  const hasCalledRef = useRef(false);

  // 🌟 실시간 남은 시간을 관리할 상태 변수 (2초 설정)
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    // 세션 스토리지에서 기존 장바구니 데이터 복원
    const savedData = JSON.parse(sessionStorage.getItem(orderId));
    if (!savedData) {
      alert("주문 세션 정보가 만료되었습니다.");
      navigate("/");
      return;
    }

    const { orderData, receiptItems, totalAmount } = savedData;

    // 기존 백엔드 주소로 주문 데이터 전송
    fetch("http://localhost:8080/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error("서버 주문 저장 실패");
    })
    .then(finalOrderId => {
      // 영수증 정보 로컬스토리지 저장
      localStorage.setItem(`receipt_${orderId}`, JSON.stringify({
        orderId: finalOrderId,
        items: receiptItems,
        totalAmount: totalAmount
      }));

      sessionStorage.removeItem(orderId);

      // 🌟 [핵심] 1초마다 숫자를 줄여주는 타이머 구동
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer); // 0초가 되면 타이머 완전히 종료
            // 메인 화면으로 리다이렉트
            window.location.href = `/?paymentFinished=true&orderId=${orderId}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // 1000ms = 1초

    })
    .catch(err => {
      console.error(err);
      alert("주문 처리 중 오류가 발생했습니다.");
      navigate("/");
    });
  }, [orderId, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f4faff' 
    }}>
      <h2 style={{ color: 'green', marginBottom: '8px' }}>🎉 결제가 성공적으로 완료되었습니다!</h2>
      
      {/* 🌟 countdown 상태를 넣어 실시간으로 숫자가 변하게 표출 */}
      <p style={{ color: '#666', fontSize: '16px' }}>
        잠시 후 <strong>{countdown}초 뒤</strong> 메인 화면으로 이동하며 영수증이 출력됩니다.
      </p>
      
      {/* ⏳ 시간이 줄어듦에 따라 차오르는 게이지 바 UI */}
      <div style={{ 
        width: '200px', 
        height: '6px', 
        backgroundColor: '#e0e0e0', 
        borderRadius: '3px', 
        marginTop: '15px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${((3 - countdown) / 2) * 100}%`, // 시간에 맞춰 0% -> 50% -> 100% 비율 계산
          height: '100%', 
          backgroundColor: 'green',
          transition: 'width 1s linear' // 부드럽게 바가 움직이는 효과
        }}></div>
      </div>
    </div>
  );
}

export default Success;