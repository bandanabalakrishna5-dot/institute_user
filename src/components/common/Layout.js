/**
 * @description: User Portal Layout – topbar + content + bottom nav
 * @author: Institute User Portal
 */
import React from 'react';
import BottomNav from './BottomNav';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  return (
    <div className="user-portal-layout">
      <div className="user-portal-main">
        <Topbar />
        <main className="user-portal-content">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
