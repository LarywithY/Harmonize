
/* HARMONIZE+ — FILTRO E EXIBIÇÃO DE RECEITAS */

document.addEventListener("DOMContentLoaded", () => {
  const parametros = new URLSearchParams(window.location.search);

  const restricoes = (parametros.get("restricoes") || "")
    .split("|")
    .filter(Boolean);

  const categoria = parametros.get("refeicao") || "";
  const detalhes = parametros.get("detalhes") || "";

  const catalogo = Array.isArray(window.receitas)
    ? window.receitas
    : [];

  const resultados = document.getElementById("recipe-results");
  const vazio = document.getElementById("empty");
  const resumo = document.getElementById("summary");
  const resumoRestricoes = document.getElementById("restrictions");

  const nomesCategorias = {
    cafe: "Café da manhã",
    entrada: "Entrada",
    principal: "Prato principal",
    lanche: "Lanche",
    sobremesa: "Sobremesa"
  };

  resumo.textContent =
    "Categoria selecionada: " +
    (nomesCategorias[categoria] || "não informada") +
    ". Encontramos até três opções para sua busca.";

  if (restricoes.length || detalhes.trim()) {
    resumoRestricoes.textContent =
      "Preferências informadas: " +
      (restricoes.join(", ") || "nenhuma seleção") +
      (detalhes.trim() ? ". Observações: " + detalhes : "");
  }

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  /*
    Identifica alguns alergênicos comuns mencionados
    no campo de observações. Se não conseguir identificar
    o termo, não libera receitas para essa busca.
  */
  const gruposAlergenicos = {
    leite: ["leite", "lactose", "queijo", "iogurte", "manteiga"],
    ovo: ["ovo", "ovos"],
    trigo: ["trigo", "farinha de trigo"],
    amendoim: ["amendoim"],
    soja: ["soja"],
    castanhas: ["castanha", "castanhas", "nozes", "amendoa", "avelã", "avelas"],
    peixe: ["peixe", "peixes"],
    crustaceos: ["camarao", "lagosta", "caranguejo"],
    gergelim: ["gergelim"],
    mostarda: ["mostarda"]
  };

  function identificarAlergenicos(texto) {
    const busca = normalizar(texto);
    const encontrados = [];

    Object.entries(gruposAlergenicos).forEach(([grupo, termos]) => {
      if (termos.some(termo => busca.includes(normalizar(termo)))) {
        encontrados.push(grupo);
      }
    });

    return encontrados;
  }

  const possuiAlergia = restricoes.includes("Alergia alimentar");
  const alergiasIdentificadas = identificarAlergenicos(detalhes);

  function receitaAprovada(receita) {
    const v = receita.verificacao || {};

    return (
      v.status === "aprovada" &&
      v.ingredientesConferidos === true
    );
  }

  function compativel(receita) {
    const v = receita.verificacao || {};
    const tags = receita.restricoesCompativeis || [];
    const alergiasDaReceita = (receita.alergenicos || [])
      .map(normalizar);

    if (!receitaAprovada(receita)) return false;
    if (receita.categoria !== categoria) return false;

    /* Restrições que exigem verificação específica */
    if (
      restricoes.includes("Doença celíaca ou sem glúten") &&
      (
        v.semGlutenVerificado !== true ||
        v.contaminacaoCruzadaAvaliada !== true ||
        !tags.includes("Doença celíaca ou sem glúten")
      )
    ) return false;

    if (
      restricoes.includes("Sem lactose") &&
      (
        v.semLactoseVerificado !== true ||
        !tags.includes("Sem lactose")
      )
    ) return false;

    if (
      restricoes.includes("Vegetariana") &&
      !tags.includes("Vegetariana")
    ) return false;

    if (
      restricoes.includes("Vegana") &&
      !tags.includes("Vegana")
    ) return false;

    /*
      Uma necessidade não especificada não pode ser
      interpretada automaticamente pelo sistema.
    */
    if (restricoes.includes("Outra necessidade")) return false;

    /*
      Alergia: exige descrição identificável, conferência
      de alergênicos e avaliação de contaminação cruzada.
    */
    if (possuiAlergia) {
      if (!detalhes.trim()) return false;
      if (alergiasIdentificadas.length === 0) return false;
      if (v.alergenicosConferidos !== true) return false;
      if (v.contaminacaoCruzadaAvaliada !== true) return false;

      const conflito = alergiasIdentificadas.some(alergia =>
        alergiasDaReceita.includes(alergia)
      );

      if (conflito) return false;
    }

    /*
      Diabetes tipo 1: não exclui alimentos por açúcar.
      Exige informação de carboidratos por porção.
    */
    if (
      restricoes.includes("Diabetes tipo 1") &&
      (
        typeof receita.carboidratosPorPorcao !== "number" ||
        !Number.isFinite(receita.carboidratosPorPorcao)
      )
    ) return false;

    return true;
  }

  const encontrados = catalogo
    .filter(compativel)
    .slice(0, 3);

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  function criarCartao(receita) {
    const cartao = criarElemento("article", "recipe-card");

    const foto = document.createElement("img");
    foto.className = "recipe-card-image";
    foto.alt = "Fotografia de " + receita.nome;
    foto.loading = "lazy";

    if (receita.imagem) {
      foto.src = receita.imagem;
    } else {
      foto.classList.add("image-missing");
      foto.alt = "Fotografia não cadastrada";
    }

    const conteudo = criarElemento("div", "recipe-card-content");

    conteudo.appendChild(
      criarElemento("span", "recipe-category",
        nomesCategorias[receita.categoria] || receita.categoria)
    );

    conteudo.appendChild(
      criarElemento("h2", "", receita.nome)
    );

    conteudo.appendChild(
      criarElemento("p", "recipe-description", receita.descricao)
    );

    const meta = criarElemento("p", "recipe-meta",
      (receita.tempo || "Tempo não informado") +
      " • " +
      (receita.rendimento || "Rendimento não informado")
    );
    conteudo.appendChild(meta);

    const detalhesReceita = document.createElement("details");
    detalhesReceita.className = "recipe-details";

    const abrir = document.createElement("summary");
    abrir.textContent = "Ver receita completa";
    detalhesReceita.appendChild(abrir);

    const corpo = criarElemento("div", "recipe-full-details");

    corpo.appendChild(criarElemento("h3", "", "Ingredientes"));
    const listaIngredientes = document.createElement("ul");

    (receita.ingredientes || []).forEach(item => {
      listaIngredientes.appendChild(
        criarElemento("li", "", item)
      );
    });

    corpo.appendChild(listaIngredientes);

    corpo.appendChild(criarElemento("h3", "", "Modo de preparo"));
    const listaPreparo = document.createElement("ol");

    (receita.preparo || []).forEach(etapa => {
      listaPreparo.appendChild(
        criarElemento("li", "", etapa)
      );
    });

    corpo.appendChild(listaPreparo);

    if (typeof receita.carboidratosPorPorcao === "number") {
      corpo.appendChild(
        criarElemento(
          "p",
          "recipe-meta",
          "Carboidratos: " +
          receita.carboidratosPorPorcao +
          " g por porção."
        )
      );
    }

    if (receita.harmonizacao) {
      corpo.appendChild(criarElemento("h3", "", "Harmonização"));

      if (receita.harmonizacao.bebida) {
        corpo.appendChild(
          criarElemento("p", "", receita.harmonizacao.bebida)
        );
      }

      if (receita.harmonizacao.alternativaSemAlcool) {
        corpo.appendChild(
          criarElemento(
            "p",
            "",
            "Alternativa sem álcool: " +
            receita.harmonizacao.alternativaSemAlcool
          )
        );
      }
    }

    detalhesReceita.appendChild(corpo);
    conteudo.appendChild(detalhesReceita);

    cartao.appendChild(foto);
    cartao.appendChild(conteudo);

    return cartao;
  }

  encontrados.forEach(receita => {
    resultados.appendChild(criarCartao(receita));
  });

  vazio.hidden = encontrados.length > 0;

  if (possuiAlergia && alergiasIdentificadas.length === 0) {
    vazio.querySelector("h2").textContent =
      "Precisamos identificar a alergia";
    vazio.querySelector("p").textContent =
      "Informe o nome do alimento ou ingrediente ao qual você tem alergia. " +
      "Se não conseguirmos identificar a informação, não exibiremos receitas como compatíveis.";
  } else if (encontrados.length === 0) {
    vazio.querySelector("h2").textContent =
      "Estamos preparando novas opções!";
    vazio.querySelector("p").textContent =
      "Ainda não encontramos receitas cadastradas e verificadas que atendam " +
      "a todos os critérios selecionados. Você pode alterar suas escolhas " +
      "ou voltar em outro momento.";
  }
});
