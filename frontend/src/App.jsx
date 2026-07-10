// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { UserProvider } from "./context/UserContext"
import { NotificationsProvider } from "./context/NotificationsContext"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Analyse from "./pages/Analyse"
import Monitoring from "./pages/Monitoring"
import Parametres from "./pages/Parametres"
import Notifications from "./pages/Notifications"
import Profil from "./pages/Profil"
import Clients from "./pages/Clients"
import ClientDetail from "./pages/ClientDetail"

export default function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <Sidebar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyse" element={<Analyse />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profil" element={<Profil />} />
            </Routes>
          </BrowserRouter>
        </NotificationsProvider>
      </ThemeProvider>
    </UserProvider>
  )
}