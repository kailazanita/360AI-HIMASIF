"use client"

import React from "react"
import "./Header.css"
import logo from "../assets/images/himasif.png"

export default function Header() {
  return (
    <header className="mobile-header" role="banner">
      <div className="mobile-header-inner">
        <button
          className="mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => window.dispatchEvent(new CustomEvent('mobile-menu-toggle'))}
        >
          <span className="menu-icon">
            <span className="bar"></span>
            <span className="bar"></span>
          </span>
        </button>
        <img src={logo} alt="HIMASIF" className="mobile-header-logo" />
      </div>
    </header>
  )
}
