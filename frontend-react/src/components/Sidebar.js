// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Gestion EPI</h2>
      <nav>
        <ul>
          <li><Link to="/">📊 Dashboard</Link></li>
          <li><Link to="/affectation">📝 Affectation</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
