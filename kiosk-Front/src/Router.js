import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KioskMain from './pages/user/kioskMain';
import AdminMain from './pages/admin/adminMain';
import Success from './pages/paymentYN/success';
import Fail from './pages/paymentYN/fail';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KioskMain />} />
        <Route path="/admin" element={<AdminMain />} />
        <Route path="/success" element={<Success />} />
        <Route path="/fail" element={<Fail />} />
      </Routes>
    </Router>
  );
}
export default AppRouter;