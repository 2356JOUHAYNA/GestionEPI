import React from "react";
import "./Topbar.css";
import logo from "../logo.svg"; // adapte le chemin si nécessaire

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-content">
        <img src={logo} alt="Logo" className="topbar-logo" />
        <h1 className="topbar-title">Gestion EPI</h1>
      </div>
    </header>
  );
};

export default Topbar;
