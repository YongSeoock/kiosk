import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function Fail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 토스페이먼츠가 주소창에 넘겨주는 에러 메시지와 코드 추출
  const errorMessage = searchParams.get("message") || "알 수 없는 오류가 발생했습니다.";
  const errorCode = searchParams.get("code");

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#fff5f5' 
    }}>
      <h2 style={{ color: '#ff4d4f', marginBottom: '10px' }}>❌ 결제가 취소되었거나 실패했습니다</h2>
      
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        marginBottom: '20px',
        maxWidth: '400px'
      }}>
        <p style={{ color: '#333', fontWeight: 'bold', margin: '0 0 8px 0' }}>사유: {errorMessage}</p>
        {errorCode && <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>에러 코드: {errorCode}</p>}
      </div>

      <button 
        onClick={() => navigate("/")} 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#333', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        처음으로 돌아가기
      </button>
    </div>
  );
}

export default Fail;