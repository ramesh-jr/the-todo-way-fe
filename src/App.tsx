import { BrowserRouter, Route, Routes } from "react-router"

import AuthGuard from "@/components/auth/AuthGuard"
import MainLayout from "@/components/layout/MainLayout"
import CalendarPage from "@/pages/CalendarPage"
import DomainsPage from "@/pages/DomainsPage"
import InboxPage from "@/pages/InboxPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import ReviewPage from "@/pages/ReviewPage"
import SettingsPage from "@/pages/SettingsPage"
import TodayPage from "@/pages/TodayPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<TodayPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/domains" element={<DomainsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
