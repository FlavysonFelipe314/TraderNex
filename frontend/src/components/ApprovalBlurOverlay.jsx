import { Icon } from '@iconify/react'

/**
 * Componente que adiciona um overlay com blur cinza, cadeado e mensagem
 * sobre conteúdo quando o usuário não está aprovado pelo admin
 */
function ApprovalBlurOverlay({ children, isApproved }) {
  // Se estiver aprovado, apenas retorna o conteúdo normal
  if (isApproved) {
    return children
  }

  return (
    <div className="relative">
      {/* Conteúdo com blur cinza */}
      <div className="blur-sm opacity-50 pointer-events-none select-none grayscale">
        {children}
      </div>
      
      {/* Overlay com cadeado e mensagem */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-md rounded-xl z-10">
        <div className="flex flex-col items-center gap-4 px-4">
          <div className="w-16 h-16 rounded-full bg-gray-800/90 border-2 border-gray-700 flex items-center justify-center shadow-xl">
            <Icon 
              icon="lucide:lock" 
              className="text-3xl text-gray-400"
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-200 mb-2">
              Aguardando aprovação do admin
            </p>
            <p className="text-sm text-gray-400 max-w-xs">
              Seus dados do MyFXBook ficarão disponíveis após a aprovação do administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApprovalBlurOverlay

