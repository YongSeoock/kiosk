import React, { useState, useEffect } from 'react';
import './menuManagement.css';

function MenuManagement() {
  const [menus, setMenus] = useState([]); // 🌟 1. 빈 배열로 시작 (DB에서 받아옴)
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🌟 2. 백엔드로부터 카테고리별 데이터 조회 (GET)
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/menus?category=${category}`)
      .then(res => res.json())
      .then(data => {
        // 백엔드 날짜(ISO)를 리액트 <input type="date"> 포맷(YYYY-MM-DD)으로 변환 후 저장
        const mappedData = data.map(m => ({
          ...m,
          endDate: m.soldOutUntil ? m.soldOutUntil.split('T')[0] : ''
        }));
        setMenus(mappedData);
      })
      .catch(err => console.error("데이터 로딩 실패:", err));
  }, [category]); // 카테고리 탭이 바뀔 때마다 자동 재조회

  // 🌟 3. 토글 스위치 클릭 시 백엔드로 품절 상태 전송 (PATCH)
  const toggleSoldOut = (id, currentSoldOut, endDate) => {
    const nextSoldOut = !currentSoldOut;
    
    // 백엔드의 SoldOutRequestDto 구조에 맞게 데이터 세팅
    const requestBody = {
      isSoldOut: nextSoldOut,
      soldOutUntil: nextSoldOut && endDate ? `${endDate}T23:59:59` : null
    };

    fetch(`${process.env.REACT_APP_API_URL}/api/menus/${id}/soldout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .then(res => {
      if (res.ok) {
        // 성공 시 프론트엔드 상태 반영
        setMenus(menus.map(m => m.id === id ? { ...m, isSoldOut: nextSoldOut } : m));
      } else {
        alert("품절 상태 변경에 실패했습니다.");
      }
    })
    .catch(err => console.error(err));
  };

  // 🌟 4. 날짜 변경 시 백엔드 자동 반영 (PATCH)
  const handleDateChange = (id, value) => {
    // 먼저 화면 UI를 먼저 바꿔줌
    setMenus(menus.map(m => m.id === id ? { ...m, endDate: value } : m));

    const requestBody = {
      isSoldOut: true,
      soldOutUntil: value ? `${value}T23:59:59` : null
    };

    fetch(`${process.env.REACT_APP_API_URL}/api/menus/${id}/soldout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .catch(err => console.error(err));
  };

  // 필터 및 페이지네이션 (기존 로직 유지, imageUrl 매핑 수정)
  const filteredMenus = menus.filter(m => 
    m.name.includes(searchTerm)
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentMenus = filteredMenus.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);
  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);

  return (
    <div className="menu-container">
      {/* 검색 및 카테고리 (상단) */}
      <div className="controls">
        <input 
          type="text" 
          className="search-bar-input"
          placeholder="🔍 찾으시는 메뉴명을 입력하세요..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
        />
        <div className="categories">
          {['전체', '커피', '음료', '디저트'].map(cat => (
            <button 
              key={cat} 
              className={category === cat ? 'active' : ''} 
              onClick={() => { setCategory(cat); setCurrentPage(1); }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 리스트형 UI */}
      <div className="menu-list">
        {currentMenus.map(menu => (
          <div key={menu.id} className="menu-row">
            {/* 왼쪽: 이미지 (백엔드의 imageUrl 사용) */}
            <img src={menu.imageUrl ? `/menu-image/${menu.imageUrl}` : '/menu-image/default.jpg'} alt={menu.name} className="menu-thumb" />
            
            {/* 중간: 메뉴 이름 */}
            <span className="menu-name">{menu.name}</span>
            
            {/* 오른쪽 세트: 품절 토글 + 기간 선택 */}
            <div className="menu-actions">
              <div className="toggle-group">
                {/* 🌟 슬라이더 스타일을 적용할 switch 구조 */}
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={menu.isSoldOut} 
                    onChange={() => toggleSoldOut(menu.id, menu.isSoldOut, menu.endDate)} // 🌟 백엔드 연동 함수 매핑
                  />
                  <span className="slider round"></span> {/* 🌟 round 클래스 추가로 둥근 스위치 구현 */}
                </label>
                <span style={{ fontSize: '0.8rem', color: menu.isSoldOut ? '#e63946' : '#28a745', fontWeight: 'bold' }}>
                  {menu.isSoldOut ? '품절 중' : '판매 중'}
                </span>
              </div>

              {/* 토글 활성화 시 종료일 선택 기능만 연동 (시작일은 당일 고정이므로 제외) */}
              {menu.isSoldOut && (
                <div className="date-range-group">
                  <span className="date-label" style={{fontSize: '0.8rem', marginRight: '5px'}}>품절 기한:</span>
                  <input 
                    type="date" 
                    className="date-input"
                    value={menu.endDate || ''}
                    onChange={(e) => handleDateChange(menu.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 페이지네이션 */}
      <div className="pagination" style={{ textAlign: 'center', marginTop: '20px' }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button 
            key={i} 
            style={{ padding: '5px 10px', margin: '0 4px', backgroundColor: currentPage === i + 1 ? '#007bff' : '#fff', color: currentPage === i + 1 ? '#fff' : '#000', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MenuManagement;