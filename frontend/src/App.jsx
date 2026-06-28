import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Analyse from "./pages/Analyse"
import Monitoring from "./pages/Monitoring"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyse" element={<Analyse />} />
          <Route path="/monitoring" element={<Monitoring />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}