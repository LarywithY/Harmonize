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

// ==========================================
// NOMES E IDENTIFICAÇÕES
// ==========================================

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

const nomesVerificacao = {
  pendente: "Pendente",
  em_verificacao: "Em verificação",
  aprovada: "Verificação aprovada",
  reprovada: "Verificação reprovada"
};

// ==========================================
// CAMPOS DE VERIFICAÇÃO ALIMENTAR
// ==========================================

const camposVerificacao = [
  {
    coluna: "ingredients_verified",
    texto: "Ingredientes conferidos"
  },
  {
    coluna: "allergens_verified",
    texto: "Alergênicos conferidos"
  },
  {
    coluna: "cross_contamination_assessed",
    texto: "Contaminação cruzada avaliada"
  },
  {
    coluna: "gluten_free_verified",
    texto: "Ausência de glúten verificada"
  },
  {
    coluna: "dairy_free_verified",
    texto: "Ausência de lactose verificada"
  },
  {
    coluna: "allergies_verified",
    texto: "Alergias alimentares verificadas"
  }
];

// ==========================================
// NOVOS CAMPOS SENSORIAIS
// ==========================================

const camposSensoriais = {

  sensory_profile: {
    titulo: "Perfil sensorial",

    explicacao:
      "Selecione os sabores predominantes da receita.",

    opcoes: [
      ["doce", "Doce"],
      ["salgado", "Salgado"],
      ["acido", "Ácido"],
      ["amargo", "Amargo"],
      ["picante", "Picante"],
      ["umami", "Umami"]
    ]
  },

  texture: {
    titulo: "Textura",

    explicacao:
      "Selecione as texturas presentes na receita.",

    opcoes: [
      ["cremosa", "Cremosa"],
      ["crocante", "Crocante"],
      ["suculenta", "Suculenta"],
      ["seca", "Seca"],
      ["aveludada", "Aveludada"],
      ["untuosa", "Untuosa"]
    ]
  },

  cooking_methods: {
    titulo: "Método de preparo",

    explicacao:
      "Informe como o prato é preparado.",

    opcoes: [
      ["frito_por_imersao", "Frito por imersão"],
      ["frito_na_frigideira", "Frito na frigideira"],
      ["grelhado", "Grelhado"],
      ["assado", "Assado"],
      ["cozido", "Cozido"],
      ["refogado", "Refogado"],
      ["cru", "Cru"],
      ["defumado", "Defumado"],
      ["tostado", "Tostado"]
    ]
  },

  preparation_features: {
    titulo: "Características adicionais",

    explicacao:
      "Selecione os ingredientes e características importantes do preparo.",

    opcoes: [
      ["manteiga", "Manteiga"],
      ["azeite", "Azeite"],
      ["oleo", "Óleo"],
      ["queijo", "Queijo"],
      ["creme_de_leite", "Creme de leite"],
      ["molho", "Molho"],
      ["reducao_de_molho", "Redução de molho"],
      ["temperos_picantes", "Temperos picantes"],
      ["ingredientes_citricos", "Ingredientes cítricos"],
      ["cobertura", "Cobertura"],
      ["empanamento", "Empanamento"]
    ]
  }

};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

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

// ==========================================
// CRIAÇÃO DOS CAMPOS SENSORIAIS
// ==========================================

function criarCamposSensoriais() {

  const secao = document.createElement("section");

  secao.className = "campos-sensoriais";

  const titulo = criarElemento(
    "h3",
    "Características sensoriais e preparo"
  );

  const explicacao = criarElemento(
    "p",
    "Informe as características da receita para melhorar as sugestões automáticas de harmonização."
  );

  secao.append(titulo, explicacao);

  // Criar grupos de seleção

  Object.entries(camposSensoriais).forEach(
    ([campo, configuracao]) => {

      const grupo = document.createElement("fieldset");

      grupo.className = "grupo-sensorial";

      const legenda = criarElemento(
        "legend",
        configuracao.titulo
      );

      const descricao = criarElemento(
        "p",
        configuracao.explicacao
      );

      grupo.append(legenda, descricao);

      configuracao.opcoes.forEach(([valor, texto]) => {

        const label = document.createElement("label");

        label.className = "opcao-sensorial";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.value = valor;

        checkbox.dataset.campoSensorial = campo;

        label.append(
          checkbox,
          document.createTextNode(" " + texto)
        );

        grupo.appendChild(label);

      });

      secao.appendChild(grupo);

    }
  );

  // Intensidade

  const grupoIntensidade = document.createElement("div");

  grupoIntensidade.className = "campo-sensorial";

  const labelIntensidade = criarElemento(
    "label",
    "Intensidade da receita"
  );

  labelIntensidade.htmlFor = "intensidadeSensorial";

  const seletor = document.createElement("select");

  seletor.id = "intensidadeSensorial";

  seletor.name = "intensity";

  const intensidades = [
    ["", "Selecione a intensidade"],
    ["leve", "Leve ou delicada"],
    ["moderada", "Moderada"],
    ["intensa", "Intensa"]
  ];

  intensidades.forEach(([valor, texto]) => {

    const opcao = document.createElement("option");

    opcao.value = valor;

    opcao.textContent = texto;

    seletor.appendChild(opcao);

  });

  grupoIntensidade.append(
    labelIntensidade,
    seletor
  );

  secao.appendChild(grupoIntensidade);

  // Observações

  const grupoObservacoes = document.createElement("div");

  grupoObservacoes.className = "campo-sensorial";

  const labelObservacoes = criarElemento(
    "label",
    "Observações sobre o preparo"
  );

  labelObservacoes.htmlFor = "observacoesPreparo";

  const observacoes = document.createElement("textarea");

  observacoes.id = "observacoesPreparo";

  observacoes.name = "preparation_notes";

  observacoes.rows = 3;

  observacoes.placeholder =
    "Ex.: o molho é reduzido até ficar mais concentrado; a carne é selada antes de assar.";

  grupoObservacoes.append(
    labelObservacoes,
    observacoes
  );

  secao.appendChild(grupoObservacoes);

  // Inserir campos antes do botão salvar

  botaoSalvar.insertAdjacentElement(
    "beforebegin",
    secao
  );

}

// ==========================================
// CAPTURAR OPÇÕES SENSORIAIS
// ==========================================

function obterOpcoesSensoriais(campo) {

  return Array.from(

    formReceita.querySelectorAll(
      `[data-campo-sensorial="${campo}"]:checked`
    )

  ).map(item => item.value);

}

// ==========================================
// PREENCHER OPÇÕES SENSORIAIS
// ==========================================

function preencherOpcoesSensoriais(campo, valores) {

  const selecionados = Array.isArray(valores)
    ? valores
    : [];

  formReceita.querySelectorAll(
    `[data-campo-sensorial="${campo}"]`
  ).forEach(item => {

    item.checked = selecionados.includes(item.value);

  });

}

// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormulario() {

  formReceita.reset();

  receitaEditando = null;

  document.getElementById("tituloFormulario").textContent =
    "Cadastrar receita";

  botaoSalvar.textContent = "Salvar receita";

  botaoCancelar.classList.add("oculto");

  mostrarMensagem(mensagemFormulario, "");

}

// ==========================================
// PREENCHER FORMULÁRIO PARA EDIÇÃO
// ==========================================

function preencherFormulario(receita) {

  receitaEditando = receita.id;

  document.getElementById("tituloFormulario").textContent =
    "Editar receita";

  document.getElementById("nome").value =
    receita.name || "";

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

  // Características sensoriais

  Object.keys(camposSensoriais).forEach(campo => {

    preencherOpcoesSensoriais(
      campo,
      receita[campo]
    );

  });

  document.getElementById("intensidadeSensorial").value =
    receita.intensity || "";

  document.getElementById("observacoesPreparo").value =
    receita.preparation_notes || "";

  // Ingredientes

  document.getElementById("ingredientes").value =
    Array.isArray(receita.ingredients)
      ? receita.ingredients.join("\n")
      : "";

  // Modo de preparo

  document.getElementById("preparo").value =
    Array.isArray(receita.steps)
      ? receita.steps.join("\n")
      : "";

  // Alergênicos

  document.getElementById("alergenicos").value =
    Array.isArray(receita.allergens)
      ? receita.allergens.join(", ")
      : "";

  // Restrições alimentares

  document.getElementById("restricoes").value =
    Array.isArray(receita.dietary_tags)
      ? receita.dietary_tags.join(", ")
      : "";

  // Carboidratos

  document.getElementById("carboidratos").value =
    receita.carbs_g ?? "";

  // Harmonização

  document.getElementById("bebida").value =
    receita.harmonization_drink || "";

  document.getElementById("semAlcool").value =
    receita.harmonization_non_alcoholic || "";

  // Status

  document.getElementById("statusReceita").value =
    ["draft", "review"].includes(receita.status)
      ? receita.status
      : "draft";

  botaoSalvar.textContent = "Atualizar receita";

  botaoCancelar.classList.remove("oculto");

  areaCadastro.scrollIntoView({
    behavior: "smooth"
  });

}

// ==========================================
// MONTAR DADOS DA RECEITA
// ==========================================

function montarDadosReceita() {

  const tempo = valor("tempo");

  const rendimento = valor("rendimento");

  const carboidratos = valor("carboidratos");

  return {

    name: valor("nome"),

    category: valor("categoria"),

    image_url: valor("imagem") || null,

    description: valor("descricao"),

    prep_minutes: tempo
      ? Number(tempo)
      : null,

    servings: rendimento
      ? Number(rendimento)
      : null,

    ingredients: dividirTexto(
      valor("ingredientes")
    ),

    steps: dividirTexto(
      valor("preparo")
    ),

    allergens: dividirLista(
      valor("alergenicos")
    ),

    dietary_tags: dividirLista(
      valor("restricoes")
    ),

    carbs_g: carboidratos
      ? Number(carboidratos)
      : null,

    harmonization_drink:
      valor("bebida") || null,

    harmonization_non_alcoholic:
      valor("semAlcool") || null,

    // NOVOS DADOS SENSORIAIS

    sensory_profile:
      obterOpcoesSensoriais("sensory_profile"),

    intensity:
      document.getElementById(
        "intensidadeSensorial"
      ).value || null,

    texture:
      obterOpcoesSensoriais("texture"),

    cooking_methods:
      obterOpcoesSensoriais("cooking_methods"),

    preparation_features:
      obterOpcoesSensoriais("preparation_features"),

    preparation_notes:
      document.getElementById(
        "observacoesPreparo"
      ).value.trim() || null

  };

}

// ==========================================
// VERIFICAÇÃO DE SEGURANÇA ALIMENTAR
// ==========================================

function criarPainelVerificacao(receita) {

  const painel = criarElemento(
    "section",
    undefined,
    "painel-verificacao"
  );

  const titulo = criarElemento(
    "h4",
    "Verificação de segurança alimentar"
  );

  const explicacao = criarElemento(
    "p",
    "Marque somente os critérios que foram efetivamente conferidos."
  );

  painel.append(titulo, explicacao);

  const statusAtual =
    receita.verification_status || "pendente";

  const textoStatus = criarElemento(
    "p",
    "Status atual: " +
      (nomesVerificacao[statusAtual] || statusAtual)
  );

  painel.appendChild(textoStatus);

  const controles = {};

  camposVerificacao.forEach(campo => {

    const linha = criarElemento(
      "label",
      undefined,
      "campo-verificacao"
    );

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked =
      receita[campo.coluna] === true;

    linha.appendChild(checkbox);

    linha.appendChild(
      document.createTextNode(" " + campo.texto)
    );

    controles[campo.coluna] = checkbox;

    painel.appendChild(linha);

  });

  const labelStatus = criarElemento(
    "label",
    "Status da verificação"
  );

  const seletor = document.createElement("select");

  [
    ["pendente", "Pendente"],
    ["em_verificacao", "Em verificação"],
    ["aprovada", "Verificação aprovada"],
    ["reprovada", "Verificação reprovada"]
  ].forEach(([valor, texto]) => {

    const opcao = document.createElement("option");

    opcao.value = valor;

    opcao.textContent = texto;

    seletor.appendChild(opcao);

  });

  seletor.value = nomesVerificacao[statusAtual]
    ? statusAtual
    : "pendente";

  labelStatus.appendChild(seletor);

  painel.appendChild(labelStatus);

  const botao = criarElemento(
    "button",
    "Salvar verificações",
    "botao-secundario"
  );

  botao.type = "button";

  botao.addEventListener("click", async () => {

    const dados = {};

    camposVerificacao.forEach(campo => {

      dados[campo.coluna] =
        controles[campo.coluna].checked;

    });

    const statusEscolhido = seletor.value;

    // Critérios obrigatórios para aprovação

    if (
      statusEscolhido === "aprovada" &&
      (
        !dados.ingredients_verified ||
        !dados.allergens_verified ||
        !dados.cross_contamination_assessed
      )
    ) {

      mostrarMensagem(
        mensagemLista,
        "Para aprovar a verificação, confira ingredientes, alergênicos e contaminação cruzada.",
        "erro"
      );

      return;

    }

    const confirmar = window.confirm(
      "Deseja salvar as verificações desta receita?"
    );

    if (!confirmar) return;

    botao.disabled = true;

    botao.textContent = "Salvando...";

    try {

      const {
        error: erroVerificacao
      } = await client.rpc(
        "update_recipe_verification",
        {

          p_recipe_id: receita.id,

          p_verification_status: statusEscolhido,

          p_ingredients_verified:
            dados.ingredients_verified,

          p_allergens_verified:
            dados.allergens_verified,

          p_cross_contamination_assessed:
            dados.cross_contamination_assessed,

          p_gluten_free_verified:
            dados.gluten_free_verified,

          p_dairy_free_verified:
            dados.dairy_free_verified,

          p_allergies_verified:
            dados.allergies_verified

        }
      );

      if (erroVerificacao) {
        throw erroVerificacao;
      }

      mostrarMensagem(
        mensagemLista,
        "Verificações alimentares salvas com sucesso!",
        "sucesso"
      );

      await carregarReceitas();

    } catch (problema) {

      console.error(
        "Erro ao salvar verificações:",
        problema
      );

      mostrarMensagem(
        mensagemLista,
        problema.message ||
          "Não foi possível salvar as verificações.",
        "erro"
      );

      botao.disabled = false;

      botao.textContent = "Salvar verificações";

    }

  });

  painel.appendChild(botao);

  return painel;

}

// ==========================================
// CARREGAMENTO DAS RECEITAS
// ==========================================

async function carregarReceitas() {

  listaReceitas.replaceChildren(
    criarElemento(
      "p",
      "Carregando receitas...",
      "status"
    )
  );

  mostrarMensagem(mensagemLista, "");

  try {

    const {
      data,
      error: erroBusca
    } = await client
      .from("recipes")
      .select("*")
      .order("updated_at", {
        ascending: false
      });

    if (erroBusca) {
      throw erroBusca;
    }

    listaReceitas.replaceChildren();

    const filtro = filtroStatus.value;

    const receitas = (data || []).filter(receita =>

      filtro === "todas" ||
      receita.status === filtro

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

      const card = criarElemento(
        "article",
        undefined,
        "receita"
      );

      const titulo = criarElemento(
        "h3",
        receita.name
      );

      const descricao = criarElemento(
        "p",
        receita.description || "Sem descrição."
      );

      const categoria = criarElemento(
        "p",
        "Categoria: " +
          (receita.category || "Não informada")
      );

      const status = criarElemento(
        "span",
        nomesStatus[receita.status] || receita.status,
        "status-receita"
      );

      card.append(
        titulo,
        descricao,
        categoria,
        status
      );

      const acoes = criarElemento(
        "div",
        undefined,
        "acoes"
      );

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

      // EDITAR

      if (podeEditar) {

        const editar = criarElemento(
          "button",
          "Editar",
          "botao-secundario"
        );

        editar.type = "button";

        editar.addEventListener("click", () => {

          preencherFormulario(receita);

        });

        acoes.appendChild(editar);

      }

      // APROVAR

      if (podeRevisar) {

        const aprovar = criarElemento(
          "button",
          "Aprovar"
        );

        aprovar.type = "button";

        aprovar.addEventListener("click", () => {

          revisarReceita(
            receita.id,
            "approved"
          );

        });

        // REJEITAR

        const rejeitar = criarElemento(
          "button",
          "Rejeitar",
          "botao-perigo"
        );

        rejeitar.type = "button";

        rejeitar.addEventListener("click", () => {

          revisarReceita(
            receita.id,
            "rejected"
          );

        });

        acoes.append(
          aprovar,
          rejeitar
        );

      }

      // PUBLICAR

      if (podePublicar) {

        const publicar = criarElemento(
          "button",
          "Publicar"
        );

        publicar.type = "button";

        publicar.addEventListener("click", () => {

          publicarReceita(receita.id);

        });

        acoes.appendChild(publicar);

      }

      if (acoes.children.length > 0) {

        card.appendChild(acoes);

      }

      // VERIFICAÇÃO ALIMENTAR

      if (
        ["admin", "reviewer"].includes(membroAtual.role)
      ) {

        card.appendChild(
          criarPainelVerificacao(receita)
        );

      }

      listaReceitas.appendChild(card);

    });

  } catch (problema) {

    console.error(
      "Erro ao carregar receitas:",
      problema
    );

    listaReceitas.replaceChildren(
      criarElemento(
        "p",
        problema.message ||
          "Não foi possível carregar as receitas.",
        "mensagem erro"
      )
    );

  }

}

// ==========================================
// CADASTRO E EDIÇÃO DE RECEITAS
// ==========================================

async function salvarReceita(event) {

  event.preventDefault();

  if (!formReceita.reportValidity()) {
    return;
  }

  const estavaEditando = Boolean(receitaEditando);

  botaoSalvar.disabled = true;

  botaoSalvar.textContent = "Salvando...";

  try {

    const dados = montarDadosReceita();

    const statusEscolhido = valor("statusReceita");

    // ATUALIZAR RECEITA

    if (estavaEditando) {

      const {
        error: erroAtualizacao
      } = await client
        .from("recipes")
        .update({

          ...dados,

          status: statusEscolhido

        })
        .eq("id", receitaEditando);

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

    }

    // CADASTRAR NOVA RECEITA

    else {

      const {
        error: erroInsercao
      } = await client
        .from("recipes")
        .insert({

          ...dados,

          status: statusEscolhido,

          created_by: usuarioAtual.id

        });

      if (erroInsercao) {
        throw erroInsercao;
      }

    }

    limparFormulario();

    mostrarMensagem(
      mensagemFormulario,

      estavaEditando
        ? "Receita atualizada com sucesso!"
        : "Receita cadastrada com sucesso!",

      "sucesso"
    );

    await carregarReceitas();

  } catch (problema) {

    console.error(
      "Erro ao salvar receita:",
      problema
    );

    mostrarMensagem(
      mensagemFormulario,

      problema.message ||
        "Não foi possível salvar a receita.",

      "erro"
    );

  } finally {

    botaoSalvar.disabled = false;

    botaoSalvar.textContent = receitaEditando
      ? "Atualizar receita"
      : "Salvar receita";

  }

}

// ==========================================
// REVISÃO EDITORIAL
// ==========================================

async function revisarReceita(id, decisao) {

  const confirmacao =
    decisao === "approved"
      ? "Deseja aprovar esta receita editorialmente?"
      : "Deseja rejeitar esta receita editorialmente?";

  if (!window.confirm(confirmacao)) {
    return;
  }

  try {

    const {
      error: erroRevisao
    } = await client.rpc(
      "review_recipe",
      {

        recipe_id: id,

        decision: decisao

      }
    );

    if (erroRevisao) {
      throw erroRevisao;
    }

    mostrarMensagem(
      mensagemLista,

      decisao === "approved"
        ? "Receita aprovada editorialmente!"
        : "Receita rejeitada.",

      "sucesso"
    );

    await carregarReceitas();

  } catch (problema) {

    console.error(
      "Erro na revisão:",
      problema
    );

    mostrarMensagem(
      mensagemLista,

      problema.message ||
        "Não foi possível revisar a receita.",

      "erro"
    );

  }

}

// ==========================================
// PUBLICAÇÃO
// ==========================================

async function publicarReceita(id) {

  if (membroAtual.role !== "admin") {
    return;
  }

  if (
    !window.confirm(
      "Deseja publicar esta receita no site?"
    )
  ) {
    return;
  }

  try {

    const {
      error: erroPublicacao
    } = await client
      .from("recipes")
      .update({
        status: "published"
      })
      .eq("id", id);

    if (erroPublicacao) {
      throw erroPublicacao;
    }

    mostrarMensagem(
      mensagemLista,
      "Receita publicada com sucesso!",
      "sucesso"
    );

    await carregarReceitas();

  } catch (problema) {

    console.error(
      "Erro ao publicar:",
      problema
    );

    mostrarMensagem(
      mensagemLista,

      problema.message ||
        "Não foi possível publicar a receita.",

      "erro"
    );

  }

}

// ==========================================
// INICIALIZAÇÃO DO PAINEL
// ==========================================

async function iniciarPainel() {

  try {

    boasVindas.textContent =
      "Conectando ao sistema...";

    mensagem.textContent =
      "Verificando seu acesso ao Harmonize+.";

    if (!client) {

      throw new Error(
        "A conexão com o Supabase não foi inicializada."
      );

    }

    // VERIFICAR LOGIN

    const {
      data: dadosLogin,
      error: erroLogin
    } = await client.auth.getUser();

    if (erroLogin) {
      throw erroLogin;
    }

    usuarioAtual = dadosLogin.user;

    if (!usuarioAtual) {

      boasVindas.textContent =
        "Você não está conectado";

      mensagem.textContent =
        "Entre com seu e-mail e senha para acessar.";

      erro.innerHTML =
        '<a href="login.html">Ir para o login</a>';

      return;

    }

    // VERIFICAR MEMBRO DA EQUIPE

    const {
      data: membro,
      error: erroMembro
    } = await client
      .from("team_members")
      .select("display_name, role")
      .eq("user_id", usuarioAtual.id)
      .maybeSingle();

    if (erroMembro) {
      throw erroMembro;
    }

    if (!membro) {

      boasVindas.textContent =
        "Acesso não autorizado";

      mensagem.textContent =
        "Seu usuário não foi encontrado na equipe do Harmonize+.";

      return;

    }

    membroAtual = membro;

    boasVindas.textContent =
      `Olá, ${membro.display_name}!`;

    papel.textContent =
      nomesPapeis[membro.role] || membro.role;

    mensagem.textContent =
      "Seu acesso foi confirmado. Bem-vindo ao painel administrativo.";

    areaReceitas.classList.remove("oculto");

    if (
      ["admin", "editor"].includes(membro.role)
    ) {

      areaCadastro.classList.remove("oculto");

    }

    if (membro.role === "reviewer") {

      filtroStatus.value = "review";

    }

    await carregarReceitas();

  } catch (problema) {

    console.error(
      "Erro ao iniciar painel:",
      problema
    );

    boasVindas.textContent =
      "Não foi possível carregar o painel";

    mensagem.textContent =
      problema.message ||
        "Ocorreu um erro inesperado.";

  }

}

// ==========================================
// EVENTOS
// ==========================================

formReceita.addEventListener(
  "submit",
  salvarReceita
);

botaoCancelar.addEventListener(
  "click",
  limparFormulario
);

filtroStatus.addEventListener(
  "change",
  carregarReceitas
);

// ==========================================
// SAIR DO SISTEMA
// ==========================================

botaoSair.addEventListener(
  "click",
  async () => {

    botaoSair.disabled = true;

    botaoSair.textContent = "Saindo...";

    try {

      const {
        error: erroSaida
      } = await client.auth.signOut();

      if (erroSaida) {
        throw erroSaida;
      }

      window.location.href = "login.html";

    } catch (problema) {

      console.error(
        "Erro ao sair:",
        problema
      );

      erro.textContent =
        "Não foi possível encerrar a sessão. Tente novamente.";

      botaoSair.disabled = false;

      botaoSair.textContent = "Sair";

    }

  }
);

// ==========================================
// INICIALIZAÇÃO FINAL
// ==========================================

// Criar os novos campos no formulário

criarCamposSensoriais();

// Iniciar painel administrativo

iniciarPainel();
