import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Verifica o método HTTP
  if (request.method !== "POST") {
    return new Response("Método não permitido.", {
      status: 405,
    });
  }

  // 2. Verifica o corpo da requisição
  const texto = await request.text();

  if (!texto.trim()) {
    return new Response("Corpo da requisição ausente.", {
      status: 400,
    });
  }

  let dados;

  try {
    dados = JSON.parse(texto);
  } catch {
    return new Response("JSON inválido.", {
      status: 400,
    });
  }

  // 3. Verifica o número
  if (
    !dados ||
    !Object.prototype.hasOwnProperty.call(dados, "numero") ||
    !numeroValido(dados.numero)
  ) {
    return new Response("Número inválido.", {
      status: 400,
    });
  }

  // 4. Verifica o cabeçalho Authorization
  const authorization = request.headers.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return new Response("Token ausente ou inválido.", {
      status: 401,
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return new Response("Token ausente ou inválido.", {
      status: 401,
    });
  }

  // 5. Valida o token no Google
  let respostaGoogle;

  try {
    respostaGoogle = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );
  } catch {
    return new Response("Token inválido.", {
      status: 401,
    });
  }

  if (!respostaGoogle.ok) {
    return new Response("Token inválido.", {
      status: 401,
    });
  }

  let informacoesToken;

  try {
    informacoesToken = await respostaGoogle.json();
  } catch {
    return new Response("Token inválido.", {
      status: 401,
    });
  }

  // 6. Confere o Client ID
  if (informacoesToken.aud !== env.GOOGLE_CLIENT_ID) {
    return new Response("Token inválido.", {
      status: 401,
    });
  }

  // 7. Confere se o e-mail foi verificado pelo Google
  if (informacoesToken.email_verified !== "true") {
    return new Response("E-mail não verificado.", {
      status: 401,
    });
  }

  // 8. Obtém o e-mail diretamente do token
  const email = informacoesToken.email;

  // 9. Gera o desenho no servidor
  const svg = gerarDesenho(dados.numero, email);

  // 10. Retorna o SVG
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}