# Cineframe API 🍿

API de uma rede social de filmes no estilo Letterboxd: o usuário descobre filmes,
avalia, salva na watchlist e acompanha a atividade de outras pessoas.

> Este repositório contém o **back-end**. O front-end está em [Repo](https://github.com/MisaelJunior/APP-SERIES).

**Demo:** https://cineframe77.netlify.app (Em desenvolvimento)

## Funcionalidades

- Cadastro, login com e-mail/senha e login com Google
- Perfil de usuário com avatar e banner (upload no Cloudinary)
- Avaliações, curtidas, favoritos, assistidos e watchlist
- Seguidores e seguindo, feed de atividade dos amigos e sugestões de quem seguir
- Notificações (curtidas e novos seguidores) e e-mails transacionais via Brevo
- Busca de filmes e pessoas com autocomplete
- Dados de filmes via TMDB API, com cache para reduzir chamadas externas

## Tecnologias

NestJS, TypeScript, PostgreSQL, TypeORM (migrations), Cloudinary, Brevo,
@nestjs/throttler (rate limiting), @nestjs/schedule (cron), TMDB API.
Deploy: Render (API) e Neon (PostgreSQL).

## Como rodar localmente

1. Clone o repositório e instale as dependências:
   ```bash
   yarn install
   ```
2. Copie `.env.example` para `.env` e preencha as variáveis
   (banco, chave da TMDB, Cloudinary, Brevo, Google).
3. Rode as migrations:
   ```bash
   yarn migration:run
   ```
4. Inicie a aplicação:
   ```bash
   yarn start:dev
   ```

## Documentação da API

[Swagger](https://cineframe-kbwu.onrender.com/api#/)

## Autor

Carlos Henrique, [LinkedIn](https://www.linkedin.com/in/chsf/) | [E-mail](carlitossilva100@gmail.com)
