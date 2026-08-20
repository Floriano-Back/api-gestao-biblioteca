# 📚 Sistema de Gestão de Biblioteca

Este é um projeto Fullstack de um sistema de biblioteca, desenvolvido como parte do meu aprendizado no **SENAI**. O sistema permite o gerenciamento completo de livros, autores, editoras, clientes e o registro de empréstimos de livros.

## 🚀 Funcionalidades (CRUD)
* **Clientes:** Cadastro, listagem, atualização e remoção de clientes.
* **Livros:** Registro de livros associados a autores e editoras.
* **Autores e Editoras:** Gestão de entidades relacionadas aos livros.
* **Empréstimos:** Controle de locação de livros para clientes.

## 🛠️ Tecnologias Utilizadas
* **Backend:** Node.js com Express.js
* **Banco de Dados:**  MySQL (Driver `mysql2`)
* **Frontend:** HTML, CSS e JavaScript (Servidos estaticamente via Express)
* **Outros:** CORS habilitado e proteção contra SQL Injection utilizando *Parameterized Queries*.

## 📂 Estrutura do Projeto
- `/public` - Arquivos do frontend (Interface do usuário).
- `/src` - Arquivos do backend e configurações do servidor.
- `db.js` - Configuração da conexão com o banco de dados.
- `main.js` - Rotas da API e inicialização do servidor.

## ⚙️ Como executar localmente

1. Clone este repositório:
   ```bash
   git clone [https://github.com/Floriano-Back/api-gestao-biblioteca.git]