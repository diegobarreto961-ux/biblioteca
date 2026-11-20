# Página Aberta — Backend

Backend do sistema de gerenciamento de biblioteca **Página Aberta**, desenvolvido em Java e Spring Boot.

A aplicação contempla cadastro e autenticação de usuários, catálogo de livros, gerenciamento de empréstimos e devoluções, reservas e notificações.

**Projeto em desenvolvimento.** Última atualização: 20/11/2026.

## Tecnologias

- Java 21 (Temurin)
- Spring Boot com Maven
- Spring Web, Spring Data JPA, Spring Security e Validation
- PostgreSQL
- Flyway (versionamento das tabelas do banco)
- JWT (autenticação por token)
- Lombok

## Pré-requisitos

| Ferramenta | Para que serve |
|---|---|
| JDK 21 (Temurin) | Compilar e rodar o backend |
| PostgreSQL | Banco de dados |
| Git | Controle de versão |
| VS Code | Editor recomendado |
| Postman | Testar as requisições da API |
| pgAdmin ou psql (opcional) | Consultar o banco diretamente |

### Extensões recomendadas do VS Code

- Extension Pack for Java
- Spring Boot Extension Pack

Confira se o Java 21 está ativo:

```bash
java -version
```

## Passo a passo para rodar

### 1. Clonar o repositório

O repositório é privado. Peça acesso a quem administra o projeto e aceite o convite de colaborador que chega por e-mail.

```bash
git clone https://github.com/diegobarreto961-ux/biblioteca.git
cd biblioteca/biblioteca
```

O projeto Spring Boot fica na subpasta `biblioteca` dentro do repositório. Todos os comandos abaixo devem ser executados nessa pasta, onde estão o `pom.xml` e o `mvnw`.

### 2. Criar o banco de dados

Com o PostgreSQL rodando, crie o banco `biblioteca`.

Pelo psql:

```sql
CREATE DATABASE biblioteca;
```

Ou pelo pgAdmin: clique com o botão direito em Databases → Create → Database e use o nome `biblioteca`.

Não é preciso criar as tabelas manualmente. O Flyway realiza as migrations automaticamente na primeira execução.

### 3. Configurar o arquivo local de senhas

A senha do banco não fica no código. Ela fica em um arquivo local que não será enviado para o Git.

Copie o arquivo de exemplo:

**Linux / macOS**

```bash
cp local.properties.example local.properties
```

**Windows (Prompt de Comando)**

```cmd
copy local.properties.example local.properties
```

Abra o `local.properties`. O arquivo de exemplo contém:

```properties
spring.datasource.password=COLOQUE_A_SENHA_DO_SEU_POSTGRES
```

Troque `COLOQUE_A_SENHA_DO_SEU_POSTGRES` pela senha do seu PostgreSQL local, sem aspas e sem espaços.

Exemplo:

```properties
spring.datasource.password=minha_senha_aqui
```

Cada pessoa utiliza sua própria senha. Por isso, esse arquivo não é compartilhado.

**Nunca faça commit do `local.properties`.** Ele já está no `.gitignore`. Se o Git mostrar esse arquivo como alterado, pare e avise a equipe.

### 4. Subir a aplicação

Na pasta do projeto:

**Linux / macOS**

```bash
./mvnw spring-boot:run
```

**Windows**

```cmd
mvnw.cmd spring-boot:run
```

Ou pelo VS Code: abra a classe principal da aplicação e clique em Run.

Na primeira execução, a aplicação:

- Conecta ao banco `biblioteca`.
- Executa as migrations do Flyway.
- Cria e valida as tabelas.
- Inicializa o administrador padrão, conforme configuração.

Por padrão, o Spring Boot sobe em:

[http://localhost:8080](http://localhost:8080)

## Perfis de acesso

| Perfil | Permissões |
|---|---|
| Cliente | Cadastro, login e consulta ao catálogo |
| Administrador | Funcionalidades do cliente e acesso administrativo, incluindo gerenciamento de livros, clientes e empréstimos |

Um cliente que tentar acessar `/api/admin/**` recebe `403 Forbidden`.

## Autenticação e testes da API

Utilize o Postman para testar as requisições.

1. Faça o login com um usuário.
2. A resposta traz um token JWT.
3. Nas demais requisições protegidas, envie o token no cabeçalho:

```http
Authorization: Bearer <seu-token>
```

### Fluxo de teste sugerido

- Login do administrador
- Acesso de cliente à área admin (esperado: `403 Forbidden`)
- Cadastro, edição, exclusão e consulta de livros
- Busca por gênero, título e autor
- Cadastro de empréstimo
- Consulta de empréstimos
- Devolução de livros
- Verificação da atualização do estoque

## Funcionalidades do backend

### Autenticação e usuários

- Cadastro de clientes
- Login com JWT
- Senhas criptografadas
- Controle de acesso por perfil (Cliente e Administrador)

### Catálogo de livros

- Cadastro de livros
- Consulta de livros
- Edição e exclusão
- Busca por gênero
- Busca por título e autor
- Controle de quantidade total e disponível

### Empréstimos e devoluções

- Registro de empréstimos associados a cliente, livro e administrador
- Validação de cliente e administrador
- Verificação da disponibilidade de exemplares
- Controle de status do empréstimo (`ATIVO` e `DEVOLVIDO`)
- Registro de data de retirada e data prevista de devolução
- Registro da data real de devolução
- Atualização automática do estoque na retirada e devolução
- Listagem de todos os empréstimos
- Consulta de empréstimos por cliente
- Busca de empréstimo por ID

### Endpoints de empréstimos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/admin/emprestimos` | Registrar empréstimo |
| PUT | `/api/admin/emprestimos/{id}/devolucao` | Registrar devolução |
| GET | `/api/admin/emprestimos` | Listar todos os empréstimos |
| GET | `/api/admin/emprestimos/cliente/{idCliente}` | Listar empréstimos de um cliente |
| GET | `/api/admin/emprestimos/{id}` | Buscar empréstimo por ID |

Endpoints administrativos requerem autenticação e perfil de administrador.

## Estrutura do projeto

```text
biblioteca/src/main/java/br/com/codexa/biblioteca/
├── BibliotecaApplication.java
├── config/        # Segurança, JWT e configurações
├── controller/    # Endpoints da API
├── dto/          # Objetos de entrada e saída
├── exception/    # Tratamento de erros
├── model/        # Entidades JPA
├── repository/    # Acesso ao banco
└── service/       # Regras de negócio
```

As migrations do banco ficam em:

```text
biblioteca/src/main/resources/db/migration
```

## Trabalhando em equipe (Git)

- `main`: código integrado e revisado.
- Uma branch por funcionalidade, por exemplo `feature/emprestimo`.
- Alterações entram na `main` por Pull Request, revisado por outra pessoa.

Criar uma branch:

```bash
git checkout -b feature/nome-da-funcionalidade
```

Enviar alterações:

```bash
git add .
git commit -m "Descreve o que foi feito"
git push -u origin feature/nome-da-funcionalidade
```

## Cuidado com as migrations do Flyway

Duas pessoas criando a mesma versão (por exemplo, `V2__...sql`) em branches diferentes podem causar conflito.

Antes de criar uma migration nova:

1. Avise a equipe no grupo.
2. Atualize sua branch com a `main`.
3. Confira qual é a última versão de migration existente.
4. Nunca edite uma migration que já foi aplicada. Crie uma nova versão.

## Problemas comuns

**O VS Code mostra erros no servidor Java.**  
Aponte o JDK 21 nas configurações do VS Code (`java.jdt.ls.java.home`) e recarregue a janela.

**Erro de conexão ou `password authentication failed`.**  
Confira se o PostgreSQL está rodando, se o banco `biblioteca` existe e se a senha do `local.properties` está correta.

**Erro de validação das tabelas ao iniciar.**  
O banco pode ter sobras de testes antigos. Em ambiente local, apague e recrie o banco `biblioteca` e suba a aplicação novamente.

**`./mvnw: Permission denied` (Linux/macOS).**

```bash
chmod +x mvnw
```

Depois tente novamente.

## Roadmap

### Concluído
#Página Aberta - Backend
- Estrutura inicial do backend Spring Boot e organização dos pacotes
- Migration V1 com as tabelas iniciais
- Entidades e repositórios
- Cadastro de cliente com senha criptografada
- Login com JWT e perfis Cliente e Administrador
- CRUD de livros
- Busca de livros por gênero, título e autor
- Implementação do módulo de empréstimos
- Registro e devolução de livros
- Controle de disponibilidade e atualização de estoque
- Endpoints de consulta de empréstimos

### Em desenvolvimento / integração

- Reservas com fila de espera
- Gerenciamento de clientes pelo administrador
- Livros mais populares ou em destaque
- Identificação de atrasos e cálculo de taxas
- Notificações de devoluções pendentes e livros disponíveis
- Pagamentos (iniciando com simulação)
- Aluguel de livros para leitura dentro da biblioteca
- Testes finais, correções e validação com o cliente
- Testes de integração e validação completa dos endpoints
- Revisão e integração das funcionalidades desenvolvidas nas branches

### Próximas etapas

- Implementação das funcionalidades restantes
- Integração e validação geral do backend
- Definição das funcionalidades futuras junto à equipe

