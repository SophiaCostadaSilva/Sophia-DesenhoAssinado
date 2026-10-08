// script.js
// Versao inicial: todo o trabalho acontece no navegador.
// A tarefa consiste em levar gerarDesenho para o servidor (Pages Functions)
// e fazer esta pagina apenas enviar o numero e exibir a resposta.

// script.js
// Envia o número e o token do Google para a API.
// O desenho é gerado no servidor pelo Cloudflare Pages Functions.

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const googleLogin = document.getElementById("google-login");

let idToken = "";
let svgAtual = "";

// Recebe o token depois que o usuário faz login com o Google.
function receberTokenGoogle(resposta) {
  idToken = resposta.credential;
  mensagem.textContent = "Login realizado com sucesso.";
  googleLogin.innerHTML =
    "<p>Você está conectado com sua conta Google.</p>";
}

// Inicializa o botão de login do Google.
function iniciarGoogle() {
  if (!window.google || !window.google.accounts) {
    mensagem.textContent =
      "Não foi possível carregar o login do Google.";
    return;
  }

  google.accounts.id.initialize({
    client_id: "COLOQUE_SEU_CLIENT_ID_AQUI",
    callback: receberTokenGoogle
  });

  google.accounts.id.renderButton(googleLogin, {
    theme: "outline",
    size: "large",
    text: "signin_with"
  });
}

window.addEventListener("load", iniciarGoogle);

// Envia o número e o token para a API do servidor.
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  mensagem.textContent = "";
  area.innerHTML = "";
  botaoBaixar.hidden = true;
  svgAtual = "";

  const numero = Number(campoNumero.value);

  if (!idToken) {
    mensagem.textContent =
      "Faça login com sua conta Google antes de gerar o desenho.";
    return;
  }

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ numero })
    });

    if (resposta.status === 400) {
      mensagem.textContent =
        "Erro 400: dados da requisição inválidos.";
      return;
    }

    if (resposta.status === 401) {
      mensagem.textContent =
        "Erro 401: autenticação inválida ou ausente.";
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent =
        `Erro ${resposta.status}: não foi possível gerar o desenho.`;
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
    mensagem.textContent = "Desenho gerado com sucesso.";
  } catch (erro) {
    console.error(erro);
    mensagem.textContent =
      "Não foi possível comunicar com o servidor.";
  }
});

// Baixa o SVG que foi recebido do servidor.
botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) {
    return;
  }

  const arquivo = new Blob([svgAtual], {
    type: "image/svg+xml"
  });

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "exemplo.svg";
  link.click();

  URL.revokeObjectURL(url);
});
```

