import { BrowserRouter, Route, Routes } from 'react-router'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx'
import { RootLayout } from './components/RootLayout.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AddGamePage } from './pages/AddGamePage.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { GameDetailPage } from './pages/GameDetailPage.jsx'
import { LibraryPage } from './pages/LibraryPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route element={<RootLayout />}>
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <AuthPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<LibraryPage />} />
                    <Route path="/add" element={<AddGamePage />} />
                    <Route path="/games/:id" element={<GameDetailPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  )
}
