import { useState, useEffect } from 'react'

/**
 * Hook para detectar e instalar PWA em todos os navegadores
 * Suporta: Chrome, Edge, Safari, Firefox
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar se está rodando no iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    // Detectar Safari (iOS ou desktop)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || iOS
    setIsIOS(iOS)
    
    // Variável para usar no return
    let safariDetected = isSafari

    // Detectar se já está instalado (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://')
    setIsStandalone(standalone)
    setIsInstalled(standalone)

    // Para Chrome, Edge, Firefox (navegadores baseados em Chromium)
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir o prompt padrão
      e.preventDefault()
      // Salvar o evento para usar depois
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Para Safari iOS - verificar se pode ser instalado
    // No Safari iOS, o usuário precisa usar o menu "Compartilhar" > "Adicionar à Tela de Início"
    if (iOS && !standalone) {
      setIsInstallable(true)
    }

    // Para Safari desktop (macOS) - também pode instalar PWA
    if (safariDetected && !iOS && !standalone && 'serviceWorker' in navigator) {
      // Safari desktop suporta PWA desde a versão 16.4+
      setIsInstallable(true)
    }

    // Para outros navegadores, sempre permitir mostrar o botão se tiver service worker
    if (!standalone && 'serviceWorker' in navigator && !safariDetected && !iOS) {
      // Mesmo sem prompt nativo, podemos mostrar instruções
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Limpar quando o app for instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = async () => {
    if (isInstalled) {
      return { success: false, message: 'App já está instalado' }
    }

    // Para Chrome, Edge, Firefox
    if (deferredPrompt) {
      try {
        // Mostrar o prompt de instalação
        deferredPrompt.prompt()
        
        // Aguardar a resposta do usuário
        const { outcome } = await deferredPrompt.userChoice
        
        // Limpar o prompt
        setDeferredPrompt(null)
        setIsInstallable(false)

        if (outcome === 'accepted') {
          setIsInstalled(true)
          return { success: true, message: 'App instalado com sucesso!' }
        } else {
          return { success: false, message: 'Instalação cancelada pelo usuário' }
        }
      } catch (error) {
        console.error('Erro ao instalar PWA:', error)
        return { success: false, message: 'Erro ao instalar o app' }
      }
    }

    // Para Safari iOS - mostrar instruções
    if (isIOS && !isStandalone) {
      // Retornar instruções para o usuário
      return { 
        success: false, 
        message: 'ios-instructions',
        instructions: 'Para instalar no iOS: toque no botão Compartilhar e selecione "Adicionar à Tela de Início"'
      }
    }

    // Para Safari desktop - mostrar instruções
    const isSafariDesktop = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !isIOS
    if (isSafariDesktop && !isStandalone) {
      return { 
        success: false, 
        message: 'safari-instructions',
        instructions: 'Para instalar no Safari: vá em Arquivo > Adicionar à Tela de Início ou use o menu Compartilhar'
      }
    }

    // Para Chrome/Edge quando não há prompt nativo - mostrar instruções
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    const isEdge = /Edg/.test(navigator.userAgent)
    if ((isChrome || isEdge) && !isStandalone) {
      return { 
        success: false, 
        message: 'chrome-instructions',
        instructions: 'Para instalar: clique no ícone de instalação na barra de endereços ou vá em Menu > Instalar TraderNex'
      }
    }

    return { success: false, message: 'Instalação não disponível neste navegador' }
  }

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    isIOS,
    isStandalone,
    install
  }
}

