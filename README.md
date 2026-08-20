# DigiTicket

Plataforma full-stack para publicação de eventos, venda de ingressos e validação de entrada na portaria.

> Status atual: Fase 5 — checkout e pagamento simulado implementados.

## Sobre

O DigiTicket será desenvolvido de forma incremental. A prioridade é entregar primeiro o fluxo principal completo:

```text
Organizador publica evento
        ↓
Cliente reserva e paga
        ↓
Ingresso é emitido
        ↓
Portaria valida a entrada
```

Este README acompanha a evolução do projeto. Uma funcionalidade só será apresentada como disponível depois de implementada e verificada.

## Incluído atualmente

- Frontend com React, Vite e TypeScript.
- React Router para organização das rotas.
- TanStack Query para comunicação e estado da API.
- React Hook Form e Zod preparados para os formulários.
- Tailwind CSS configurado.
- Backend com NestJS e TypeScript estrito.
- Prisma configurado para PostgreSQL/Supabase.
- Projeto Supabase provisionado em São Paulo (`sa-east-1`).
- Data API desativada e RLS automático habilitado para novas tabelas públicas.
- Swagger/OpenAPI disponível em `/api/docs`.
- Health check disponível em `/api/health`.
- Validação global das requisições no NestJS.
- Configuração inicial de CORS, Helmet e limite de requisições.
- Arquivos `.env.example` documentados.
- Arquivos `.env` locais protegidos pelo `.gitignore`.
- Testes iniciais do health check.
- Modelo `User` e enum de papéis `ORGANIZER`, `CUSTOMER` e `GATE`.
- Migration versionada para usuários e papéis.
- Seed idempotente com quatro usuários de demonstração.
- Cadastro público restrito ao papel `CUSTOMER`.
- Login com bcrypt e emissão de JWT.
- Guards globais de autenticação e autorização baseada em papéis.
- Endpoints `POST /auth/register`, `POST /auth/login` e `GET /auth/me`.
- Limite específico de tentativas nos endpoints de cadastro e login.
- Telas de cadastro e login no frontend.
- Sessão persistida no navegador, logout e rota de perfil protegida.
- Testes unitários e e2e para cadastro, login, JWT e acesso por papel.
- Modelo `Event` com categorias, modos de venda e estados de publicação.
- CRUD de eventos restrito ao organizador proprietário.
- Publicação, cancelamento e exclusão segura de rascunhos.
- Slugs legíveis e únicos para URLs públicas.
- Catálogo público com busca, categoria, cidade, data e ordenação cronológica.
- Página pública de detalhes do evento.
- Dashboard inicial do organizador com métricas e gestão de eventos.
- Seed com um evento publicado e um rascunho de demonstração.
- Tipos de ingresso por quantidade com preço inteiro em centavos.
- Gestão de capacidade e disponibilidade pelo organizador.
- Preço inicial exibido no catálogo público.
- Seleção de quantidades na página do evento.
- Reservas de ingressos com duração de 10 minutos.
- Cálculo do total exclusivamente no backend.
- Bloqueio atômico de estoque para impedir reservas acima da disponibilidade.
- Expiração lazy e cancelamento com devolução transacional ao estoque.
- Página protegida `Minhas reservas` com contagem regressiva.
- Constraints no PostgreSQL para impedir valores e estoques inválidos.
- Checkout protegido para reservas pendentes.
- Pagamento simulado com aprovação e recusa explícitas.
- Nenhum dado real de cartão solicitado ou armazenado.
- Valor do pagamento recalculado exclusivamente no backend.
- Aprovação transacional da reserva e criação de um ingresso-base por unidade.
- Recusa transacional com devolução imediata do estoque.
- Proteção contra duas confirmações simultâneas da mesma reserva.
- Histórico de pagamentos relacionado individualmente às reservas.

## Autenticação

| Método | Endpoint | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Cria exclusivamente uma conta `CUSTOMER`. |
| `POST` | `/api/auth/login` | Público | Valida as credenciais e emite um JWT. |
| `GET` | `/api/auth/me` | Bearer JWT | Retorna o usuário autenticado. |

Estas contas estão disponíveis no ambiente configurado:

| Papel | E-mail | Senha |
| --- | --- | --- |
| Organizador | `organizador@demo.com` | `Demo123!` |
| Cliente | `cliente1@demo.com` | `Demo123!` |
| Cliente | `cliente2@demo.com` | `Demo123!` |
| Portaria | `portaria@demo.com` | `Demo123!` |

## Eventos

Somente eventos com status `PUBLISHED` aparecem no catálogo. Eventos novos sempre nascem como `DRAFT`, e somente o organizador proprietário pode consultá-los ou alterá-los na área de gestão.

| Método | Endpoint | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/events` | Público | Lista eventos publicados com busca e filtros. |
| `GET` | `/api/events/:slug` | Público | Exibe os detalhes de um evento publicado. |
| `GET` | `/api/organizer/events` | Organizador | Lista exclusivamente os eventos próprios. |
| `POST` | `/api/organizer/events` | Organizador | Cria um evento em rascunho. |
| `PATCH` | `/api/organizer/events/:id` | Organizador proprietário | Edita um evento não cancelado. |
| `POST` | `/api/organizer/events/:id/publish` | Organizador proprietário | Publica um evento. |
| `POST` | `/api/organizer/events/:id/cancel` | Organizador proprietário | Cancela sem apagar o histórico. |
| `DELETE` | `/api/organizer/events/:id` | Organizador proprietário | Exclui somente um rascunho. |

O seed inclui `Festival Luzes da Cidade`, publicado no catálogo, e `Mostra de Cinema Brasileiro`, mantido como rascunho no dashboard do organizador.

O festival possui os tipos de ingresso `Pista` e `Pista Premium`. Um evento de entrada geral precisa ter pelo menos um tipo de ingresso antes de ser publicado. Eventos com assentos reservados serão liberados somente quando o mapa de assentos estiver implementado.

## Estoque e reservas

Preços são armazenados como inteiros em `priceCents`: `R$ 70,00`, por exemplo, é persistido como `7000`. A capacidade representa o estoque total e `availableQuantity` representa o que ainda pode ser reservado.

| Método | Endpoint | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/organizer/events/:eventId/ticket-types` | Organizador proprietário | Lista os tipos de ingresso do evento. |
| `POST` | `/api/organizer/events/:eventId/ticket-types` | Organizador proprietário | Cria um tipo e seu estoque inicial. |
| `PATCH` | `/api/organizer/events/:eventId/ticket-types/:id` | Organizador proprietário | Altera dados e capacidade sem invalidar reservas. |
| `DELETE` | `/api/organizer/events/:eventId/ticket-types/:id` | Organizador proprietário | Exclui um tipo sem histórico de reservas. |
| `POST` | `/api/reservations/events/:eventId` | Cliente | Reserva quantidades disponíveis por 10 minutos. |
| `GET` | `/api/reservations` | Cliente | Lista somente as próprias reservas. |
| `GET` | `/api/reservations/:id` | Cliente proprietário | Exibe uma reserva própria. |
| `POST` | `/api/reservations/:id/cancel` | Cliente proprietário | Cancela uma reserva pendente e libera o estoque. |

O estoque é reduzido dentro de uma transação com uma atualização condicional equivalente a:

```sql
UPDATE ticket_types
SET available_quantity = available_quantity - :quantity
WHERE id = :id
  AND available_quantity >= :quantity;
```

A reserva só é criada se todas as atualizações forem bem-sucedidas. Em caso de falha, a transação inteira é revertida. Itens são processados em uma ordem consistente para reduzir risco de deadlock. Constraints adicionais garantem no banco que a disponibilidade nunca seja negativa nem maior que a capacidade.

Reservas vencidas são processadas de forma lazy ao consultar catálogo e reservas ou ao iniciar uma nova reserva. A mudança de estado é condicional, portanto somente um processo consegue liberar cada reserva. Essa estratégia mantém o fluxo correto sem depender exclusivamente de um job em memória.

### Como testar a fase atual

1. Entre como organizador e abra `Gerenciar ingressos` no evento de entrada geral.
2. Crie ou edite um tipo de ingresso e confira preço, capacidade e disponibilidade.
3. Saia e entre como `cliente1@demo.com`.
4. Abra o `Festival Luzes da Cidade`, escolha quantidades e reserve.
5. Abra `Minhas reservas` e confira itens, total calculado e contagem regressiva.
6. Cancele a reserva e confirme que a quantidade retorna ao catálogo.
7. Para testar a expiração, deixe uma reserva vencer e atualize o catálogo ou a página de reservas após 10 minutos.

## Checkout e pagamento simulado

O checkout existe somente para demonstrar as regras da compra. Nenhuma cobrança financeira é realizada e a interface não possui campos de cartão. O cliente escolhe deliberadamente entre `APPROVED` e `DECLINED`.

| Método | Endpoint | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/payments/reservations/:reservationId/simulate` | Cliente proprietário | Simula aprovação ou recusa de uma reserva pendente. |

O frontend não envia preço nem total. Antes de processar, o backend:

1. verifica propriedade, estado e validade da reserva;
2. recalcula o total usando `unitPriceCents` e as quantidades persistidas;
3. altera a reserva por uma atualização condicional;
4. registra o pagamento;
5. cria um `Ticket` para cada unidade aprovada ou libera o estoque na recusa;
6. confirma todas as alterações em uma única transação.

Uma reserva aceita somente uma tentativa final de pagamento simulado. Isso deixa os estados previsíveis para a demonstração e impede aprovações duplicadas.

### Como testar o checkout

1. Entre como `cliente1@demo.com` e crie uma reserva no festival.
2. Abra `Minhas reservas` e clique em `Ir para pagamento`.
3. Escolha `Simular aprovação`.
4. Confirme que a reserva aparece como paga e informa a quantidade de ingressos emitidos.
5. Entre como `cliente2@demo.com` e crie outra reserva.
6. Escolha `Simular recusa`.
7. Confirme que nenhum ingresso foi criado e que o estoque foi devolvido.

Os registros-base dos ingressos já são criados na aprovação. QR Code, código manual, compartilhamento e páginas de visualização pertencem à próxima fase.

## Arquitetura atual

```mermaid
flowchart LR
    A[React + Vite] -->|REST| B[API NestJS]
    B --> C[Prisma ORM]
    C --> D[(PostgreSQL / Supabase)]
```

O frontend não acessará diretamente o banco. Regras críticas serão implementadas no backend e protegidas também por constraints e transações no PostgreSQL quando aplicável.

## Tecnologias

### Frontend

- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL / Supabase
- Swagger / OpenAPI

## Estrutura

```text
.
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── .env.example
├── backend/
│   ├── prisma/
│   ├── src/config/
│   ├── src/prisma/
│   └── .env.example
├── .gitignore
└── README.md
```

## Configuração local

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

### Variáveis de ambiente

Frontend:

```env
VITE_API_URL=http://localhost:3000
```

Backend:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
TICKET_SIGNING_SECRET=
TICKETMASTER_API_KEY=
```

Credenciais reais devem existir somente nos arquivos `.env`, que não são versionados.

## Configuração do Supabase

O ambiente atual usa um projeto em **South America (São Paulo)**, com Data API desativada e RLS automático habilitado. As migrations de autenticação, eventos, reservas e pagamentos, além do seed atual, já foram aplicadas.

Para configurar outro ambiente:

1. Crie ou abra um projeto no painel do Supabase e habilite RLS automático para novas tabelas públicas.
2. Use o botão **Connect** do projeto para consultar as connection strings.
3. Configure `DATABASE_URL` com a conexão usada pela API:
   - backend persistente com rede IPv6: conexão direta;
   - backend persistente em rede somente IPv4: **Session pooler**, porta `5432`;
   - backend serverless: **Transaction pooler**, porta `6543`.
4. Configure `DIRECT_URL` com a conexão direta, porta `5432`, para migrations. Caso sua rede não ofereça IPv6, utilize o Session pooler como alternativa.
5. Codifique caracteres especiais da senha na URL, por exemplo `@` como `%40`.
6. Aplique a migration versionada e execute o seed:

```powershell
cd backend
npm run prisma:migrate:deploy
npm run seed
```

O frontend continuará sem acessar o Supabase diretamente. Toda comunicação permanece no fluxo `Frontend → NestJS → Prisma → PostgreSQL`.

## Verificação

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend:

```powershell
cd backend
npm run prisma:validate
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Planejado

As próximas funcionalidades serão adicionadas e documentadas por fase:

1. Emissão de ingressos com QR Code assinado e compartilhamento.
2. Validação de ingressos na portaria e registro de tentativas.
3. Integração para pesquisa e importação de eventos externos.
4. Mapa simples de assentos reservados.
5. Testes adicionais, acessibilidade, responsividade e refinamentos de experiência.

## Limitações atuais

- Pagamentos são inteiramente simulados e não realizam cobrança financeira.
- Os ingressos-base são criados, mas QR Code, código manual, compartilhamento e páginas de visualização ainda não estão implementados.
- Eventos com `RESERVED_SEATING` ainda não podem ser publicados; o grid de assentos pertence a uma fase posterior.
- A expiração usa verificações lazy; um job periódico poderá ser adicionado como complemento em produção.
- O ambiente usa somente a API NestJS para acessar o banco; acesso direto pelo frontend e Data API não fazem parte da arquitetura atual.
