import React, { useState } from 'react';
import './adminMain.css';
import OrderManagement from './orderManagement'; // 1번 컴포넌트 불러오기
import MenuManagement from './menuManagement';   // 2번 컴포넌트 불러오기
import DashboardReport from './dashboardReport'; // 3번 컴포넌트 불러오기
import SalesAnalysis from './salesAnalysis';     // 4번 컴포넌트 (AI 분석 & 예측)

function AdminMain() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ 카페 관리자 페이지</h1>
        <p>매장 관리 및 데이터 대시보드</p>
      </header>

      {/* 탭 버튼 네비게이션 */}
      <nav className="admin-tabs">
        <button onClick={() => setActiveTab('orders')} className={`category-btn ${activeTab === 'orders' ? 'active' : ''}`}>📋 실시간 주문 관리</button>
        <button onClick={() => setActiveTab('menus')} className={`category-btn ${activeTab === 'menus' ? 'active' : ''}`}>☕ 메뉴 관리</button>
        <button onClick={() => setActiveTab('dashboard')} className={`category-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>📊 매출 통계 리포트</button>
        <button onClick={() => setActiveTab('analysis')} className={`category-btn ${activeTab === 'analysis' ? 'active' : ''}`}>🤖 AI 분석 &amp; 예측</button>
      </nav>

      {/* 🌟 탭 내용 구역: 각 파일에서 컴포넌트를 조립식으로 끼워 넣음 */}
      <main className="admin-content">
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'menus' && <MenuManagement />}
        {activeTab === 'dashboard' && <DashboardReport />}
        {activeTab === 'analysis' && <SalesAnalysis />}
      </main>
    </div>
  );
}

export default AdminMain;