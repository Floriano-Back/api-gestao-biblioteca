CREATE TABLE autores (
    idAutor INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE editora (
    cnpj VARCHAR(14) PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE clientes (
    cpf VARCHAR(11) PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    email VARCHAR(60) NOT NULL UNIQUE,
    telefone VARCHAR(9) NOT NULL 
);

-- 2. Tabelas com chaves estrangeiras
CREATE TABLE livros (
    isbn VARCHAR(13) PRIMARY KEY,
    titulo VARCHAR(60) NOT NULL UNIQUE,
    data_lancamento DATE NOT NULL,
    id_autores INT NOT NULL,
    id_editora VARCHAR(14) NOT NULL,
    FOREIGN KEY (id_autores) REFERENCES autores(idAutor),
    FOREIGN KEY (id_editora) REFERENCES editora(cnpj)
);

CREATE TABLE emprestimo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_livros VARCHAR(13) NOT NULL,
    id_clientes VARCHAR(11) NOT NULL,
    FOREIGN KEY (id_livros) REFERENCES livros(isbn),
    FOREIGN KEY (id_clientes) REFERENCES clientes(cpf)
);

ALTER TABLE clientes ADD COLUMN id_clients  INT AUTO_INCREMENT UNIQUE FIRST;