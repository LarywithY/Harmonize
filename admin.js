
const client = window.harmonizeSupabase;

// ==========================================
// ELEMENTOS PRINCIPAIS
// ==========================================

const boasVindas = document.getElementById("boasVindas");
const papel = document.getElementById("papel");
const mensagem = document.getElementById("mensagem");
const erro = document.getElementById("erro");
const botaoSair = document.getElementById("sair");

const areaCadastro = document.getElementById("areaCadastro");
const areaReceitas = document.getElementById("areaReceitas");
const formReceita = document.getElementById("formReceita");
const listaReceitas = document.getElementById("listaReceitas");

const mensagemFormulario = document.getElementById("mensagemFormulario");
const mensagemLista = document.getElementById("mensagemLista");

const filtroStatus = document.getElementById("filtroStatus");
const botaoSalvar = document.getElementById("salvarReceita");
const botaoCancelar = document.getElementById("cancelarEdicao");

// Restaurantes
const areaRestaurantes = document.getElementById("areaRestaurantes");
const formRestaurante = document.getElementById("formRestaurante");
const listaRestaurantes = document.getElementById("listaRestaurantes");
const mensagemRestaurante = document.getElementById("mensagemRestaurante");
const mensagemListaRestaurantes = document.getElementById("mensagemListaRestaurantes");
const filtroStatusRestaurante = document.getElementById("filtroStatusRestaurante");
const botaoSalvarRestaurante = document.getElementById("salvarRestaurante");
const botaoCancelarRestaurante = document.getElementById("cancelarRestaurante");

// Pratos
const areaPratos = document.getElementById("areaPratos");
const formPrato = document.getElementById("formPrato");
const listaPratos = document.getElementById("listaPratos");
const mensagemPrato = document.getElementById("mensagemPrato");
const botaoSalvarPrato = document.getElementById("salvarPrato");

// ==========================================
// ESTADOS DO SISTEMA
// ==========================================

let usuarioAtual = null;
let membroAtual = null;
let receitaEditando = null;

let restauranteEditando = null;
let restauranteSelecionado = null;

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

const nomesStatusRestaurante = {
  draft: "Rascunho",
  published: "Publicado"
};

const nomesVerificacaoRestaurante = {
  pending: "Pendente",
  verified: "Verificado",
  not_verified: "Não verificado"
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
// CAMPOS SENSORIAIS
// ==========================================

const camposSensoriais = {
  sensory_profile: {
    titulo: "Perfil sensorial",
    explicacao: "Selecione os sabores predominantes da receita.",
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
    explicacao: "Selecione as texturas presentes na receita.",
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
    explicacao: "Informe como o prato é preparado.",
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
    explicacao: "Selecione os ingredientes e características importantes do preparo.",
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
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.className = "mensagem " + tipo;
}

function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);

  if (texto !== undefined && texto !== null) {
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
  const elemento = document.getElementById(id);
  return elemento ? elemento.value.trim() : "";
}

function definirValor(id, conteudo) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.value = conteudo ?? "";
  }
}

function formatarLista(lista) {
  return Array.isArray(lista) && lista.length
    ? lista.join(", ")
    : "Não informado";
}

function criarBotao(texto, classe, acao) {
  const botao = criarElemento("button", texto, classe);

  botao.type = "button";
  botao.addEventListener("click", acao);

  return botao;
}

// ==========================================
// CRIAÇÃO DOS CAMPOS SENSORIAIS
// ==========================================

function criarCamposSensoriais() {
  if (document.getElementById("secaoCamposSensoriais")) {
    return;
  }

  const grade = formReceita.querySelector(".grade");

  if (!grade) {
    console.error("Não foi encontrada a área .grade no formulário.");
    return;
  }

  const secao = document.createElement("section");

  secao.id = "secaoCamposSensoriais";
  secao.className = "campos-sensoriais";

  secao.append(
    criarElemento("h3", "Características sensoriais e preparo"),
    criarElemento(
      "p",
      "Informe as características da receita para melhorar as sugestões automáticas de harmonização."
    )
  );

  Object.entries(camposSensoriais).forEach(([campo, configuracao]) => {
    const grupo = document.createElement("fieldset");
    grupo.className = "grupo-sensorial";

    grupo.append(
      criarElemento("legend", configuracao.titulo),
      criarElemento("p", configuracao.explicacao)
    );

    configuracao.opcoes.forEach(([valorOpcao, texto]) => {
      const label = document.createElement("label");
      label.className = "opcao-sensorial";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = valorOpcao;
      checkbox.dataset.campoSensorial = campo;

      label.append(
        checkbox,
        document.createTextNode(" " + texto)
      );

      grupo.appendChild(label);
    });

    secao.appendChild(grupo);
  });

  const grupoIntensidade = document.createElement("div");
  grupoIntensidade.className = "campo-sensorial";

  const labelIntensidade = criarElemento("label", "Intensidade da receita");
  labelIntensidade.htmlFor = "intensidadeSensorial";

  const seletor = document.createElement("select");
  seletor.id = "intensidadeSensorial";
  seletor.name = "intensity";

  [
    ["", "Selecione a intensidade"],
    ["leve", "Leve ou delicada"],
    ["moderada", "Moderada"],
    ["intensa", "Intensa"]
  ].forEach(([valorOpcao, texto]) => {
    const opcao = document.createElement("option");
    opcao.value = valorOpcao;
    opcao.textContent = texto;
    seletor.appendChild(opcao);
  });

  grupoIntensidade.append(labelIntensidade, seletor);
  secao.appendChild(grupoIntensidade);

  const grupoObservacoes = document.createElement("div");
  grupoObservacoes.className = "campo-sensorial";

  const labelObservacoes = criarElemento("label", "Observações sobre o preparo");
  labelObservacoes.htmlFor = "observacoesPreparo";

  const observacoes = document.createElement("textarea");
  observacoes.id = "observacoesPreparo";
  observacoes.name = "preparation_notes";
  observacoes.rows = 3;
  observacoes.placeholder =
    "Ex.: o molho é reduzido até ficar mais concentrado; a carne é selada antes de assar.";

  grupoObservacoes.append(labelObservacoes, observacoes);
  secao.appendChild(grupoObservacoes);

  grade.insertAdjacentElement("afterend", secao);
}

// ==========================================
// OPÇÕES SENSORIAIS
// ==========================================

function obterOpcoesSensoriais(campo) {
  return Array.from(
    formReceita.querySelectorAll(
      `[data-campo-sensorial="${campo}"]:checked`
    )
  ).map(item => item.value);
}

function preencherOpcoesSensoriais(campo, valores) {
  const selecionados = Array.isArray(valores) ? valores : [];

  formReceita.querySelectorAll(
    `[data-campo-sensorial="${campo}"]`
  ).forEach(item => {
    item.checked = selecionados.includes(item.value);
  });
}

// ==========================================
// LIMPAR FORMULÁRIO DE RECEITAS
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
// PREENCHER FORMULÁRIO DE RECEITAS
// ==========================================

function preencherFormulario(receita) {
  receitaEditando = receita.id;

  document.getElementById("tituloFormulario").textContent =
    "Editar receita";

  definirValor("nome", receita.name);
  definirValor("categoria", receita.category);
  definirValor("imagem", receita.image_url);
  definirValor("tempo", receita.prep_minutes);
  definirValor("rendimento", receita.servings);
  definirValor("descricao", receita.description);

  Object.keys(camposSensoriais).forEach(campo => {
    preencherOpcoesSensoriais(campo, receita[campo]);
  });

  definirValor("intensidadeSensorial", receita.intensity);
  definirValor("observacoesPreparo", receita.preparation_notes);

  definirValor(
    "ingredientes",
    Array.isArray(receita.ingredients)
      ? receita.ingredients.join("\n")
      : ""
  );

  definirValor(
    "preparo",
    Array.isArray(receita.steps)
      ? receita.steps.join("\n")
      : ""
  );

  definirValor(
    "alergenicos",
    Array.isArray(receita.allergens)
      ? receita.allergens.join(", ")
      : ""
  );

  definirValor(
    "restricoes",
    Array.isArray(receita.dietary_tags)
      ? receita.dietary_tags.join(", ")
      : ""
  );

  definirValor("carboidratos", receita.carbs_g);
  definirValor("bebida", receita.harmonization_drink);
  definirValor("semAlcool", receita.harmonization_non_alcoholic);

  definirValor(
    "statusReceita",
    ["draft", "review"].includes(receita.status)
      ? receita.status
      : "draft"
  );

  botaoSalvar.textContent = "Atualizar receita";
  botaoCancelar.classList.remove("oculto");

  areaCadastro.scrollIntoView({ behavior: "smooth" });
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

    prep_minutes: tempo ? Number(tempo) : null,
    servings: rendimento ? Number(rendimento) : null,

    ingredients: dividirTexto(valor("ingredientes")),
    steps: dividirTexto(valor("preparo")),
    allergens: dividirLista(valor("alergenicos")),
    dietary_tags: dividirLista(valor("restricoes")),

    carbs_g: carboidratos ? Number(carboidratos) : null,

    harmonization_drink: valor("bebida") || null,
    harmonization_non_alcoholic: valor("semAlcool") || null,

    sensory_profile: obterOpcoesSensoriais("sensory_profile"),
    intensity: valor("intensidadeSensorial") || null,
    texture: obterOpcoesSensoriais("texture"),
    cooking_methods: obterOpcoesSensoriais("cooking_methods"),
    preparation_features: obterOpcoesSensoriais("preparation_features"),
    preparation_notes: valor("observacoesPreparo") || null
  };
}

// ==========================================
// VERIFICAÇÃO DE SEGURANÇA ALIMENTAR
// ==========================================

function criarPainelVerificacao(receita) {
  const painel = criarElemento("section", undefined, "painel-verificacao");

  painel.append(
    criarElemento("h4", "Verificação de segurança alimentar"),
    criarElemento(
      "p",
      "Marque somente os critérios que foram efetivamente conferidos."
    )
  );

  const statusAtual = receita.verification_status || "pendente";

  painel.appendChild(
    criarElemento(
      "p",
      "Status atual: " +
        (nomesVerificacao[statusAtual] || statusAtual)
    )
  );

  const controles = {};

  camposVerificacao.forEach(campo => {
    const linha = criarElemento("label", undefined, "campo-verificacao");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = receita[campo.coluna] === true;

    linha.append(
      checkbox,
      document.createTextNode(" " + campo.texto)
    );

    controles[campo.coluna] = checkbox;
    painel.appendChild(linha);
  });

  const labelStatus = criarElemento("label", "Status da verificação");
  const seletor = document.createElement("select");

  [
    ["pendente", "Pendente"],
    ["em_verificacao", "Em verificação"],
    ["aprovada", "Verificação aprovada"],
    ["reprovada", "Verificação reprovada"]
  ].forEach(([valorOpcao, texto]) => {
    const opcao = document.createElement("option");
    opcao.value = valorOpcao;
    opcao.textContent = texto;
    seletor.appendChild(opcao);
  });

  seletor.value = nomesVerificacao[statusAtual]
    ? statusAtual
    : "pendente";

  labelStatus.appendChild(seletor);
  painel.appendChild(labelStatus);

  const botao = criarBotao(
    "Salvar verificações",
    "botao-secundario",
    async () => {
      const dados = {};

      camposVerificacao.forEach(campo => {
        dados[campo.coluna] = controles[campo.coluna].checked;
      });

      const statusEscolhido = seletor.value;

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

      if (!window.confirm("Deseja salvar as verificações desta receita?")) {
        return;
      }

      botao.disabled = true;
      botao.textContent = "Salvando...";

      try {
        const { error: erroVerificacao } = await client.rpc(
          "update_recipe_verification",
          {
            p_recipe_id: receita.id,
            p_verification_status: statusEscolhido,
            p_ingredients_verified: dados.ingredients_verified,
            p_allergens_verified: dados.allergens_verified,
            p_cross_contamination_assessed: dados.cross_contamination_assessed,
            p_gluten_free_verified: dados.gluten_free_verified,
            p_dairy_free_verified: dados.dairy_free_verified,
            p_allergies_verified: dados.allergies_verified
          }
        );

        if (erroVerificacao) throw erroVerificacao;

        mostrarMensagem(
          mensagemLista,
          "Verificações alimentares salvas com sucesso!",
          "sucesso"
        );

        await carregarReceitas();

      } catch (problema) {
        console.error("Erro ao salvar verificações:", problema);

        mostrarMensagem(
          mensagemLista,
          problema.message || "Não foi possível salvar as verificações.",
          "erro"
        );

        botao.disabled = false;
        botao.textContent = "Salvar verificações";
      }
    }
  );

  painel.appendChild(botao);

  return painel;
}

// ==========================================
// CARREGAR RECEITAS
// ==========================================

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

      card.append(
        criarElemento("h3", receita.name),
        criarElemento("p", receita.description || "Sem descrição."),
        criarElemento(
          "p",
          "Categoria: " + (receita.category || "Não informada")
        ),
        criarElemento(
          "span",
          nomesStatus[receita.status] || receita.status,
          "status-receita"
        )
      );

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
        acoes.appendChild(
          criarBotao("Editar", "botao-secundario", () => {
            preencherFormulario(receita);
          })
        );
      }

      if (podeRevisar) {
        acoes.append(
          criarBotao("Aprovar", "", () => {
            revisarReceita(receita.id, "approved");
          }),
          criarBotao("Rejeitar", "botao-perigo", () => {
            revisarReceita(receita.id, "rejected");
          })
        );
      }

      if (podePublicar) {
        acoes.appendChild(
          criarBotao("Publicar", "", () => {
            publicarReceita(receita.id);
          })
        );
      }

      if (acoes.children.length) {
        card.appendChild(acoes);
      }

      if (["admin", "reviewer"].includes(membroAtual.role)) {
        card.appendChild(criarPainelVerificacao(receita));
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

// ==========================================
// SALVAR RECEITA
// ==========================================

async function salvarReceita(event) {
  event.preventDefault();

  if (!formReceita.reportValidity()) return;

  const idEditado = receitaEditando;

  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";

  try {
    const dados = montarDadosReceita();
    const statusEscolhido = valor("statusReceita");

    if (idEditado) {
      const { error: erroAtualizacao } = await client
        .from("recipes")
        .update({
          ...dados,
          status: statusEscolhido
        })
        .eq("id", idEditado);

      if (erroAtualizacao) throw erroAtualizacao;

    } else {
      const { error: erroInsercao } = await client
        .from("recipes")
        .insert({
          ...dados,
          status: statusEscolhido,
          created_by: usuarioAtual.id
        });

      if (erroInsercao) throw erroInsercao;
    }

    limparFormulario();

    mostrarMensagem(
      mensagemFormulario,
      idEditado
        ? "Receita atualizada com sucesso!"
        : "Receita cadastrada com sucesso!",
      "sucesso"
    );

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

// ==========================================
// REVISÃO EDITORIAL
// ==========================================

async function revisarReceita(id, decisao) {
  const confirmacao = decisao === "approved"
    ? "Deseja aprovar esta receita editorialmente?"
    : "Deseja rejeitar esta receita editorialmente?";

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
        ? "Receita aprovada editorialmente!"
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

// ==========================================
// PUBLICAR RECEITA
// ==========================================

async function publicarReceita(id) {
  if (membroAtual.role !== "admin") return;

  if (!window.confirm("Deseja publicar esta receita no site?")) return;

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

// ==========================================
// RESTAURANTES — PERMISSÕES
// ==========================================

function podeEditarRestaurante(restaurante) {
  if (!membroAtual) return false;

  if (membroAtual.role === "admin") return true;

  return (
    membroAtual.role === "editor" &&
    restaurante.status === "draft"
  );
}

function podeAdicionarPrato() {
  if (!membroAtual || !restauranteSelecionado) return false;

  return (
    membroAtual.role === "admin" ||
    (
      membroAtual.role === "editor" &&
      restauranteSelecionado.status === "draft"
    )
  );
}

// ==========================================
// LIMPAR FORMULÁRIO DE RESTAURANTE
// ==========================================

function limparFormularioRestaurante() {
  formRestaurante.reset();

  restauranteEditando = null;

  definirValor("statusRestaurante", "draft");

  if (membroAtual && membroAtual.role !== "admin") {
    document.getElementById("statusRestaurante").disabled = true;
  }

  botaoSalvarRestaurante.textContent = "Salvar restaurante";
  botaoCancelarRestaurante.classList.add("oculto");

  mostrarMensagem(mensagemRestaurante, "");
}

// ==========================================
// MONTAR DADOS DO RESTAURANTE
// ==========================================

function montarDadosRestaurante() {
  const statusEscolhido = membroAtual.role === "admin"
    ? valor("statusRestaurante")
    : "draft";

  return {
    name: valor("nomeRestaurante"),
    description: valor("descricaoRestaurante"),
    address: valor("enderecoRestaurante"),
    city: valor("cidadeRestaurante"),
    state: valor("estadoRestaurante"),
    postal_code: valor("cepRestaurante"),
    phone: valor("telefoneRestaurante"),
    website: valor("siteRestaurante") || null,
    image_url: valor("imagemRestaurante") || null,

    dietary_options: dividirLista(valor("opcoesRestaurante")),
    preparation_practices: valor("praticasRestaurante"),
    cross_contamination_info: valor("contaminacaoRestaurante"),

    verification_status: valor("verificacaoRestaurante") || "pending",
    status: statusEscolhido,
    updated_at: new Date().toISOString()
  };
}

// ==========================================
// SALVAR RESTAURANTE
// ==========================================

async function salvarRestaurante(event) {
  event.preventDefault();

  if (!formRestaurante.reportValidity()) return;

  const idEditado = restauranteEditando;

  botaoSalvarRestaurante.disabled = true;
  botaoSalvarRestaurante.textContent = "Salvando...";

  try {
    const dados = montarDadosRestaurante();

    if (idEditado) {
      const { error: erroAtualizacao } = await client
        .from("restaurants")
        .update(dados)
        .eq("id", idEditado);

      if (erroAtualizacao) throw erroAtualizacao;

    } else {
      const { error: erroInsercao } = await client
        .from("restaurants")
        .insert(dados);

      if (erroInsercao) throw erroInsercao;
    }

    limparFormularioRestaurante();

    mostrarMensagem(
      mensagemRestaurante,
      idEditado
        ? "Restaurante atualizado com sucesso!"
        : "Restaurante cadastrado com sucesso!",
      "sucesso"
    );

    await carregarRestaurantes();

  } catch (problema) {
    console.error("Erro ao salvar restaurante:", problema);

    mostrarMensagem(
      mensagemRestaurante,
      problema.message || "Não foi possível salvar o restaurante.",
      "erro"
    );

  } finally {
    botaoSalvarRestaurante.disabled = false;
    botaoSalvarRestaurante.textContent = restauranteEditando
      ? "Atualizar restaurante"
      : "Salvar restaurante";
  }
}

// ==========================================
// PREENCHER FORMULÁRIO DE RESTAURANTE
// ==========================================

function preencherFormularioRestaurante(restaurante) {
  restauranteEditando = restaurante.id;

  definirValor("nomeRestaurante", restaurante.name);
  definirValor("descricaoRestaurante", restaurante.description);
  definirValor("enderecoRestaurante", restaurante.address);
  definirValor("cidadeRestaurante", restaurante.city);
  definirValor("estadoRestaurante", restaurante.state);
  definirValor("cepRestaurante", restaurante.postal_code);
  definirValor("telefoneRestaurante", restaurante.phone);
  definirValor("siteRestaurante", restaurante.website);
  definirValor("imagemRestaurante", restaurante.image_url);

  definirValor(
    "opcoesRestaurante",
    Array.isArray(restaurante.dietary_options)
      ? restaurante.dietary_options.join(", ")
      : ""
  );

  definirValor("praticasRestaurante", restaurante.preparation_practices);
  definirValor("contaminacaoRestaurante", restaurante.cross_contamination_info);
  definirValor("verificacaoRestaurante", restaurante.verification_status || "pending");
  definirValor("statusRestaurante", restaurante.status || "draft");

  if (membroAtual.role !== "admin") {
    document.getElementById("statusRestaurante").disabled = true;
  }

  botaoSalvarRestaurante.textContent = "Atualizar restaurante";
  botaoCancelarRestaurante.classList.remove("oculto");

  areaRestaurantes.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// CARREGAR RESTAURANTES
// ==========================================

async function carregarRestaurantes() {
  listaRestaurantes.replaceChildren(
    criarElemento("p", "Carregando restaurantes...", "status")
  );

  mostrarMensagem(mensagemListaRestaurantes, "");

  try {
    const { data, error: erroBusca } = await client
      .from("restaurants")
      .select("*")
      .order("updated_at", { ascending: false });

    if (erroBusca) throw erroBusca;

    listaRestaurantes.replaceChildren();

    const filtro = filtroStatusRestaurante.value;

    const restaurantes = (data || []).filter(restaurante =>
      filtro === "todas" || restaurante.status === filtro
    );

    if (restaurantes.length === 0) {
      listaRestaurantes.appendChild(
        criarElemento(
          "p",
          "Nenhum restaurante encontrado nesta categoria.",
          "status"
        )
      );
      return;
    }

    restaurantes.forEach(restaurante => {
      const card = criarElemento("article", undefined, "receita");

      card.append(
        criarElemento("h3", restaurante.name),
        criarElemento(
          "p",
          restaurante.description || "Sem descrição."
        ),
        criarElemento(
          "p",
          "Endereço: " +
            [restaurante.address, restaurante.city, restaurante.state]
              .filter(Boolean)
              .join(" - ")
        ),
        criarElemento(
          "p",
          "Opções alimentares: " +
            formatarLista(restaurante.dietary_options)
        ),
        criarElemento(
          "p",
          "Verificação: " +
            (
              nomesVerificacaoRestaurante[restaurante.verification_status] ||
              "Pendente"
            )
        ),
        criarElemento(
          "span",
          nomesStatusRestaurante[restaurante.status] ||
            restaurante.status,
          "status-receita"
        )
      );

      if (restaurante.cross_contamination_info) {
        card.appendChild(
          criarElemento(
            "p",
            "Contaminação cruzada: " +
              restaurante.cross_contamination_info
          )
        );
      }

      const acoes = criarElemento("div", undefined, "acoes");

      acoes.appendChild(
        criarBotao("Ver pratos", "botao-secundario", () => {
          selecionarRestaurante(restaurante);
        })
      );

      if (podeEditarRestaurante(restaurante)) {
        acoes.appendChild(
          criarBotao("Editar", "botao-secundario", () => {
            preencherFormularioRestaurante(restaurante);
          })
        );
      }

      if (
        membroAtual.role === "admin" &&
        restaurante.status === "draft"
      ) {
        acoes.appendChild(
          criarBotao("Publicar", "", () => {
            publicarRestaurante(restaurante.id);
          })
        );
      }

      card.appendChild(acoes);
      listaRestaurantes.appendChild(card);
    });

  } catch (problema) {
    console.error("Erro ao carregar restaurantes:", problema);

    listaRestaurantes.replaceChildren(
      criarElemento(
        "p",
        problema.message || "Não foi possível carregar os restaurantes.",
        "mensagem erro"
      )
    );
  }
}

// ==========================================
// PUBLICAR RESTAURANTE
// ==========================================

async function publicarRestaurante(id) {
  if (membroAtual.role !== "admin") return;

  const confirmar = window.confirm(
    "Deseja publicar este restaurante? Ele ficará visível para os usuários."
  );

  if (!confirmar) return;

  try {
    const { error: erroPublicacao } = await client
      .from("restaurants")
      .update({
        status: "published",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (erroPublicacao) throw erroPublicacao;

    mostrarMensagem(
      mensagemListaRestaurantes,
      "Restaurante publicado com sucesso!",
      "sucesso"
    );

    await carregarRestaurantes();

  } catch (problema) {
    console.error("Erro ao publicar restaurante:", problema);

    mostrarMensagem(
      mensagemListaRestaurantes,
      problema.message || "Não foi possível publicar o restaurante.",
      "erro"
    );
  }
}

// ==========================================
// SELECIONAR RESTAURANTE E ABRIR PRATOS
// ==========================================

async function selecionarRestaurante(restaurante) {
  restauranteSelecionado = restaurante;

  areaPratos.classList.remove("oculto");

  const titulo = document.getElementById("restauranteSelecionado");

  if (titulo) {
    titulo.textContent = "Pratos de " + restaurante.name;
  }

  const podeCadastrar = podeAdicionarPrato();

  formPrato.querySelectorAll("input, textarea, select, button").forEach(campo => {
    campo.disabled = !podeCadastrar;
  });

  if (!podeCadastrar) {
    mostrarMensagem(
      mensagemPrato,
      "Este restaurante não está em rascunho. Somente a administradora pode gerenciar pratos de restaurantes publicados.",
      "status"
    );
  } else {
    mostrarMensagem(mensagemPrato, "");
  }

  limparFormularioPrato();

  await carregarReceitasParaPrato();
  await carregarPratos();

  areaPratos.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// LIMPAR FORMULÁRIO DE PRATOS
// ==========================================

function limparFormularioPrato() {
  formPrato.reset();

  if (restauranteSelecionado) {
    formPrato.querySelectorAll("input, textarea, select, button").forEach(campo => {
      campo.disabled = !podeAdicionarPrato();
    });
  }

  mostrarMensagem(mensagemPrato, "");
}

// ==========================================
// CARREGAR RECEITAS PARA ASSOCIAÇÃO
// ==========================================

async function carregarReceitasParaPrato() {
  const seletor = document.getElementById("receitaPrato");

  if (!seletor) return;

  seletor.replaceChildren();

  const opcaoInicial = document.createElement("option");
  opcaoInicial.value = "";
  opcaoInicial.textContent = "Selecione uma receita relacionada";
  seletor.appendChild(opcaoInicial);

  try {
    const { data, error: erroBusca } = await client
      .from("recipes")
      .select("id, name")
      .eq("status", "published")
      .order("name");

    if (erroBusca) throw erroBusca;

    (data || []).forEach(receita => {
      const opcao = document.createElement("option");
      opcao.value = receita.id;
      opcao.textContent = receita.name;
      seletor.appendChild(opcao);
    });

  } catch (problema) {
    console.error("Erro ao carregar receitas para associação:", problema);

    mostrarMensagem(
      mensagemPrato,
      "Não foi possível carregar as receitas para associação.",
      "erro"
    );
  }
}

// ==========================================
// SALVAR PRATO
// ==========================================

async function salvarPrato(event) {
  event.preventDefault();

  if (!restauranteSelecionado || !podeAdicionarPrato()) {
    mostrarMensagem(
      mensagemPrato,
      "Você não tem permissão para cadastrar pratos neste restaurante.",
      "erro"
    );
    return;
  }

  if (!formPrato.reportValidity()) return;

  botaoSalvarPrato.disabled = true;
  botaoSalvarPrato.textContent = "Salvando...";

  try {
    const dadosPrato = {
      restaurant_id: restauranteSelecionado.id,
      name: valor("nomePrato"),
      description: valor("descricaoPrato"),
      dietary_options: dividirLista(valor("opcoesPrato")),
      allergens: dividirLista(valor("alergenicosPrato")),
      cross_contamination_info: valor("contaminacaoPrato"),
      source_url: valor("fontePrato") || null
    };

    const { data: prato, error: erroInsercao } = await client
      .from("restaurant_dishes")
      .insert(dadosPrato)
      .select()
      .single();

    if (erroInsercao) throw erroInsercao;

    const receitaId = valor("receitaPrato");

    if (receitaId) {
      const { error: erroAssociacao } = await client
        .from("restaurant_dish_recipes")
        .insert({
          restaurant_dish_id: prato.id,
          recipe_id: receitaId
        });

      if (erroAssociacao) {
        console.error("Erro ao associar receita:", erroAssociacao);

        mostrarMensagem(
          mensagemPrato,
          "O prato foi cadastrado, mas não foi possível associá-lo à receita. Você pode tentar novamente depois.",
          "erro"
        );

        await carregarPratos();
        return;
      }
    }

    limparFormularioPrato();

    mostrarMensagem(
      mensagemPrato,
      "Prato cadastrado com sucesso!",
      "sucesso"
    );

    await carregarPratos();

  } catch (problema) {
    console.error("Erro ao salvar prato:", problema);

    mostrarMensagem(
      mensagemPrato,
      problema.message || "Não foi possível cadastrar o prato.",
      "erro"
    );

  } finally {
    botaoSalvarPrato.disabled = !podeAdicionarPrato();
    botaoSalvarPrato.textContent = "Salvar prato";
  }
}

// ==========================================
// CARREGAR PRATOS DO RESTAURANTE
// ==========================================

async function carregarPratos() {
  if (!restauranteSelecionado) return;

  listaPratos.replaceChildren(
    criarElemento("p", "Carregando pratos...", "status")
  );

  try {
    const { data, error: erroBusca } = await client
      .from("restaurant_dishes")
      .select("*")
      .eq("restaurant_id", restauranteSelecionado.id)
      .order("name");

    if (erroBusca) throw erroBusca;

    listaPratos.replaceChildren();

    if (!data || data.length === 0) {
      listaPratos.appendChild(
        criarElemento(
          "p",
          "Este restaurante ainda não possui pratos cadastrados.",
          "status"
        )
      );
      return;
    }

    for (const prato of data) {
      const card = criarElemento("article", undefined, "receita");

      card.append(
        criarElemento("h4", prato.name),
        criarElemento(
          "p",
          prato.description || "Sem descrição."
        ),
        criarElemento(
          "p",
          "Opções alimentares: " + formatarLista(prato.dietary_options)
        ),
        criarElemento(
          "p",
          "Alergênicos: " + formatarLista(prato.allergens)
        )
      );

      if (prato.cross_contamination_info) {
        card.appendChild(
          criarElemento(
            "p",
            "Contaminação cruzada: " + prato.cross_contamination_info
          )
        );
      }

      if (prato.source_url) {
        const link = document.createElement("a");
        link.href = prato.source_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Consultar fonte do prato";
        card.appendChild(link);
      }

      // Consultar associação com receitas
      const { data: associacoes, error: erroAssociacao } = await client
        .from("restaurant_dish_recipes")
        .select("recipe_id")
        .eq("restaurant_dish_id", prato.id);

      if (erroAssociacao) {
        console.error("Erro ao consultar associação:", erroAssociacao);
      }

      if (associacoes && associacoes.length > 0) {
        const ids = associacoes.map(item => item.recipe_id);

        const { data: receitas, error: erroReceitas } = await client
          .from("recipes")
          .select("name")
          .in("id", ids);

        if (erroReceitas) {
          console.error("Erro ao buscar receitas associadas:", erroReceitas);
        } else if (receitas && receitas.length > 0) {
          card.appendChild(
            criarElemento(
              "p",
              "Receitas relacionadas: " +
                receitas.map(receita => receita.name).join(", ")
            )
          );
        }
      }

      listaPratos.appendChild(card);
    }

  } catch (problema) {
    console.error("Erro ao carregar pratos:", problema);

    listaPratos.replaceChildren(
      criarElemento(
        "p",
        problema.message || "Não foi possível carregar os pratos.",
        "mensagem erro"
      )
    );
  }
}

// ==========================================
// INICIALIZAÇÃO DO PAINEL
// ==========================================

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
    areaRestaurantes.classList.remove("oculto");

    if (["admin", "editor"].includes(membro.role)) {
      areaCadastro.classList.remove("oculto");
    }

    if (membro.role !== "admin") {
      definirValor("statusRestaurante", "draft");
      document.getElementById("statusRestaurante").disabled = true;
    }

    if (membro.role === "reviewer") {
      filtroStatus.value = "review";
    }

    await carregarReceitas();
    await carregarRestaurantes();

  } catch (problema) {
    console.error("Erro ao iniciar painel:", problema);

    boasVindas.textContent = "Não foi possível carregar o painel";
    mensagem.textContent =
      problema.message || "Ocorreu um erro inesperado.";
  }
}

// ==========================================
// EVENTOS — RECEITAS
// ==========================================

formReceita.addEventListener("submit", salvarReceita);

botaoCancelar.addEventListener("click", limparFormulario);

filtroStatus.addEventListener("change", carregarReceitas);

// ==========================================
// EVENTOS — RESTAURANTES
// ==========================================

formRestaurante.addEventListener("submit", salvarRestaurante);

botaoCancelarRestaurante.addEventListener(
  "click",
  limparFormularioRestaurante
);

filtroStatusRestaurante.addEventListener(
  "change",
  carregarRestaurantes
);

// ==========================================
// EVENTOS — PRATOS
// ==========================================

formPrato.addEventListener("submit", salvarPrato);

// ==========================================
// SAIR DO SISTEMA
// ==========================================

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

// ==========================================
// INICIALIZAÇÃO FINAL
// ==========================================

criarCamposSensoriais();
iniciarPainel();
