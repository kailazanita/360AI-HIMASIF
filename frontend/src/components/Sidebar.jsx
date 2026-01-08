"use client"

import PropTypes from "prop-types"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import logo from "../assets/images/himasif.png"
import "./Sidebar.css"


function Sidebar({ onNewChat, navItems, onSignIn, onSignOut, onLogoClick, user }) {
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const handleAccountClick = () => {
    if (user) {
      if (!showAccountMenu && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect()
        setDropdownPos({
          top: rect.top + rect.height / 2,
          left: rect.right + 28, // shift popup further right
        })
      }
      setShowAccountMenu((prev) => !prev)
    } else {
      onSignIn()
    }
  }

  useEffect(() => {
    if (!showAccountMenu) return
    const handleClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setShowAccountMenu(false)
      }
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [showAccountMenu])

  useEffect(() => {
    const onToggle = () => setMobileOpen((v) => !v)
    window.addEventListener('mobile-menu-toggle', onToggle)
    return () => window.removeEventListener('mobile-menu-toggle', onToggle)
  }, [])

  const handleSignOutClick = () => {
    setShowAccountMenu(false)
    onSignOut()
  }

  return (
    <>
      {/* Mobile drawer */}
      <div className={`mobile-drawer-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`mobile-drawer ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer-inner">
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-logo">
              <button className="sidebar-logo mobile-logo-btn" onClick={() => { onLogoClick(); setMobileOpen(false); }} aria-label="Kembali ke beranda">
                <span className="mobile-logo-text">360 AI</span>
              </button>
              <button
                className="mobile-new-chat-btn"
                onClick={() => { setMobileOpen(false); onNewChat(); }}
                aria-label="Chat Baru"
              >
                <span className="mobile-new-chat-plus">+</span>
                <span className="mobile-new-chat-label">CHAT BARU</span>
              </button>
            </div>
          </div>
          <div className="mobile-drawer-menu">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="menu-item"
                onClick={() => {
                  setMobileOpen(false)
                  if (item.label === "Beranda") window.location.href = "/";
                  else if (item.label === "Agenda") window.location.href = "/agenda";
                  else if (item.label === "Dokumen") window.location.href = "/dokumen";
                  else if (item.label === "Kontak") window.location.href = "/kontak";
                }}
              >
                <span className="menu-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="mobile-drawer-sign">
            {user ? (
              <>
                <button
                  className="mobile-sign-btn"
                  onClick={() => { setMobileOpen(false); }}
                  aria-label={user.displayName || 'Profile'}
                >
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="mobile-sign-avatar" />
                </button>
                <button className="mobile-sign-out" onClick={() => { setMobileOpen(false); handleSignOutClick(); }}>
                  Keluar
                </button>
              </>
            ) : (
              <button className="mobile-sign-in" onClick={() => { setMobileOpen(false); onSignIn(); }}>
                Masuk
              </button>
            )}
          </div>
        </div>
      </aside>

      <aside className="chat-sidebar">
      {/* Desktop layout */}
      <>
        <div className="sidebar-top">
          <button className="sidebar-logo" onClick={onLogoClick} aria-label="Kembali ke beranda">
            <img src={logo} alt="HIMASIF" />
          </button>

          <button className="new-chat-btn" onClick={onNewChat} aria-label="Chat baru">
            <FontAwesomeIcon icon={faPlus} />
            <span className="new-chat-tooltip">New Chat</span>
          </button>

          <div className="sidebar-menu">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="menu-item"
                onClick={() => {
                  if (item.label === "Beranda") window.location.href = "/";
                  else if (item.label === "Agenda") window.location.href = "/agenda";
                  else if (item.label === "Dokumen") window.location.href = "/dokumen";
                  else if (item.label === "Kontak") window.location.href = "/kontak";
                }}
              >
                <span className="menu-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
            {/* User chip removed to avoid double photo when signed in */}

            <div className="sidebar-actions">
              <div className="sign-wrapper">
                <button className="sign-btn" onClick={handleAccountClick} ref={btnRef}>
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User"} className="sign-avatar" />
                  ) : (
                    <span className="sign-icon" aria-hidden="true">
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                  )}
                  <span className="sign-label">{user?.displayName || "Masuk"}</span>
                </button>

                {user && showAccountMenu && createPortal(
                  <div
                    className="account-dropdown compact-dropdown"
                    style={{
                      position: "fixed",
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      zIndex: 9999,
                      transform: "translateY(-50%)"
                    }}
                  >
                    <button className="dropdown-item" onClick={handleSignOutClick}>
                      <FontAwesomeIcon icon={faRightFromBracket} />
                      <span>Keluar</span>
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </>
    </aside>
    </>
  )
}

Sidebar.propTypes = {
  onNewChat: PropTypes.func.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
    })
  ).isRequired,
  onSignIn: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  onLogoClick: PropTypes.func.isRequired,
  user: PropTypes.object,
}

Sidebar.defaultProps = {
  user: null,
}

export default Sidebar
