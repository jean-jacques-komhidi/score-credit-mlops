import { createContext, useContext, useState, useEffect } from "react"
import { getStats, getDriftStats, getActionsLog } from "../services/api"

const NotificationsContext = createContext()

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasVisited, setHasVisited] = useState(false)

  const refreshCount = async () => {
    try {
      const [stats, drift] = await Promise.all([getStats(), getDriftStats()])
      let count = 0
      if (stats.total > 0) count += 1
      count += drift.drift_features.length
      count += 1 // modèle actif
      setUnreadCount(hasVisited ? 0 : count)
    } catch (error) {
      console.error(error)
    }
  }

  const markAsRead = () => {
    setHasVisited(true)
    setUnreadCount(0)
  }

  useEffect(() => {
    refreshCount()
  }, [])

  return (
    <NotificationsContext.Provider value={{ unreadCount, markAsRead, refreshCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}