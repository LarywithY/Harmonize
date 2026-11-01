
/* HARMONIZE+ — BUSCA E FILTRO DE RECEITAS NO SUPABASE */

document.addEventListener("DOMContentLoaded", async () => {

  const parametros = new URLSearchParams(window.location.search);
  let dados = {};

  try {
    dados = JSON.parse(parametros.get("dados") || "{}");
  } catch {
    dados = {};
  }

  const restricoes = Array.isArray(dados.restricoes)
    ? dados.restricoes
    : [];

  const categoria = String(dados.refeicao || "").toLowerCase();
  const alergia = String(dados.alergia || "").trim();
  const outra = String(dados.outra || "").trim();

  const resultados = document.getElementById("recipe-results");
  const vazio = document.getElementById("empty");
  const loading = document.getElementById("loading");
  const resumo = document.getElementById("summary");
  const resumoRestricoes = document.getElementById("restrictions");

  const nomesCategorias = {
    entrada: "Entrada",
    principal: "Prato principal",
    sobremesa: "Sobremesa",
    petisco: "Petisco",
    lanche: "Lanche",
    bebida: "Bebida",
    outro: "Outro"
  };

  resumo.textContent = "Categoria selecionada: " +
    (nomesCategorias[categoria] || "não informada") + ".";

  const preferencias = [...restricoes];

  if (alergia) preferencias.push("Alergia informada: " + alergia);
  if (outra) preferencias.push("Outra necessidade: " + outra);

  resumoRestricoes.textContent = preferencias.length
    ? "Preferências informadas: " + preferencias.join(", ")
    : "Nenhuma restrição ou preferência adicional informada.";

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function converterReceita(item) {
    return {
      nome: item.name || "",
      categoria: normalizar(item.category),
      imagem: item.image_url || "",
      descricao: item.description || "",
      tempo: item.prep_minutes != null
        ? item.prep_minutes + " minutos"
        : "",
      rendimento: item.servings != null
        ? item.servings + " porções"
        : "",
      ingredientes: Array.isArray(item.ingredients)
        ? item.ingredients
        : [],
      preparo: Array.isArray(item.steps)
        ? item.steps
        : [],
      alergenicos: Array.isArray(item.allergens)
        ? item.allergens
        : [],
      restricoesCompativeis: Array.isArray(item.dietary_tags)
        ? item.dietary_tags
        : [],
      carboidratosPorPorcao: item.carbs_g != null
        ? Number(item.carbs_g)
        : null,
      harmonizacao: {
        bebida: item.harmonization_drink || "",
        alternativaSemAlcool:
          item.harmonization_non_alcoholic || ""
      },
      verificacao: {
        status: item.verification_status,
        ingredientesConferidos: item.ingredients_verified,
        alergenicosConferidos: item.allergens_verified,
        contaminacaoCruzadaAvaliada:
          item.cross_contamination_assessed,
        semGlutenVerificado: item.gluten_free_verified,
        semLactoseVerificado: item.dairy_free_verified,
        alergiasVerificadas: item.allergies_verified
      }
    };
  }

  function receitaAprovada(receita) {
    const v = receita.verificacao;

    return (
      v.status === "aprovada" &&
      v.ingredientesConferidos === true &&
      v.alergenicosConferidos === true
    );
  }

  function compativel(receita) {
    const v = receita.verificacao;
    const tags = receita.restricoesCompativeis.map(normalizar);
    const possuiTag = (tag) => tags.includes(normalizar(tag));

    if (!receitaAprovada(receita)) return false;
    if (receita.categoria !== categoria) return false;

    if (restricoes.includes("Doença celíaca")) {
      if (
        v.semGlutenVerificado !== true ||
        v.contaminacaoCruzadaAvaliada !== true ||
        !possuiTag("Doença celíaca")
      ) return false;
    }

    if (restricoes.includes("Sensibilidade ao glúten")) {
      if (
        v.semGlutenVerificado !== true ||
        !possuiTag("Sensibilidade ao glúten")
      ) return false;
    }

    if (restricoes.includes("Intolerância à lactose")) {
      if (
        v.semLactoseVerificado !== true ||
        !possuiTag("Intolerância à lactose")
      ) return false;
    }

    if (restricoes.includes("Vegetariana") && !possuiTag("Vegetariana")) {
      return false;
    }

    if (restricoes.includes("Vegana") && !possuiTag("Vegana")) {
      return false;
    }

    if (restricoes.includes("Outra necessidade")) {
      return false;
    }

    if (restricoes.includes("Alergia alimentar")) {
      if (!alergia) return false;
      if (v.alergenicosConferidos !== true) return false;
      if (v.contaminacaoCruzadaAvaliada !== true) return false;
      if (v.alergiasVerificadas !== true) return false;

      const alergiasCadastradas =
        receita.alergenicos.map(normalizar);

      const alergiasInformadas = alergia
        .split(/[,;]+/)
        .map(normalizar)
        .filter(Boolean);

      if (!alergiasInformadas.length) return false;

      const conflito = alergiasInformadas.some(item =>
        alergiasCadastradas.some(alergeno =>
          alergeno === item ||
          alergeno.includes(item) ||
          item.includes(alergeno)
        )
      );

      if (conflito) return false;
    }

    if (restricoes.includes("Diabetes tipo 1")) {
      if (
        typeof receita.carboidratosPorPorcao !== "number" ||
        !Number.isFinite(receita.carboidratosPorPorcao)
      ) return false;
    }

    return true;
  }

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
  }

  function criarCartao(receita) {
    const cartao = criarElemento("article", "recipe-card");

    if (receita.imagem) {
      const foto = document.createElement("img");
      foto.className = "recipe-card-image";
      foto.src = receita.imagem;
      foto.alt = "Fotografia de " + receita.nome;
      foto.loading = "lazy";
      foto.onerror = () => foto.remove();

      cartao.appendChild(foto);
    }

    const conteudo = criarElemento("div", "recipe-card-content");

    conteudo.appendChild(criarElemento(
      "span",
      "recipe-category",
      nomesCategorias[receita.categoria] || receita.categoria
    ));

    conteudo.appendChild(criarElemento("h2", "", receita.nome));

    conteudo.appendChild(criarElemento(
      "p",
      "recipe-description",
      receita.descricao
    ));

    conteudo.appendChild(criarElemento(
      "p",
      "recipe-meta",
      (receita.tempo || "Tempo não informado") +
      " • " +
      (receita.rendimento || "Rendimento não informado")
    ));

    const detalhes = document.createElement("details");
    detalhes.className = "recipe-details";

    const abrir = document.createElement("summary");
    abrir.textContent = "Ver receita completa";
    detalhes.appendChild(abrir);

    const corpo = criarElemento("div", "recipe-full-details");

    corpo.appendChild(criarElemento("h3", "", "Ingredientes"));

    const ingredientes = document.createElement("ul");

    receita.ingredientes.forEach(item => {
      ingredientes.appendChild(criarElemento("li", "", item));
    });

    corpo.appendChild(ingredientes);

    corpo.appendChild(criarElemento("h3", "", "Modo de preparo"));

    const preparo = document.createElement("ol");

    receita.preparo.forEach(etapa => {
      preparo.appendChild(criarElemento("li", "", etapa));
    });

    corpo.appendChild(preparo);

    if (typeof receita.carboidratosPorPorcao === "number") {
      corpo.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Carboidratos: " +
        receita.carboidratosPorPorcao +
        " g por porção."
      ));
    }

    if (
      receita.harmonizacao.bebida ||
      receita.harmonizacao.alternativaSemAlcool
    ) {
      corpo.appendChild(criarElemento("h3", "", "Harmonização"));

      if (receita.harmonizacao.bebida) {
        corpo.appendChild(criarElemento(
          "p",
          "",
          receita.harmonizacao.bebida
        ));
      }

      if (receita.harmonizacao.alternativaSemAlcool) {
        corpo.appendChild(criarElemento(
          "p",
          "",
          "Alternativa sem álcool: " +
          receita.harmonizacao.alternativaSemAlcool
        ));
      }
    }

    detalhes.appendChild(corpo);
    conteudo.appendChild(detalhes);
    cartao.appendChild(conteudo);

    return cartao;
  }

  function mostrarMensagem(titulo, mensagem) {
    vazio.hidden = false;
    vazio.querySelector("h2").textContent = titulo;
    vazio.querySelector("p").textContent = mensagem;
  }

  try {
    const client = window.harmonizeSupabase;

    if (!client) {
      throw new Error("Conexão com o Supabase não encontrada.");
    }

    const { data, error } = await client
      .from("recipes")
      .select("*")
      .eq("status", "published");

    if (error) throw error;

    const catalogo = (data || []).map(converterReceita);

    const encontrados = catalogo
      .filter(compativel)
      .slice(0, 3);

    encontrados.forEach(receita => {
      resultados.appendChild(criarCartao(receita));
    });

    loading.hidden = true;
    vazio.hidden = encontrados.length > 0;

    if (restricoes.includes("Alergia alimentar")) {
      mostrarMensagem(
        "Sua busca exige uma verificação específica",
        "Não encontramos opções que atendam aos critérios de verificação necessários para a alergia informada. Não considere uma receita segura sem confirmação individual dos ingredientes e do preparo."
      );

    } else if (restricoes.includes("Outra necessidade")) {
      mostrarMensagem(
        "Precisamos avaliar sua necessidade",
        "Essa necessidade ainda não pode ser interpretada automaticamente. Nossa equipe precisa avaliar os critérios antes de recomendar receitas."
      );

    } else if (encontrados.length === 0) {
      mostrarMensagem(
        "Não encontramos opções neste momento",
        "Ainda não há receitas publicadas, verificadas e compatíveis com todos os critérios selecionados. Você pode alterar suas preferências ou voltar em outro momento."
      );
    }

  } catch (erro) {
    console.error("Erro ao buscar receitas:", erro);

    loading.hidden = true;

    mostrarMensagem(
      "Não foi possível carregar as receitas",
      "Ocorreu um problema ao consultar o banco de dados. Tente novamente mais tarde."
    );
  }

});
