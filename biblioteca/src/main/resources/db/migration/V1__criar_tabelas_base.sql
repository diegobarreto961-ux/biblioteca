CREATE TABLE usuario (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE,
    telefone      VARCHAR(20)  UNIQUE,
    senha_hash    VARCHAR(255) NOT NULL,
    tipo          VARCHAR(15)  NOT NULL,
    CONSTRAINT ck_usuario_tipo CHECK (tipo IN ('CLIENTE', 'ADMINISTRADOR')),
    CONSTRAINT ck_usuario_login CHECK (email IS NOT NULL OR telefone IS NOT NULL)
);

CREATE TABLE livro (
    id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    isbn                  VARCHAR(17)  NOT NULL UNIQUE,
    titulo                VARCHAR(200) NOT NULL,
    autor                 VARCHAR(150) NOT NULL,
    genero                VARCHAR(80)  NOT NULL,
    quantidade_total      INT NOT NULL,
    quantidade_disponivel INT NOT NULL,
    CONSTRAINT ck_livro_quantidade CHECK (
        quantidade_disponivel >= 0 AND quantidade_disponivel <= quantidade_total
    )
);

CREATE TABLE emprestimo (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente              INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    id_administrador        INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    id_livro                INT NOT NULL REFERENCES livro(id)   ON DELETE RESTRICT,
    status                  VARCHAR(15) NOT NULL,
    data_retirada           DATE NOT NULL,
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_real     DATE,
    CONSTRAINT ck_emprestimo_status CHECK (status IN ('ATIVO', 'DEVOLVIDO'))
);

CREATE TABLE reserva (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente    INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    id_livro      INT NOT NULL REFERENCES livro(id)   ON DELETE RESTRICT,
    data_reserva  DATE NOT NULL,
    status        VARCHAR(15) NOT NULL,
    posicao_fila  INT NOT NULL,
    CONSTRAINT ck_reserva_status CHECK (status IN ('ATIVA', 'CONFIRMADA', 'CANCELADA')),
    CONSTRAINT ck_reserva_posicao CHECK (posicao_fila >= 1)
);

CREATE TABLE notificacao (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente  INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    mensagem    VARCHAR(500) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL,
    data_envio  DATE NOT NULL,
    CONSTRAINT ck_notificacao_tipo CHECK (tipo IN ('VENCIMENTO', 'ATRASO', 'DISPONIBILIDADE'))
);