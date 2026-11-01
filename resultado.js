
/* HARMONIZE+ — FILTRO DE RECEITAS */

document.addEventListener("DOMContentLoaded", () => {
  const parametros = new URLSearchParams(window.location.search);
  let dados = {};

  try {
    dados = JSON.parse(parametros.get("dados") || "{}");
  } catch {
    dados = {};
  }

  const restricoes = Array.isArray(dados.restricoes) ? dados.restricoes : [];
  const categoria = dados.refeicao || "";
  const alergia = String(dados.alergia || "").trim();
  const outra = String(dados.outra || "").trim();

  const catalogo = Array.isArray(window.receitas) ? window.receitas : [];
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

  function receitaAprovada(receita) {
    const v = receita.verificacao || {};

    return (
      v.status === "aprovada" &&
      v.ingredientesConferidos === true &&
      v.alergenicosConferidos === true
    );
  }

  function compativel(receita) {
    const v = receita.verificacao || {};
    const tags = receita.restricoesCompativeis || [];

    if (!receitaAprovada(receita)) return false;
    if (receita.categoria !== categoria) return false;

    if (restricoes.includes("Doença celíaca")) {
      if (
        v.semGlutenVerificado !== true ||
        v.contaminacaoCruzadaAvaliada !== true ||
        !tags.includes("Doença celíaca")
      ) return false;
    }

    if (restricoes.includes("Sensibilidade ao glúten")) {
      if (
        v.semGlutenVerificado !== true ||
        !tags.includes("Sensibilidade ao glúten")
      ) return false;
    }

    if (restricoes.includes("Intolerância à lactose")) {
      if (
        v.semLactoseVerificado !== true ||
        !tags.includes("Intolerância à lactose")
      ) return false;
    }

    if (restricoes.includes("Vegetariana") && !tags.includes("Vegetariana")) {
      return false;
    }

    if (restricoes.includes("Vegana") && !tags.includes("Vegana")) {
      return false;
    }

    if (restricoes.includes("Outra necessidade")) {
      return false;
    }

    /*
      Não fazemos correspondência automática de alergias.
      A equipe precisa verificar individualmente o alérgeno,
      ingredientes, rótulos e risco de contaminação cruzada.
    */
    if (restricoes.includes("Alergia alimentar")) {
      if (!alergia) return false;
      if (v.alergenicosConferidos !== true) return false;
      if (v.contaminacaoCruzadaAvaliada !== true) return false;
      if (v.alergiasVerificadas !== true) return false;

      const alergiasCadastradas = (receita.alergenicos || [])
        .map(normalizar);

      const alergiasInformadas = alergia
        .split(/[,;]+/)
        .map(normalizar)
        .filter(Boolean);

      if (!alergiasInformadas.length) return false;

      const conflito = alergiasInformadas.some(item =>
        alergiasCadastradas.some(alergeno =>
          alergeno === item || alergeno.includes(item) || item.includes(alergeno)
        )
      );

      if (conflito) return false;

      /*
        A ausência de conflito na lista não é prova de segurança.
        A equipe deve cadastrar alergiasVerificadas apenas após
        uma avaliação individual e documentada.
      */
    }

    /*
      Não excluímos alimentos de forma genérica para diabetes tipo 1.
      Exigimos informação numérica de carboidratos por porção.
    */
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
      foto.onerror = () => {
        foto.remove();
      };
      cartao.appendChild(foto);
    }

    const conteudo = criarElemento("div", "recipe-card-content");

    conteudo.appendChild(criarElemento(
      "span",
      "recipe-category",
      nomesCategorias[receita.categoria] || receita.categoria
    ));

    conteudo.appendChild(criarElemento("h2", "", receita.nome));
    conteudo.appendChild(criarElemento("p", "recipe-description", receita.descricao || ""));

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

    (receita.ingredientes || []).forEach(item => {
      ingredientes.appendChild(criarElemento("li", "", item));
    });

    corpo.appendChild(ingredientes);
    corpo.appendChild(criarElemento("h3", "", "Modo de preparo"));

    const preparo = document.createElement("ol");

    (receita.preparo || []).forEach(etapa => {
      preparo.appendChild(criarElemento("li", "", etapa));
    });

    corpo.appendChild(preparo);

    if (typeof receita.carboidratosPorPorcao === "number") {
      corpo.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Carboidratos: " + receita.carboidratosPorPorcao + " g por porção."
      ));
    }

    if (receita.harmonizacao) {
      corpo.appendChild(criarElemento("h3", "", "Harmonização"));

      if (receita.harmonizacao.bebida) {
        corpo.appendChild(criarElemento("p", "", receita.harmonizacao.bebida));
      }

      if (receita.harmonizacao.alternativaSemAlcool) {
        corpo.appendChild(criarElemento(
          "p",
          "",
          "Alternativa sem álcool: " + receita.harmonizacao.alternativaSemAlcool
        ));
      }
    }

    detalhes.appendChild(corpo);
    conteudo.appendChild(detalhes);
    cartao.appendChild(conteudo);

    return cartao;
  }

  const encontrados = catalogo.filter(compativel).slice(0, 3);

  encontrados.forEach(receita => {
    resultados.appendChild(criarCartao(receita));
  });

  loading.hidden = true;
  vazio.hidden = encontrados.length > 0;

  if (restricoes.includes("Alergia alimentar")) {
    vazio.querySelector("h2").textContent = "Sua busca exige uma verificação específica";
    vazio.querySelector("p").textContent =
      "Não encontramos opções que atendam aos critérios de verificação necessários para a alergia informada. Não considere uma receita segura sem confirmação individual dos ingredientes e do preparo.";
  } else if (restricoes.includes("Outra necessidade")) {
    vazio.querySelector("h2").textContent = "Precisamos avaliar sua necessidade";
    vazio.querySelector("p").textContent =
      "Essa necessidade ainda não pode ser interpretada automaticamente. Nossa equipe precisa avaliar os critérios antes de recomendar receitas.";
  } else if (encontrados.length === 0) {
    vazio.querySelector("h2").textContent = "Não encontramos opções neste momento";
    vazio.querySelector("p").textContent =
      "Ainda não há receitas cadastradas e verificadas para todos os critérios selecionados. Você pode alterar suas preferências ou voltar em outro momento.";
  }
});
