# 📝 Changelog - TraderNex

Registro de mudanças e melhorias do projeto.

## [Unreleased]

### 🔒 Segurança
- ✅ Removidas todas as credenciais hardcoded do `docker-compose.yml`
- ✅ Configuração via variáveis de ambiente
- ✅ `.gitignore` atualizado para proteger arquivos sensíveis
- ✅ Verificação de email obrigatória no login

### 📧 Email
- ✅ Sistema de envio de emails implementado
- ✅ Templates HTML profissionais
- ✅ Suporte a Gmail, SendGrid e AWS SES
- ✅ Modo desenvolvimento (loga emails no console)
- ✅ Email de verificação automático no registro
- ✅ Email de recuperação de senha

### 🐳 Docker
- ✅ Hot reload configurado (backend e frontend)
- ✅ Dockerfiles de desenvolvimento separados
- ✅ Configuração completa com comentários
- ✅ Scripts de setup automatizados

### 📚 Documentação
- ✅ README.md completo e detalhado
- ✅ SETUP-QUICK.md para início rápido
- ✅ ENV-TEMPLATE.md com todas as variáveis
- ✅ CONTRIBUTING.md com guia de contribuição
- ✅ GITHUB-SETUP.md com instruções para GitHub
- ✅ EMAIL-SETUP.md com configuração de email

### 🔐 Autenticação
- ✅ Logout implementado (frontend e backend)
- ✅ Verificação de email obrigatória
- ✅ Recuperação de senha via email
- ✅ Tokens seguros com expiração

### 🎨 Interface
- ✅ Botão de logout na sidebar
- ✅ Layout responsivo
- ✅ Hot reload funcionando

---

**Última atualização**: 2025-12-13
