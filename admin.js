
const client = window.harmonizeSupabase;

const boasVindas = document.getElementById("boasVindas");
const papel = document.getElementById("papel");
const mensagem = document.getElementById("mensagem");
const erro = document.getElementById("erro");
const botaoSair = document.getElementById("sair");

const areaCadastro = document.getElementById("areaCadastro");
const areaReceitas = document.getElementById("areaReceitas");
const formReceita = document.getElementById("formReceita");
const listaReceitas = document.getElementById("listaReceitas");

const mensagemFormulario =
  document.getElementById("mensagemFormulario");

const mensagemLista =
  document.getElementById("mensagemLista");

const filtroStatus = document.getElementById("filtroStatus");
const botaoSalvar = document.getElementById("salvarReceita");
const botaoCancelar = document.getElementById("cancelarEdicao");

let usuarioAtual = null;
let membroAtual = null;
let receitaEditando = null;

const nomesPapeis = {
  admin: "Administradora",
  editor: "Editora",
  reviewer: "Revisora"
};

const nomesStatus = {
  draft: "Rascunho",
  review: "Em revisão",
  approved: "Aprovada",
  published: "Publicada",
  rejected: "Rejeitada"
};

function mostrarMensagem(elemento, texto, tipo = "") {
  elemento.textContent = texto;
  elemento.className = "mensagem " + tipo;
}

function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  if (classe) {
    elemento.className = classe;
  }

  return elemento;
}

function dividirTexto(texto) {
  return texto
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

function dividirLista(texto) {
  return texto
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function valor(id) {
  return document.getElementById(id).value.trim();
}

function limparFormulario() {
  formReceita.reset();
  receitaEditando = null;

  document.getElementById("tituloFormulario").textContent =
    "Cadastrar receita";

  botaoSalvar.textContent = "Salvar receita";
  botaoCancelar.classList.add("oculto");

  mostrarMensagem(mensagemFormulario, "");
}

function preencherFormulario(receita) {
  receitaEditando = receita.id;

  document.getElementById("tituloFormulario").textContent =
    "Editar receita";

  document.getElementById("nome").value = receita.name || "";
  document.getElementById("categoria").value =
    receita.category || "";

  document.getElementById("imagem").value =
    receita.image_url || "";

  document.getElementById("tempo").value =
    receita.prep_minutes ?? "";

  document.getElementById("rendimento").value =
    receita.servings ?? "";

  document.getElementById("descricao").value =
    receita.description || "";

  document.getElementById("ingredientes").value =
    Array.isArray(receita.ingredients)
      ? receita.ingredients.join("\n")
      : "";

  document.getElementById("preparo").value =
    Array.isArray(receita.steps)
      ? receita.steps.join("\n")
      : "";

  document.getElementById("alergenicos").value =
    Array.isArray(receita.allergens)
      ? receita.allergens.join(", ")
      : "";

  document.getElementById("restricoes").value =
    Array.isArray(receita.dietary_tags)
      ? receita.dietary_tags.join(", ")
      : "";

  document.getElementById("carboidratos").value =
    receita.carbs_g ?? "";

  document.getElementById("bebida").value =
    receita.harmonization_drink || "";

  document.getElementById("semAlcool").value =
    receita.harmonization_non_alcoholic || "";

  document.getElementById("statusReceita").value =
    ["draft", "review"].includes(receita.status)
      ? receita.status
      : "draft";

  botaoSalvar.textContent = "Atualizar receita";
  botaoCancelar.classList.remove("oculto");

  areaCadastro.scrollIntoView({ behavior: "smooth" });
}

function montarDadosReceita() {
  const tempo = valor("tempo");
  const rendimento = valor("rendimento");
  const carboidratos = valor("carboidratos");

  return {
    name: valor("nome"),
    category: valor("categoria"),
    image_url: valor("imagem") || null,
    description: valor("descricao"),

    prep_minutes: tempo ? Number(tempo) : null,
    servings: rendimento ? Number(rendimento) : null,

    ingredients: dividirTexto(valor("ingredientes")),
    steps: dividirTexto(valor("preparo")),

    allergens: dividirLista(valor("alergenicos")),
    dietary_tags: dividirLista(valor("restricoes")),

    carbs_g: carboidratos ? Number(carboidratos) : null,

    harmonization_drink: valor("bebida") || null,
    harmonization_non_alcoholic: valor("semAlcool") || null
  };
}

async function carregarReceitas() {
  listaReceitas.replaceChildren(
    criarElemento("p", "Carregando receitas...", "status")
  );

  mostrarMensagem(mensagemLista, "");

  try {
    const { data, error: erroBusca } = await client
      .from("recipes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (erroBusca) throw erroBusca;

    listaReceitas.replaceChildren();

    const filtro = filtroStatus.value;

    const receitas = (data || []).filter(receita =>
      filtro === "todas" || receita.status === filtro
    );

    if (receitas.length === 0) {
      listaReceitas.appendChild(
        criarElemento(
          "p",
          "Nenhuma receita encontrada nesta categoria.",
          "status"
        )
      );

      return;
    }

    receitas.forEach(receita => {
      const card = criarElemento("article", undefined, "receita");

      const titulo = criarElemento("h3", receita.name);
      const descricao = criarElemento(
        "p",
        receita.description || "Sem descrição."
      );

      const categoria = criarElemento(
        "p",
        "Categoria: " + (receita.category || "Não informada")
      );

      const status = criarElemento(
        "span",
        nomesStatus[receita.status] || receita.status,
        "status-receita"
      );

      card.append(titulo, descricao, categoria, status);

      const acoes = criarElemento("div", undefined, "acoes");

      const podeEditar =
        membroAtual.role === "admin" ||
        (
          membroAtual.role === "editor" &&
          ["draft", "review"].includes(receita.status)
        );

      const podeRevisar =
        ["admin", "reviewer"].includes(membroAtual.role) &&
        receita.status === "review";

      const podePublicar =
        membroAtual.role === "admin" &&
        receita.status === "approved";

      if (podeEditar) {
        const editar = criarElemento(
          "button",
          "Editar",
          "botao-secundario"
        );

        editar.type = "button";
        editar.addEventListener("click", () =>
          preencherFormulario(receita)
        );

        acoes.appendChild(editar);
      }

      if (podeRevisar) {
        const aprovar = criarElemento("button", "Aprovar");
        aprovar.type = "button";
        aprovar.addEventListener("click", () =>
          revisarReceita(receita.id, "approved")
        );

        const rejeitar = criarElemento(
          "button",
          "Rejeitar",
          "botao-perigo"
        );

        rejeitar.type = "button";
        rejeitar.addEventListener("click", () =>
          revisarReceita(receita.id, "rejected")
        );

        acoes.append(aprovar, rejeitar);
      }

      if (podePublicar) {
        const publicar = criarElemento("button", "Publicar");

        publicar.type = "button";
        publicar.addEventListener("click", () =>
          publicarReceita(receita.id)
        );

        acoes.appendChild(publicar);
      }

      if (acoes.children.length > 0) {
        card.appendChild(acoes);
      }

      listaReceitas.appendChild(card);
    });

  } catch (problema) {
    console.error("Erro ao carregar receitas:", problema);

    listaReceitas.replaceChildren(
      criarElemento(
        "p",
        problema.message || "Não foi possível carregar as receitas.",
        "mensagem erro"
      )
    );
  }
}

async function salvarReceita(event) {
  event.preventDefault();

  if (!formReceita.reportValidity()) return;

  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";

  try {
    const dados = montarDadosReceita();
    const statusEscolhido = valor("statusReceita");

    if (receitaEditando) {
      const { error: erroAtualizacao } = await client
        .from("recipes")
        .update({
          ...dados,
          status: statusEscolhido
        })
        .eq("id", receitaEditando);

      if (erroAtualizacao) throw erroAtualizacao;

      mostrarMensagem(
        mensagemFormulario,
        "Receita atualizada com sucesso!",
        "sucesso"
      );

    } else {
      const { error: erroInsercao } = await client
        .from("recipes")
        .insert({
          ...dados,
          status: statusEscolhido,
          created_by: usuarioAtual.id
        });

      if (erroInsercao) throw erroInsercao;

      mostrarMensagem(
        mensagemFormulario,
        "Receita cadastrada com sucesso!",
        "sucesso"
      );
    }

    limparFormulario();
    await carregarReceitas();

  } catch (problema) {
    console.error("Erro ao salvar receita:", problema);

    mostrarMensagem(
      mensagemFormulario,
      problema.message || "Não foi possível salvar a receita.",
      "erro"
    );

  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = receitaEditando
      ? "Atualizar receita"
      : "Salvar receita";
  }
}

async function revisarReceita(id, decisao) {
  const confirmacao = decisao === "approved"
    ? "Deseja aprovar esta receita?"
    : "Deseja rejeitar esta receita?";

  if (!window.confirm(confirmacao)) return;

  try {
    const { error: erroRevisao } = await client.rpc(
      "review_recipe",
      {
        recipe_id: id,
        decision: decisao
      }
    );

    if (erroRevisao) throw erroRevisao;

    mostrarMensagem(
      mensagemLista,
      decisao === "approved"
        ? "Receita aprovada com sucesso!"
        : "Receita rejeitada.",
      "sucesso"
    );

    await carregarReceitas();

  } catch (problema) {
    console.error("Erro na revisão:", problema);

    mostrarMensagem(
      mensagemLista,
      problema.message || "Não foi possível revisar a receita.",
      "erro"
    );
  }
}

async function publicarReceita(id) {
  if (membroAtual.role !== "admin") return;

  if (!window.confirm("Deseja publicar esta receita no site?")) {
    return;
  }

  try {
    const { error: erroPublicacao } = await client
      .from("recipes")
      .update({ status: "published" })
      .eq("id", id);

    if (erroPublicacao) throw erroPublicacao;

    mostrarMensagem(
      mensagemLista,
      "Receita publicada com sucesso!",
      "sucesso"
    );

    await carregarReceitas();

  } catch (problema) {
    console.error("Erro ao publicar:", problema);

    mostrarMensagem(
      mensagemLista,
      problema.message || "Não foi possível publicar a receita.",
      "erro"
    );
  }
}

async function iniciarPainel() {
  try {
    boasVindas.textContent = "Conectando ao sistema...";
    mensagem.textContent = "Verificando seu acesso ao Harmonize+.";

    if (!client) {
      throw new Error("A conexão com o Supabase não foi inicializada.");
    }

    const { data: dadosLogin, error: erroLogin } =
      await client.auth.getUser();

    if (erroLogin) throw erroLogin;

    usuarioAtual = dadosLogin.user;

    if (!usuarioAtual) {
      boasVindas.textContent = "Você não está conectado";
      mensagem.textContent = "Entre com seu e-mail e senha para acessar.";
      erro.innerHTML = '<a href="login.html">Ir para o login</a>';
      return;
    }

    const { data: membro, error: erroMembro } = await client
      .from("team_members")
      .select("display_name, role")
      .eq("user_id", usuarioAtual.id)
      .maybeSingle();

    if (erroMembro) throw erroMembro;

    if (!membro) {
      boasVindas.textContent = "Acesso não autorizado";
      mensagem.textContent =
        "Seu usuário não foi encontrado na equipe do Harmonize+.";
      return;
    }

    membroAtual = membro;

    boasVindas.textContent = `Olá, ${membro.display_name}!`;
    papel.textContent = nomesPapeis[membro.role] || membro.role;

    mensagem.textContent =
      "Seu acesso foi confirmado. Bem-vindo ao painel administrativo.";

    areaReceitas.classList.remove("oculto");

    if (["admin", "editor"].includes(membro.role)) {
      areaCadastro.classList.remove("oculto");
    }

    if (membro.role === "reviewer") {
      filtroStatus.value = "review";
    }

    await carregarReceitas();

  } catch (problema) {
    console.error("Erro ao iniciar painel:", problema);

    boasVindas.textContent = "Não foi possível carregar o painel";
    mensagem.textContent =
      problema.message || "Ocorreu um erro inesperado.";
  }
}

formReceita.addEventListener("submit", salvarReceita);

botaoCancelar.addEventListener("click", limparFormulario);

filtroStatus.addEventListener("change", carregarReceitas);

botaoSair.addEventListener("click", async () => {
  botaoSair.disabled = true;
  botaoSair.textContent = "Saindo...";

  try {
    const { error: erroSaida } = await client.auth.signOut();

    if (erroSaida) throw erroSaida;

    window.location.href = "login.html";

  } catch (problema) {
    console.error("Erro ao sair:", problema);

    erro.textContent =
      "Não foi possível encerrar a sessão. Tente novamente.";

    botaoSair.disabled = false;
    botaoSair.textContent = "Sair";
  }
});

iniciarPainel();
