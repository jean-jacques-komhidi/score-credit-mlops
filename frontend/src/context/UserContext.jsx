import { createContext, useContext, useState } from "react"

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    nom: "Jean Jacques",
    prenom: "Komhidi",
    role: "Analyste crédit",
    email: "jkomhidi2002@gmail.com",
    organisation: "Master 2 UCAO",
  })

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }))
  }

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}