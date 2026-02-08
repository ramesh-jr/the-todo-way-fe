import { BrowserRouter, Route, Routes } from "react-router"

import AuthGuard from "@/components/auth/AuthGuard"
import MainLayout from "@/components/layout/MainLayout"
import CalendarPage from "@/pages/CalendarPage"
import InboxPage from "@/pages/InboxPage"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import TodosPage from "@/pages/TodosPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes */}
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/todos" element={<TodosPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
