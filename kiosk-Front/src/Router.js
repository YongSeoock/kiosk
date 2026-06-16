import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KioskMain from './pages/user/kioskMain';
import AdminMain from './pages/admin/adminMain';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KioskMain />} />
        <Route path="/admin" element={<AdminMain />} />
      </Routes>
    </Router>
  );
}
export default AppRouter;