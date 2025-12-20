import { Routes, Route, Navigate } from "react-router-dom";
import "./css/App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import DashboardRedirect from "./components/DashboardRedirect";
import LoginPage from "./page/LoginPage";
import RegisterPage from "./page/RegisterPage";
import AccountCreatedPage from "./page/AccountCreatedPage";
import EmailSentPage from "./page/EmailSentPage";
import ForgotPasswordPage from "./page/ForgotPasswordPage";
import ResetPasswordPage from "./page/ResetPasswordPage";
import DashboardPage from "./page/DashboardPage";
import PerfilClientePage from "./page/PerfilClientePage";
import PerfilAdminPage from "./page/PerfilAdminPage";
import ContaForexMT4Page from "./page/ContaForexMT4Page";
import ReferralProgramPage from "./page/ReferralProgramPage";
import InvestirPlanosPage from "./page/InvestirPlanosPage";
import CriptoEmBrevePage from "./page/CriptoEmBrevePage";
import SuporteClientePage from "./page/SuporteClientePage";
import RelatoriosPerformancePage from "./page/RelatoriosPerformancePage";
import FaturasPerformancePage from "./page/FaturasPerformancePage";
import Mt4CredentialsPage from "./page/Mt4CredentialsPage";
import AdminPage from "./page/AdminPage";
import AdminPlansPage from "./page/AdminPlansPage";
import AdminUsersPage from "./page/AdminUsersPage";
import AdminCryptoInterestedPage from "./page/AdminCryptoInterestedPage";
import AdminReferralsPage from "./page/AdminReferralsPage";
import AdminInvoicesPage from "./page/AdminInvoicesPage";

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account-created" element={<AccountCreatedPage />} />
        <Route path="/verify-email" element={<AccountCreatedPage />} />
        <Route path="/email-sent" element={<EmailSentPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rotas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect>
                <DashboardPage />
              </DashboardRedirect>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil-cliente"
          element={
            <ProtectedRoute>
              <PerfilClientePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conta-forex-mt4"
          element={
            <ProtectedRoute>
              <ContaForexMT4Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mt4-config"
          element={
            <ProtectedRoute>
              <Mt4CredentialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referral-program"
          element={
            <ProtectedRoute>
              <ReferralProgramPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investir-planos"
          element={
            <ProtectedRoute>
              <InvestirPlanosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cripto-em-breve"
          element={
            <ProtectedRoute>
              <CriptoEmBrevePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suporte-cliente"
          element={
            <ProtectedRoute>
              <SuporteClientePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios-performance"
          element={
            <ProtectedRoute>
              <RelatoriosPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faturas-performance"
          element={
            <ProtectedRoute>
              <FaturasPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/plans"
          element={
            <AdminProtectedRoute>
              <AdminPlansPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/crypto-interested"
          element={
            <AdminProtectedRoute>
              <AdminCryptoInterestedPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/referrals"
          element={
            <AdminProtectedRoute>
              <AdminReferralsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices"
          element={
            <AdminProtectedRoute>
              <AdminInvoicesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/perfil-admin"
          element={
            <AdminProtectedRoute>
              <PerfilAdminPage />
            </AdminProtectedRoute>
          }
        />

        {/* Redireciona rota raiz para /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Rota 404 simples */}
        <Route path="*" element={<div>404 - Página não encontrada</div>} />
      </Routes>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
