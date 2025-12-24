import { Icon } from "@iconify/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

function AccountCreatedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerifyEmail = useCallback(async (token) => {
    try {
      const result = await verifyEmail(token);
      setVerificationStatus(result.success ? 'success' : 'error');
    } catch (err) {
      setVerificationStatus('error');
      console.error('Erro ao verificar e-mail:', err);
    }
  }, [verifyEmail]);

  // Verificar se há token de verificação na URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleVerifyEmail(token);
    }
  }, [searchParams, handleVerifyEmail]);

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      // TODO: Implementar endpoint de reenvio de e-mail de verificação
      // Por enquanto, apenas mostra mensagem
      setResendMessage('E-mail de verificação reenviado! Verifique sua caixa de entrada.');
    } catch (err) {
      setResendMessage('Erro ao reenviar e-mail. Tente novamente.');
      console.error('Erro ao reenviar e-mail:', err);
    } finally {
      setResendLoading(false);
    }
  };

  const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        :root {
          --background: #FFFFFF;
          --sidebar-bg: #0E0E10;
          --surface: #FFFFFF;
          --border: #E5E7EB;
          --text-main: #111827;
          --text-secondary: #6B7280;
          --primary: #00FF88;
          --primary-hover: #00CC6A;
          --teal: #00AFAA;
          --danger: #EF4444;
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 24px;
        }

        /* Layout Split 50/50 */
        .split-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        @media (min-width: 1024px) {
          .split-layout {
            flex-direction: row;
          }
        }

        /* Left Side - Institutional */
        .left-panel {
          display: none;
          flex: 1;
          background-color: var(--sidebar-bg);
          background-image:
            linear-gradient(rgba(14, 14, 16, 0.95), rgba(14, 14, 16, 0.95)),
            url('https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2664&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 60px;
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .left-panel {
            display: flex;
            padding: 60px 80px;
          }
        }

        /* Grid pattern overlay */
        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .logo-dot {
          width: 10px;
          height: 10px;
          background-color: var(--primary);
          border-radius: 50%;
          box-shadow: 0 0 12px var(--primary);
        }

        .logo-text {
          color: white;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 520px;
        }

        .hero-title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.03em;
        }

        @media (min-width: 1024px) {
          .hero-title {
            font-size: 42px;
            margin-bottom: 24px;
          }
        }

        .hero-subtitle {
          font-size: 16px;
          color: #9CA3AF;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        @media (min-width: 1024px) {
          .hero-subtitle {
            font-size: 18px;
            margin-bottom: 40px;
          }
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #E5E7EB;
          font-size: 15px;
          font-weight: 500;
        }

        .check-icon {
          color: var(--primary);
          display: flex;
          align-items: center;
        }

        /* Floating Social Proof Card */
        .social-proof-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 380px;
          margin-top: 60px;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .proof-info h4 {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .proof-info p {
          color: var(--primary);
          font-size: 13px;
          font-weight: 600;
        }

        /* Right Side - Confirmation */
        .right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background-color: #FFFFFF;
        }

        @media (min-width: 640px) {
          .right-panel {
            padding: 40px;
          }
        }

        .auth-container {
          width: 100%;
          max-width: 440px;
          text-align: center;
        }

        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          background-color: rgba(0, 255, 136, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          color: var(--teal);
        }

        .form-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        @media (min-width: 640px) {
          .form-title {
            font-size: 28px;
          }
        }

        .form-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 30px;
        }

        @media (min-width: 640px) {
          .form-subtitle {
            font-size: 16px;
            margin-bottom: 40px;
          }
        }

        .form-subtitle strong {
          color: var(--text-main);
          font-weight: 600;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 48px;
          background-color: var(--sidebar-bg);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
          text-decoration: none;
        }

        @media (min-width: 640px) {
          .btn-primary {
            height: 52px;
            font-size: 16px;
          }
        }

        .btn-primary:hover {
          background-color: #000000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          color: var(--primary);
        }

        .resend-text {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .resend-link {
          color: var(--teal);
          text-decoration: none;
          font-weight: 600;
          margin-left: 4px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .resend-link:hover {
          color: var(--text-main);
          text-decoration: underline;
        }

        .footer-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 60px;
          font-size: 12px;
          color: #9CA3AF;
          padding-top: 24px;
          border-top: 1px solid #F3F4F6;
        }
      `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="split-layout">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="grid-overlay"></div>

          <div className="logo-container">
            <div className="logo-dot"></div>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">Bem-vindo à elite dos investidores.</h1>
            <p className="hero-subtitle">
              Sua conta foi criada. O setup automatizado do Falcon FX estará
              disponível assim que você confirmar seu e-mail.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="check-icon">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      icon="lucide:check-circle-2"
                      style={{ fontSize: "20px" }}
                    />
                  </div>
                </div>
                Acesso imediato à plataforma
              </div>
              <div className="feature-item">
                <div className="check-icon">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      icon="lucide:check-circle-2"
                      style={{ fontSize: "20px" }}
                    />
                  </div>
                </div>
                Segurança e criptografia ativadas
              </div>
            </div>

            <div className="social-proof-card">
              <img
                src="https://app.banani.co/avatar1.jpeg"
                alt="Cliente"
                className="avatar"
              />
              <div className="proof-info">
                <h4>Gestor de Sucesso</h4>
                <p>Seu onboarding começa agora.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="auth-container">
            <div className="success-icon-wrapper">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon icon="lucide:party-popper" style={{ fontSize: "40px" }} />
              </div>
            </div>

            <h2 className="form-title">Conta criada com sucesso!</h2>
            <p className="form-subtitle">
              Enviamos um link de confirmação para o seu e-mail. <br />
              Clique no link para ativar sua conta e acessar o painel.
            </p>

            {verificationStatus === 'success' && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">E-mail verificado com sucesso! Você pode fazer login agora.</p>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Erro ao verificar e-mail. O link pode ter expirado.</p>
              </div>
            )}

            {resendMessage && (
              <div className={`mb-6 p-3 rounded-lg text-sm ${
                resendMessage.includes('sucesso') 
                  ? 'bg-green-50 border border-green-200 text-green-600' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {resendMessage}
              </div>
            )}

          <a
            href="#"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault()
              handleBackToLogin()
            }}
            data-media-type="banani-button"
          >
            Voltar para o Login
          </a>

          <p className="resend-text">
            Não recebeu o e-mail?
            <a
              href="#"
              className="resend-link"
              onClick={(e) => {
                e.preventDefault()
                if (!resendLoading) {
                  handleResendEmail()
                }
              }}
              data-media-type="banani-button"
            >
              {resendLoading ? 'Enviando...' : 'Reenviar confirmação'}
            </a>
          </p>

            <div className="footer-secure">
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon icon="lucide:shield-check" style={{ fontSize: "14px" }} />
              </div>
              Ambiente protegido por criptografia TLS 1.3
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AccountCreatedPage;
