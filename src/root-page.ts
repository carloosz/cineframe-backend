export const ROOT_PAGE = `
   <!DOCTYPE html>
   <html lang="pt-BR">
   <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <meta name="color-scheme" content="dark" />
   <title>Cineframe API</title>
   <meta name="description" content="Registre filmes, escreva críticas e acompanhe o que seus amigos estão assistindo." />
   <meta property="og:type" content="website" />
   <meta property="og:site_name" content="Cineframe" />
   <meta property="og:title" content="Cineframe API" />
   <meta property="og:description" content="Seu diário cinematográfico: registre filmes, escreva críticas e veja o que seus amigos estão assistindo." />
   <meta property="og:url" content="https://cineframe-kbwu.onrender.com/" />
   <meta property="og:image" content="https://res.cloudinary.com/yvxdcsdz/image/upload/v1795466110/imagem_2026-11-23_173510554.png" />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   <meta property="og:image:alt" content="Logo do Cineframe" />
   <meta name="twitter:card" content="summary_large_image" />
   <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%238b5cf6'/%3E%3Cpath d='M11 9l12 7-12 7z' fill='white'/%3E%3C/svg%3E" />
   <style>
      :root {
         --bg: #0a0812;
         --surface: #15111f;
         --border: #2a2438;
         --text: #e5e0f0;
         --muted: #a89fc2;
         --faint: #6b6284;
         --purple: #8b5cf6;
         --purple-deep: #6d28d9;
         --purple-soft: #a78bfa;
         --ok: #34d399;
         color-scheme: dark;
      }

      * { box-sizing: border-box; }

      body {
         margin: 0;
         min-height: 100vh;
         display: grid;
         place-items: center;
         padding: 24px;
         background-color: var(--bg);
         background-image: radial-gradient(60rem 28rem at 50% -8%, rgba(139, 92, 246, 0.22), transparent 70%);
         color: var(--text);
         font-family: "Manrope", ui-sans-serif, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         line-height: 1.5;
      }

      main { width: 100%; max-width: 520px; }

      /* o quadro: a peça central, com marcas de enquadramento nos cantos */
      .frame {
         position: relative;
         padding: clamp(40px, 9vw, 64px) 24px;
         text-align: center;
         background: var(--surface);
         border: 1px solid var(--border);
         border-radius: 6px;
      }

      .corner {
         position: absolute;
         width: 22px;
         height: 22px;
         border: 0 solid var(--purple);
      }
      .tl { top: -1px; left: -1px; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 6px; }
      .tr { top: -1px; right: -1px; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 6px; }
      .bl { bottom: -1px; left: -1px; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 6px; }
      .br { bottom: -1px; right: -1px; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 6px; }

      .wordmark {
         margin: 0;
         font-size: clamp(2.75rem, 11vw, 4rem);
         font-weight: 800;
         letter-spacing: -0.03em;
         line-height: 1;
         color: #fff;
      }
      .wordmark span { color: var(--purple); }

      .status {
         display: inline-flex;
         align-items: center;
         gap: 8px;
         margin-top: 22px;
         padding: 6px 14px;
         font-size: 0.8125rem;
         color: var(--muted);
         background: rgba(52, 211, 153, 0.08);
         border: 1px solid rgba(52, 211, 153, 0.25);
         border-radius: 999px;
      }
      .dot {
         width: 8px;
         height: 8px;
         border-radius: 50%;
         background: var(--ok);
         animation: pulse 2.2s ease-out infinite;
      }
      @keyframes pulse {
         0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
         70%, 100% { box-shadow: 0 0 0 9px rgba(52, 211, 153, 0); }
      }

      .about {
         max-width: 38ch;
         margin: 28px auto 0;
         color: var(--muted);
         font-size: 0.9375rem;
      }

      .actions {
         display: flex;
         flex-wrap: wrap;
         justify-content: center;
         gap: 10px;
         margin-top: 24px;
      }

      .btn {
         display: inline-block;
         padding: 12px 22px;
         font: inherit;
         font-size: 0.875rem;
         font-weight: 700;
         text-decoration: none;
         border-radius: 10px;
         border: 1px solid var(--border);
         color: var(--text);
      }
      .btn:hover { border-color: var(--purple); }
      .btn-primary {
         color: #fff;
         border-color: transparent;
         background-color: #7c3aed;
         background-image: linear-gradient(135deg, var(--purple), var(--purple-deep));
      }
      .btn-primary:hover { border-color: transparent; filter: brightness(1.1); }

      .btn:focus-visible {
         outline: 2px solid var(--purple-soft);
         outline-offset: 3px;
      }

      @media (max-width: 420px) {
         .actions { flex-direction: column; }
         .btn { text-align: center; }
      }

      @media (prefers-reduced-motion: reduce) {
         .dot { animation: none; }
      }
   </style>
   </head>
   <body>
   <main>
      <div class="frame">
         <span class="corner tl"></span>
         <span class="corner tr"></span>
         <span class="corner bl"></span>
         <span class="corner br"></span>

         <h1 class="wordmark">cine<span>frame</span></h1>

         <p class="status"><span class="dot" aria-hidden="true"></span>API no ar</p>

         <p class="about">
         Este endereço é só o servidor do Cineframe. O app, com seus filmes e
         críticas, fica em outro lugar.
         </p>

         <div class="actions">
         <a class="btn btn-primary" href="https://cineframe77.netlify.app">Abrir o Cineframe</a>
         <a class="btn" href="/api">Documentação da API</a>
         <a class="btn" href="/health">Status do servidor</a>
         </div>
      </div>
   </main>
   </body>
   </html>
`;
