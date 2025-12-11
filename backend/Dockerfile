# Use a imagem oficial do Node.js como base
FROM node:18

# Defina o diretório de trabalho no container
WORKDIR /usr/src/app

# Copie os arquivos de definição de dependências
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie os arquivos do projeto
COPY . .

# Exponha a porta que a aplicação usará
EXPOSE 5004

# Comando para rodar a aplicação
CMD ["node", "src/server.js"]