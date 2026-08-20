//--- 1.Importar bibliotecas ---//
import express from "express"; //Importar as bibliotecas que vamos utilizar
import mysql2 from "mysql2"; //Importar as bibliotecas que vamos utilizar
import cors from "cors"; //
// 🚀 NOVO: Importe o dotenv para usar variáveis de ambiente
import "dotenv/config"; 

//--- 2.Criar conexões e difinições ---//
import pool from "./db.js"; //Serve para guardar a conexão com o banco de dados para o reuso

const port = process.env.PORT || 3015; 
const app = express(); //

app.use(express.json()); //[cite: 1]
 
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://api-gestao-biblioteca.onrender.com/', 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions)); // Agora apenas o SEU frontend pode fazer requisições

app.use(express.static('public'));
// ------------------------------------------------------------- //

//--- 3.Criando a logica da API em conjunto com o banco de dados ---//

//--- 3.1 Criação do CRUD do cliente ---//
app.post('/Client', async (req,res) =>{
    try{ 
        const {nome, email, cpf, telefone} = req.body;

        if (!nome || !email || !cpf){
            return res.status(400).json({erro: "Nome, email e cpf são obrigatórios!"})
        };

        const query = "INSERT INTO clientes (nome, email, cpf, telefone) VALUES (?, ?, ?, ?)";
        const values = [nome, email, cpf, telefone];
        const [result] = await pool.query(query, values);

        res.status(201).json({mensagem: "Cliente cadastrado com sucesso!"});

    }catch (error){
        console.error("erro no cadastro:", error);
        res.status(500).json({erro: "Erro ao criar o cliente"})
    }
});

app.get('/Client', async (req,res) =>{
  try{
      const query = "SELECT * FROM clientes";
      const [rows] = await pool.query(query);

      res.status(200).json(rows);  
    }catch (error){
        console.error("erro ao buscar:", error);
        res.status(500).json({erro: "Erro ao buscar o cliente"})
    }
});

app.get('/Client/:id_clients', async (req,res) =>{
  try{
      const {id_clients} = req.params;

      const query = "SELECT * FROM clientes WHERE id_clients = ?";
      const [rows] = await pool.query(query, [id_clients]);
  
      if (rows.length === 0) {
          return res.status(404).json({ erro: "Cliente não encontrado!" })
      };
      res.status(200).json(rows[0]);
  }catch(error){
      console.error("Erro ao buscar cliente:", error);
      res.status(500).json({erro: "Erro interno ao buscar o cliente"})
  }
});

app.patch('/Client/:id', async (req, res) => {
    try {
        const {id} = req.params; 
        const {cpf, nome, email, telefone} = req.body;

        if (!cpf && !nome && !email && !telefone){
            return res.status(400).json({ erro: "Envie pelo menos um campo (cpf, nome, email ou telefone) para atualizar!" });
        }

        const camposAtualizar = [];
        const valores = [];

        if (cpf) {camposAtualizar.push("cpf = ?"); valores.push(cpf);}
        if (nome) {camposAtualizar.push("nome = ?"); valores.push(nome);}
        if (email) {camposAtualizar.push("email = ?"); valores.push(email);}
        if (telefone) {camposAtualizar.push("telefone = ?"); valores.push(telefone);}
       
        const sqlCampos = camposAtualizar.join(", ");
        const query = `UPDATE clientes SET ${sqlCampos} WHERE id_clients = ?`;

        valores.push(id); 

        const [result] = await pool.query(query, valores);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Cliente não encontrado para atualização!" });
        }

        res.status(200).json({ mensagem: "Cliente atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).json({ erro: "Erro interno ao atualizar cliente"})
    }
});

app.delete('/Client/:id', async (req, res) => {
    try{
        const {id} = req.params;

        const query = "DELETE FROM clientes WHERE id_clients = ?";

        const [result] = await pool.query(query, [id]);

        if(result.affectedRows === 0){
            return res.status(404).json({ erro: "Cliente não encontrado para exclusão!" })
        };
        res.status(200).json({ mensagem: "Cliente deletado com sucesso!" });

    }catch(error) {
        console.error("Erro ao deletar cliente:", error);
        res.status(500).json({ erro: "Erro interno ao deletar o cliente"})
    }
});

//---3.2 Criação do CURD dos livros---//
app.post('/Book', async (req, res) => {
    const connection = await pool.getConnection();

  try{
    const {autor_nome, editora_cnpj, editora_nome, livro_isbn, livro_titulo, livro_data_lancamento} = req.body;

    await connection.beginTransaction();

    const queryAutor = "INSERT INTO autores (nome) VALUES (?)";
    const [resultAutor] = await connection.query(queryAutor, [autor_nome]);
    const idAutor = resultAutor.insertId;

    const queryEditora = "INSERT INTO editora (cnpj, nome) VALUES (?, ?)";
    await connection.query(queryEditora, [editora_cnpj, editora_nome]);

    const queryLivro = "INSERT INTO livros (isbn, titulo, data_lancamento, id_autores, id_editora) VALUES (?, ?, ?, ?, ?)";
    const valuesLivro = [livro_isbn, livro_titulo, livro_data_lancamento, idAutor, editora_cnpj];
    await connection.query(queryLivro, valuesLivro);

    await connection.commit();

    res.status(201).json({
      mensagem: "Autor, Editora e Livro cadastrados com sucesso!",
      livro_cadastrado: livro_titulo});
    } catch (error) {
      
      await connection.rollback();
      console.error("Erro no cadastro completo:", error);
      res.status(500).json({ erro: "Falha ao cadastrar. O processo foi cancelado para evitar dados incompletos." });
        
    }finally {
      connection.release();
    }
});

app.get('/Book', async (req, res) =>{
    try{
        const query = "SELECT * FROM livros";
        const [rows] = await pool.query(query);

        res.status(200).json(rows);  
    }catch (error){
        console.error("erro ao buscar:", error);
        res.status(500).json({erro: "Erro ao buscar o livro"})
    }
});

app.get('/Book/:titulo', async (req, res) =>{
    try{
        const {titulo} = req.params;

        const query = "SELECT * FROM livros WHERE titulo LIKE ?";
        const [rows] = await pool.query(query, [`\%${titulo}%`]);

        if (rows.length === 0) {
            return res.status(404).json({ erro: "Livro não encontrado!" })
        };
        res.status(200).json(rows[0]);
     }catch(error){
        console.error("Erro ao buscar o livro:", error);
        res.status(500).json({erro: "Erro interno ao buscar o livro"})
     }
});

app.delete('/Book/:titulo', async (req, res) =>{
    try{
        const {titulo} = req.params;

        const query = "DELETE FROM livros WHERE titulo LIKE ?";
        const [result] = await pool.query(query, [`\%${titulo}%`]);

        if(result.affectedRows === 0){
            return res.status(404).json({ erro: "Livro não encontrado para exclusão!" })
        };
        res.status(200).json({ mensagem: "Livro deletado com sucesso!" });

    }catch(error) {
        console.error("Erro ao deletar o livro:", error);
        res.status(500).json({ erro: "Erro interno ao deletar o livro"})
    }
});

app.patch('/book/:id', async (req, res) =>{
    try{
        const {id} = req.params;
        const {isbn, titulo, data_lancamento} = req.body;

        if(!isbn && !titulo && !data_lancamento){
            return res.status(400).json({erro:"Envie pelo menos um campo (isbn, titulo ou data lançamento"})
        };

        const camposAtualizar = [];
        const valores = [];
        
        if (isbn) {camposAtualizar.push("isbn = ?"); valores.push(isbn);}
        if (titulo) {camposAtualizar.push("titulo = ?"); valores.push(titulo);}
        if (data_lancamento) {camposAtualizar.push("data_lancamento = ?"); valores.push(data_lancamento);}

        const sqlCampos = camposAtualizar.join(", ");
        const query = `UPDATE livros SET ${sqlCampos} WHERE isbn = ?`;

        valores.push(id);

        const [result] = await pool.query(query, valores);

        if (result.affectedRows === 0){
            return res.status(404).json({erro: "Livro não encontrado para atualização!"});
        }

        return res.status(200).json({erro:"Livro atualizado com sucesso!"});
    }catch(error){
        console.error("Erro ao atualizado livro:", error);
        res.status(500).json({erro: "Erro interno ao atualizar o livro"})
    }
});

//---3.3 Criação do CURD dos autores---//
app.get('/autor', async (req, res) => {
    try{
        const query = "SELECT * FROM autores";
        const [rows] = await pool.query(query);

        res.status(200).json(rows);
    }catch (error){
        console.error("erro ao buscar:", error);
        res.status(500).json({erro: "Erro interno ao buscar o autor"})
    }
});

app.patch('/autor/:id', async (req, res) =>{
    try{
        const {id} = req.params;
        const {nome} = req.body;

        const campoAtualizar = [];
        const valores = [];

        if (nome) {campoAtualizar.push("nome = ?"); valores.push(nome);}

        const sqlCampo = campoAtualizar.join(", ");
        const query = `UPDATE autores SET ${sqlCampo} WHERE id = ?`;

        valores.push(id);

        const [result] = await pool.query(query, valores);
       
        if (result.affectedRows === 0){
            return res.status(404).json({erro: "Autor não encontrado para atualização!"});
        }

        return res.status(200).json({menssagem:"Autor atualizado com sucesso!"});
    }catch(error){
        console.error("Erro ao atualizar autor:", error);
        res.status(500).json({erro: "Erro interno ao atualizar o livro"})
    }
});

app.delete('/autor/:id', async (req, res) =>{
    try{
        const {id} = req.params;

        const query = "DELETE FROM autores WHERE id = ?";
        const [result] = await pool.query(query, [id]);

        if(result.affectedRows === 0){
            return res.status(404).json({erro: "Autor não encontrado para a exclusão!"})
        };
        res.status(200).json({mensagem: "Autor deletado com sucesso!"});

    }catch(error){
        console.error("Erro ao deletar o autor:", error);
        res.status(500).json({erro: "Erro interno ao deletar o autor"})
    }
});

app.post('/autor', async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ erro: "O campo nome é obrigatório!" });
        }

        const query = "INSERT INTO autores (nome) VALUES (?)";
        const [result] = await pool.query(query, [nome]);

        res.status(201).json({ mensagem: "Autor cadastrado com sucesso!" });

    } catch (error) {
        console.error("Erro no cadastro do autor:", error);
        res.status(500).json({ erro: "Erro interno ao criar o autor" });
    }
});            

//---3.4 Criação do CURD dos editora---//
app.post('/editora', async (req, res) => {
    try {
        const { cnpj, nome } = req.body;

        if (!cnpj || !nome) {
            return res.status(400).json({ erro: "CNPJ e nome são obrigatórios!" });
        }

        const query = "INSERT INTO editora (cnpj, nome) VALUES (?, ?)";
        const [result] = await pool.query(query, [cnpj, nome]);

        res.status(201).json({ mensagem: "Editora cadastrada com sucesso!" });

    } catch (error) {
        console.error("Erro no cadastro da editora:", error);
        res.status(500).json({ erro: "Erro interno ao criar a editora" });
    }
});

app.get('/editora', async (req, res) => {
    try {
        const query = "SELECT * FROM editora";
        const [rows] = await pool.query(query);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar editoras:", error);
        res.status(500).json({ erro: "Erro interno ao buscar a editora" });
    }
});

app.patch('/editora/:cnpj', async (req, res) => {
    try {
        const {cnpj} = req.params;
        const {nome} = req.body;

        if (!nome) {
            return res.status(400).json({ erro: "Envie o campo nome para atualizar!" });
        }

        const query = "UPDATE editora SET nome = ? WHERE cnpj = ?";
        const [result] = await pool.query(query, [nome, cnpj]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Editora não encontrada para atualização!" });
        }

        return res.status(200).json({ mensagem: "Editora atualizada com sucesso!" });

    } catch (error) {
        console.error("Erro ao atualizar editora:", error);
        res.status(500).json({ erro: "Erro interno ao atualizar a editora" });
    }
});

app.delete('/editora/:cnpj', async (req, res) => {
    try {
        const {cnpj} = req.params;

        const query = "DELETE FROM editora WHERE cnpj = ?";
        const [result] = await pool.query(query, [cnpj]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Editora não encontrada para a exclusão!" });
        }
        res.status(200).json({ mensagem: "Editora deletada com sucesso!" });

    } catch (error) {
        console.error("Erro ao deletar a editora:", error);
        res.status(500).json({ erro: "Erro interno ao deletar a editora" });
    }
});

app.get('/emprestimo', async (req,res) => {
    try{
        const query = `
            SELECT 
                e.id,
                c.nome AS Nome_Do_Cliente,
                l.titulo AS Nome_Do_Livro 
            FROM emprestimo e 
            INNER JOIN clientes c ON e.id_clientes = c.cpf 
            INNER JOIN livros l ON e.id_livros = l.isbn; 
        `;

        const [result] = await pool.query(query);

        res.status(200).json(result);
    }catch(error) {
        console.error("Erro na rota /emprestimo", error);
        res.status(500).json({ erro: "Erro ao buscar a lista de empréstimos." });
    }
});

app.get('/emprestimo/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                e.id, 
                c.nome AS Nome_Do_Cliente, 
                l.titulo AS Nome_Do_Livro 
            FROM emprestimo e 
            INNER JOIN clientes c ON e.id_clientes = c.cpf 
            INNER JOIN livros l ON e.id_livros = l.isbn 
            WHERE e.id = ?
        `;
        
        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ erro: "Empréstimo não encontrado!" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Erro ao buscar o empréstimo específico:", error);
        res.status(500).json({ erro: "Erro interno ao buscar o empréstimo" });
    }
});

app.post('/emprestimo', async (req, res) => {
    try {
        const {id_clientes, id_livros} = req.body;

        if (!id_clientes || !id_livros) {
            return res.status(400).json({ erro: "Os campos id_clientes, id_livro são obrigatórios!" });
        }

        const query = "INSERT INTO emprestimo (id_clientes, id_livros) VALUES (?, ?)";
        const values = [id_clientes, id_livros];
        
        const [result] = await pool.query(query, values); 

        res.status(201).json({ mensagem: "Empréstimo cadastrado com sucesso!" });

    } catch (error) {
        console.error("Erro no cadastro de empréstimo:", error);
        res.status(500).json({ erro: "Erro interno ao criar o empréstimo" });
    }
});

app.patch('/emprestimo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id_clientes, id_livros } = req.body;

        if (!id_clientes && !id_livros) {
            return res.status(400).json({ erro: "Envie pelo menos um campo (id_clientes ou id_livro) para atualizar!" });
        }

        const camposAtualizar = [];
        const valores = [];

        if (id_clientes) { camposAtualizar.push("id_clientes = ?"); valores.push(id_clientes); }
        if (id_livros) { camposAtualizar.push("id_livro = ?"); valores.push(id_livro); }

        const sqlCampos = camposAtualizar.join(", ");
        const query = `UPDATE emprestimo SET ${sqlCampos} WHERE id = ?`;

        valores.push(id);

        const [result] = await pool.query(query, valores);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Empréstimo não encontrado para atualização!" });
        }

        res.status(200).json({ mensagem: "Empréstimo atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar empréstimo:", error);
        res.status(500).json({ erro: "Erro interno ao atualizar o empréstimo" });
    }
});

//--- 5.Serve para mostar a porta que esta rodando a API no terminal para sabermos que esta rodando a aplicação ---//       
app.listen(port, () => {
    console.log(`Servidor rodando e escutando na porta ${port}`)
});