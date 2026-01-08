"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowRight,
  faStar,
  faZap,
  faLightbulb,
  faGraduationCap,
  faHouse,
  faCalendarDays,
  faFolderOpen,
  faAddressBook,
} from "@fortawesome/free-solid-svg-icons"
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons"
import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../lib/firebase"
import Sidebar from "./Sidebar"
import Header from "./Header"
import "./HomePage.css"

function HomePage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const navItems = [
    { label: "Beranda", icon: faHouse },
    { label: "Agenda", icon: faCalendarDays },
    { label: "Dokumen", icon: faFolderOpen },
    { label: "Kontak", icon: faAddressBook },
  ]

  const handleLogoClick = () => navigate("/")
  const handleNewChat = () => navigate("/chat")
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
    } catch (err) {
      alert("Gagal login: " + err.message)
    }
  }
  const handleSignOut = () => {
    setUser(null)
    // Optionally, sign out from Firebase as well
    // import { signOut } from "firebase/auth" and call signOut(auth) if needed
  }

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return
    setIsLoading(true)
    navigate("/chat", { state: { initialQuery: query.trim() } })
    setIsLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const adjustHeight = () => {
    const el = inputRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.style.height = "auto"
      const max = window.innerHeight * 0.5
      const newH = Math.min(el.scrollHeight, max)
      el.style.height = `${newH}px`
    })
  }

  useEffect(() => {
    adjustHeight()
    // also adjust on window resize to keep height reasonable
    const onResize = () => adjustHeight()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [query])

  const handleQuickPrompt = (promptQuery) => {
    navigate("/chat", { state: { initialQuery: promptQuery } })
  }

  const quickPrompts = [
    { id: 1, icon: "🎓", text: "Tentang HIMASIF", query: "Apa itu HIMASIF dan apa visinya?" },
    { id: 2, icon: "👥", text: "Anggota Pengurus", query: "Siapa saja anggota BPH HIMASIF?" },
    { id: 3, icon: "📚", text: "Divisi & Departemen", query: "Apa saja divisi di HIMASIF?" },
  ]

  return (
    <div className="homepage">
      {/* Sidebar: always render, component handles mobile/desktop */}
      <div className="home-sidebar">
        <Sidebar
          onNewChat={handleNewChat}
          navItems={navItems}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onLogoClick={handleLogoClick}
          user={user}
        />
      </div>
      <div className="home-main">
        <Header />
        <div className="home-hero">
          <div className="hero-content">
            <h2 className="hero-title">
              <span className="gradient-text">360 AI</span>
              <span className="hero-title-white">HIMASIF</span>
            </h2>
            <p className="hero-subtitle hero-tagline">selalu aktif, siap membantu</p>
            <div className="search-container">
              <div className="search-input-wrapper">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    requestAnimationFrame(adjustHeight)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari informasi apapun.."
                  className="search-input"
                  rows={1}
                />
                <button onClick={handleSearch} disabled={isLoading} className="search-btn">
                  {isLoading ? "Mencari..." : <FontAwesomeIcon icon={faArrowRight} />}
                </button>
              </div>
            </div>
            <div className="quick-prompts">
              <p className="prompts-label">Coba pertanyaan ini:</p>
              <div className="prompts-grid">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt.query)}
                    className="prompt-btn"
                  >
                    <span className="prompt-icon">{prompt.icon}</span>
                    <span className="prompt-text">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="home-footer-bar">
          <div className="home-footnote">360 AI HIMASIF UPJ</div>
          <div className="home-footer-socials">
            <a href="https://instagram.com/himasifupj" target="_blank" rel="noopener" aria-label="Instagram" className="footer-social-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.tiktok.com/@himasifupj" target="_blank" rel="noopener" aria-label="TikTok" className="footer-social-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17a4 4 0 1 1 0-8v8zm0 0a4 4 0 0 0 4-4V3h3a5 5 0 0 0 5 5"/></svg>
            </a>
            <a href="https://himasif.org" target="_blank" rel="noopener" aria-label="Website" className="footer-social-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
            </a>
            <a href="mailto:himasif@upj.ac.id" aria-label="Email" className="footer-social-link">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
