
const client = window.harmonizeSupabase;

const boasVindas = document.getElementById("boasVindas");
const papel = document.getElementById("papel");
const mensagem = document.getElementById("mensagem");
const erro = document.getElementById("erro");
const botaoSair = document.getElementById("sair");

function mostrarErro(titulo, detalhe) {
  boasVindas.textContent = titulo;
  mensagem.textContent = detalhe;
  erro.textContent = "Confira sua conexão e tente novamente.";
}

async function executarComLimite(promessa, tempo = 15000) {
  let temporizador;

  try {
    return await Promise.race([
      promessa,
      new Promise((_, rejeitar) => {
        temporizador = setTimeout(
          () => rejeitar(new Error("Tempo limite de conexão excedido.")),
          tempo
        );
      })
    ]);
  } finally {
    clearTimeout(temporizador);
  }
}

async function iniciarPainel() {
  try {
    boasVindas.textContent = "Conectando ao sistema...";
    mensagem.textContent = "Verificando seu acesso ao Harmonize+.";
    erro.textContent = "";

    if (!client) {
      throw new Error(
        "A conexão com o Supabase não foi inicializada. Confira os arquivos supabase.js e admin.html."
      );
    }

    const resultadoLogin = await executarComLimite(
      client.auth.getUser()
    );

    const user = resultadoLogin.data?.user;

    if (resultadoLogin.error) {
      throw resultadoLogin.error;
    }

    if (!user) {
      boasVindas.textContent = "Você não está conectado";
      mensagem.textContent = "Entre com seu e-mail e senha para acessar o painel.";
      erro.innerHTML = '<a href="login.html">Ir para a página de login</a>';
      return;
    }

    mensagem.textContent = "Consultando suas permissões...";

    const resultadoMembro = await executarComLimite(
      client
        .from("team_members")
        .select("display_name, role")
        .eq("user_id", user.id)
        .maybeSingle()
    );

    if (resultadoMembro.error) {
      throw resultadoMembro.error;
    }

    const membro = resultadoMembro.data;

    if (!membro) {
      mostrarErro(
        "Acesso não autorizado",
        "Seu usuário não foi encontrado na equipe do Harmonize+."
      );
      return;
    }

    const nomes = {
      admin: "Administradora",
      editor: "Editora",
      reviewer: "Revisora"
    };

    boasVindas.textContent = `Olá, ${membro.display_name}!`;
    papel.textContent = nomes[membro.role] || membro.role;
    mensagem.textContent =
      "Seu acesso foi confirmado. A conexão com o banco de dados está funcionando.";
    erro.textContent = "";

  } catch (problema) {
    console.error("Erro ao iniciar o painel:", problema);

    mostrarErro(
      "Não foi possível carregar o painel",
      problema.message || "Ocorreu um erro inesperado."
    );
  }
}

botaoSair.addEventListener("click", async () => {
  botaoSair.disabled = true;
  botaoSair.textContent = "Saindo...";

  try {
    if (client) {
      const { error: erroSaida } = await client.auth.signOut();

      if (erroSaida) {
        throw erroSaida;
      }
    }

    window.location.href = "login.html";

  } catch (problema) {
    console.error("Erro ao sair:", problema);
    erro.textContent = "Não foi possível encerrar a sessão. Tente novamente.";
    botaoSair.disabled = false;
    botaoSair.textContent = "Sair";
  }
});

iniciarPainel();
