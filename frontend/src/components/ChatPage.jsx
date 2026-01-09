"use client"

import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { signInWithPopup, signOut } from "firebase/auth"
// Toast component removed; keep a no-op fallback for notifications
import Sidebar from "./Sidebar"
import "./ChatPage.css"
import Header from "./Header"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPaperPlane,
  faArrowDown,
  faComments,
  faHouse,
  faCalendarDays,
  faFolderOpen,
  faAddressBook,
  faCopy,
  faShareNodes,
  faDownload,
} from "@fortawesome/free-solid-svg-icons"
import { auth, googleProvider } from "../lib/firebase"

function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  // toast state removed (Toast component deleted)
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false)
  const [user, setUser] = useState(null)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const navItems = [
    { label: "Beranda", icon: faHouse },
    { label: "Agenda", icon: faCalendarDays },
    { label: "Dokumen", icon: faFolderOpen },
    { label: "Kontak", icon: faAddressBook },
  ]

  const inputRef = useRef(null)
  const messageContainerRef = useRef(null)

  const resizeInput = () => {
    if (!inputRef.current) return
    const el = inputRef.current
    el.style.height = "auto"
    // Default max height (desktop fallback)
    const viewportMax = Math.floor(window.innerHeight * 0.4) // 40vh
    let max = 220
    try {
      // allow textarea to grow up to viewportMax on mobile
      max = viewportMax
    } catch (e) {
      max = 220
    }

    const nextHeight = Math.min(el.scrollHeight, max)
    el.style.height = `${nextHeight}px`

    // expand the parent container (.chat-input-section) to fit the textarea
    try {
      const parent = el.closest('.chat-input-section')
      const wrapper = el.closest('.input-wrapper')
      if (parent) {
        // add small padding for wrapper + controls
        parent.style.height = `${nextHeight + 24}px`
      }
      // toggle a class on the input wrapper when the textarea is small
      if (wrapper) {
        const smallThreshold = 56 // single-line-ish threshold
        if (nextHeight <= smallThreshold) wrapper.classList.add('small-input')
        else wrapper.classList.remove('small-input')
      }
      // ensure messages container has enough bottom padding so content isn't covered
      if (messageContainerRef.current) {
        messageContainerRef.current.style.paddingBottom = `${(parent ? parent.clientHeight : viewportMax) + 28}px`
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
      }
    } catch (e) {
      // ignore
    }
  }

  const handleLogoClick = () => navigate("/")

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return

    const trimmed = messageText.trim()

    const userMessage = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage("")
    setIsLoading(true)

    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.style.height = "auto"
    }

    try {
      const backendBase = import.meta.env.VITE_BACKEND_URL || ''
      const url = backendBase ? `${backendBase.replace(/\/$/, '')}/chat` : '/chat'
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      let botText = data.response || "Maaf, terjadi kesalahan."
      // Tambahkan quick follow-up suggestions jika ada (hanya jika bukan error)
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        botText += `<br/><br/><span class='bot-suggest-label'>Coba tanyakan juga:</span><br/>` +
          data.suggestions.map(q => `• ${q}`).join('<br/>')
      }
      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: "bot",
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...newMessages, botMessage]
      setMessages(finalMessages)
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage = {
        id: Date.now() + 1,
        text: "Maaf, saya tidak bisa terhubung ke server. Silakan coba lagi.",
        sender: "bot",
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (text, isBot = false) => {
    let formatted = text

    // Remove emoji for bot responses
    if (isBot) {
      try {
        formatted = formatted.replace(/\p{Emoji_Presentation}|\p{Emoji}/gu, "")
      } catch (e) {
        // fallback for environments without Unicode emoji property support
        formatted = formatted.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu, "")
      }
    }

    // Preserve code blocks first
    const codeBlocks = []
    formatted = formatted.replace(/```([\s\S]*?)```/g, (m, code) => {
      const idx = codeBlocks.push(code.trim()) - 1
      return `{{CODEBLOCK_${idx}}}`
    })

    // Simple markdown -> HTML for bold/italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, (m, p1) => `<strong>${p1}</strong>`)
    formatted = formatted.replace(/\*(.*?)\*/g, (m, p1) => `<em>${p1}</em>`)

    // Normalize newlines then convert to <br/>
    formatted = formatted.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    formatted = formatted.replace(/\n/g, "<br/>")

    // Remove accidental leading dots at start of lines for bot messages (e.g. ". Judul")
    if (isBot) {
      formatted = formatted.replace(/(^|<br\/?>)\s*\.{1,}\s*/g, "$1")
    }

    if (isBot) {
      // Ensure first visible line becomes the bot header
      const firstBreakIdx = formatted.indexOf('<br/>')
      if (firstBreakIdx === -1) {
        // single line -> entire line is header
        formatted = `<span class='bot-header'>${formatted.trim()}</span>`
      } else {
        const header = formatted.slice(0, firstBreakIdx).trim()
        const rest = formatted.slice(firstBreakIdx + 5).trim()
        formatted = `<span class='bot-header'>${header}</span>${rest ? '<br/>' + rest : ''}`
      }

      // Section headers: lines that start with ". " or "## "
      formatted = formatted.replace(/(?:<br\/?>)\s*(?:\.\s*|##\s*)([^<\n]+)(?=<br|$)/g, (m, title) =>
        `<br/><span class='bot-section-header'>${title.trim()}</span>`
      )

      // Callout lines: start with "Note:" or "Catatan:" or prefixed with "> "
      formatted = formatted.replace(/(?:<br\/?>)\s*(?:Note:|Catatan:)\s*([^<\n]+)(?=<br|$)/g, (m, note) =>
        `<br/><div class='bot-callout'>${note.trim()}</div>`
      )
      formatted = formatted.replace(/(?:<br\/?>)\s*>\s*([^<\n]+)(?=<br|$)/g, (m, note) =>
        `<br/><div class='bot-callout'>${note.trim()}</div>`
      )

      // List header lines like "- Title:" -> styled
      formatted = formatted.replace(/(?:<br\/?>)\s*-\s*([^:]+:)/g, (m, listHeader) =>
        `<br/><span class='bot-list-header'>• ${listHeader.replace(/^-\s*/, '').trim()}</span>`
      )

      // Convert remaining dash bullets to dots
      formatted = formatted.replace(/(?:<br\/?>)\s*-\s+/g, '<br/>• ')

      // Keep strong tags but allow CSS to style them for bot visuals
      formatted = formatted.replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
    }

    // restore code blocks
    formatted = formatted.replace(/\{\{CODEBLOCK_(\d+)\}\}/g, (m, idx) => {
      const code = codeBlocks[Number(idx)] || ''
      return `<pre><code>${code}</code></pre>`
    })

    // Defensive: remove any remaining single dot or bullet before bot spans
    if (isBot) {
      // Remove dot or bullet at start of string before bot spans
      formatted = formatted.replace(/^\s*[\.\u2022]\s*(?=<span class='bot-)/, '')
      // Remove dot or bullet immediately before bot spans after line breaks
      formatted = formatted.replace(/(?:<br\/?>)\s*[\.\u2022]\s*(?=<span class='bot-)/g, '<br/>')
    }

    return formatted
  }

  // fallback no-op toast to avoid errors where showToast is called
  const showToast = (message, type) => {
    // console fallback; UI toast was removed
    console.info("toast:", type, message)
  }

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const shareMessage = (text) => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
      return
    }
    navigator.clipboard.writeText(text)
  }

  const downloadMessage = (text, id) => {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `chat-${id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleNewChat = () => {
    setMessages([])
    setInputMessage("")
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
    }
  }

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      showToast("Berhasil masuk dengan Google", "success")
    } catch (error) {
      console.error("Google sign-in error:", error)
      showToast("Gagal masuk, coba lagi", "error")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
      showToast("Berhasil keluar", "success")
    } catch (error) {
      console.error("Sign-out error:", error)
      showToast("Gagal keluar, coba lagi", "error")
    }
  }

  useEffect(() => {
    if (location.state?.initialQuery && !hasProcessedInitialQuery) {
      const initial = location.state.initialQuery.trim()
      setInputMessage(initial)
      sendMessage(initial)
      setHasProcessedInitialQuery(true)
      window.history.replaceState({}, document.title)
    }
  }, [location, hasProcessedInitialQuery])

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages])

  // Show/hide scroll down button
  useEffect(() => {
    const container = messageContainerRef.current
    if (!container) return
    const handleScroll = () => {
      // Show button if not at bottom (allow 40px tolerance)
      setShowScrollDown(
        container.scrollHeight - container.scrollTop - container.clientHeight > 40
      )
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    resizeInput()
  }, [inputMessage])

  return (
    <div className="chat-page">
      <Sidebar
        onNewChat={handleNewChat}
        navItems={navItems}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        user={user}
        onLogoClick={handleLogoClick}
      />

      {/* MAIN CHAT */}
      <Header />
      <div className="chat-main">
        {/* MESSAGES */}
        <div className="messages-container" ref={messageContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FontAwesomeIcon icon={faComments} />
              </div>
              <h3>Mulai Percakapan</h3>
              <p>Tanyakan apapun tentang HIMASIF, dan AI saya akan siap membantu!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  <div
                    className="message-text"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text, msg.sender === 'bot') }}
                  />
                  {/* waktu dihapus sesuai permintaan */}
                  {msg.sender === "bot" && (
                    <div className="message-actions">
                      <button className="action-btn" onClick={() => shareMessage(msg.text)} aria-label="Bagikan">
                        <FontAwesomeIcon icon={faShareNodes} />
                        <span className="action-tooltip">Share</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => copyMessage(msg.text, msg.id)}
                        aria-label="Salin"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                        <span className="action-tooltip">{copiedId === msg.id ? "Berhasil" : "Copy"}</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => downloadMessage(msg.text, msg.id)}
                        aria-label="Unduh"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        <span className="action-tooltip">Download</span>
                      </button>
                    </div>
                  )}
                </div>
                {msg.sender === "user" && <div className="message-avatar user-avatar">👤</div>}
              </div>
            ))
          )}

          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SCROLL-TO-BOTTOM BUTTON (above input, outside input wrapper) */}
        {showScrollDown && (
          <button
            className="scroll-down-btn scroll-down-btn-above-input"
            onClick={scrollToBottom}
            aria-label="Scroll ke bawah"
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </button>
        )}

        {/* INPUT */}
        <div className="chat-input-section">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputMessage}
              rows={1}
              onChange={(e) => {
                setInputMessage(e.target.value)
                resizeInput()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Tanya sesuatu..."
              className="chat-input"
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()} className="send-btn">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>

      
    </div>
  )
}

export default ChatPage
