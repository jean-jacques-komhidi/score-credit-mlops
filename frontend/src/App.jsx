import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { UserProvider } from "./context/UserContext"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Analyse from "./pages/Analyse"
import Monitoring from "./pages/Monitoring"
import Parametres from "./pages/Parametres"

export default function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Sidebar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/parametres" element={<Parametres />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </UserProvider>
  )
}