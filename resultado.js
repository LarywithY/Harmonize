
/* =====================================================
   HARMONIZE+ — RECEITAS, HARMONIZAÇÃO E RESTAURANTES
   ===================================================== */

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

  const categoria = normalizar(dados.refeicao || "");
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

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function contemPalavras(texto, palavras) {
    const conteudo = normalizar(texto);

    return palavras.some(palavra => {
      const termo = normalizar(palavra)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s+");

      const expressao = new RegExp(
        "(^|[^a-z0-9])" + termo + "($|[^a-z0-9])"
      );

      return expressao.test(conteudo);
    });
  }

  function temRestricao(nome) {
    return restricoes.some(item =>
      normalizar(item) === normalizar(nome)
    );
  }

  resumo.textContent =
    "Categoria selecionada: " +
    (nomesCategorias[categoria] || "não informada") + ".";

  const preferencias = [...restricoes];

  if (alergia) {
    preferencias.push("Alergia informada: " + alergia);
  }

  if (outra) {
    preferencias.push("Outra necessidade: " + outra);
  }

  resumoRestricoes.textContent = preferencias.length
    ? "Preferências informadas: " + preferencias.join(", ")
    : "Nenhuma restrição ou preferência adicional informada.";

  // =====================================================
  // CONVERSÃO DAS RECEITAS
  // =====================================================

  function converterReceita(item) {
    return {
      id: item.id,
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

      verificacao: {
        status: item.verification_status,
        ingredientesConferidos: item.ingredients_verified === true,
        alergenicosConferidos: item.allergens_verified === true,
        contaminacaoCruzadaAvaliada:
          item.cross_contamination_assessed === true,
        semGlutenVerificado: item.gluten_free_verified === true,
        semLactoseVerificado: item.dairy_free_verified === true,
        alergiasVerificadas: item.allergies_verified === true
      }
    };
  }

  // =====================================================
  // SEGURANÇA ALIMENTAR
  // =====================================================

  function receitaAprovada(receita) {
    const v = receita.verificacao;

    return (
      v.status === "aprovada" &&
      v.ingredientesConferidos &&
      v.alergenicosConferidos
    );
  }

  function compativel(receita) {
    const v = receita.verificacao;
    const tags = receita.restricoesCompativeis.map(normalizar);

    const possuiTag = tag =>
      tags.includes(normalizar(tag));

    if (!receitaAprovada(receita)) return false;
    if (receita.categoria !== categoria) return false;

    if (temRestricao("Doença celíaca")) {
      if (
        !v.semGlutenVerificado ||
        !v.contaminacaoCruzadaAvaliada ||
        !possuiTag("Doença celíaca")
      ) return false;
    }

    if (temRestricao("Sensibilidade ao glúten")) {
      if (
        !v.semGlutenVerificado ||
        !possuiTag("Sensibilidade ao glúten")
      ) return false;
    }

    if (temRestricao("Intolerância à lactose")) {
      if (
        !v.semLactoseVerificado ||
        !possuiTag("Intolerância à lactose")
      ) return false;
    }

    if (
      temRestricao("Vegetariana") &&
      !possuiTag("Vegetariana")
    ) return false;

    if (
      temRestricao("Vegana") &&
      !possuiTag("Vegana")
    ) return false;

    if (temRestricao("Outra necessidade")) {
      return false;
    }

    if (temRestricao("Alergia alimentar")) {
      if (!alergia) return false;

      if (
        !v.alergenicosConferidos ||
        !v.contaminacaoCruzadaAvaliada ||
        !v.alergiasVerificadas
      ) return false;

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

    if (temRestricao("Diabetes tipo 1")) {
      if (
        typeof receita.carboidratosPorPorcao !== "number" ||
        !Number.isFinite(receita.carboidratosPorPorcao) ||
        receita.carboidratosPorPorcao < 0
      ) return false;
    }

    return true;
  }

  // =====================================================
  // ANÁLISE AUTOMÁTICA DO PERFIL DA RECEITA
  // =====================================================

  function textoIngredientes(receita) {
    return receita.ingredientes.map(item => {
      if (typeof item === "string") return item;
      return JSON.stringify(item);
    }).join(" ");
  }

  function textoPreparo(receita) {
    return receita.preparo.map(etapa => {
      if (typeof etapa === "string") return etapa;
      return JSON.stringify(etapa);
    }).join(" ");
  }

  function analisarReceita(receita) {
    const nomeDescricao =
      normalizar(receita.nome + " " + receita.descricao);

    const ingredientes =
      normalizar(textoIngredientes(receita));

    const preparo = normalizar(textoPreparo(receita));

    const texto = [
      nomeDescricao,
      ingredientes,
      preparo
    ].join(" ");

    const perfis = [];

    const contem = palavras =>
      contemPalavras(texto, palavras);

    if (
      receita.categoria === "sobremesa" ||
      contem([
        "acucar", "mel", "chocolate",
        "brigadeiro", "doce de leite",
        "leite condensado", "caramelo",
        "geleia", "calda doce", "sobremesa",
        "bolo", "pudim", "mousse"
      ])
    ) {
      perfis.push("doce");
    }

    if (contem([
      "pimenta", "pimentao picante",
      "chili", "jalapeno", "malagueta",
      "dedo-de-moca", "dedo de moca",
      "molho picante", "curry picante"
    ])) {
      perfis.push("picante");
    }

    if (contem([
      "limao", "vinagre", "maracuja",
      "acerola", "laranja azeda",
      "molho citrico", "suco citrico"
    ])) {
      perfis.push("acido");
    }

    if (contem([
      "sal", "queijo", "bacon",
      "presunto", "azeitona", "shoyu",
      "molho de soja", "parmesao",
      "anchova", "calabresa"
    ])) {
      perfis.push("salgado");
    }

    if (contem([
      "frito", "fritura", "empanado",
      "manteiga", "creme de leite",
      "bacon", "queijo", "oleo",
      "azeite", "cremoso"
    ])) {
      perfis.push("gorduroso");
    }

    if (contem([
      "cogumelo", "shoyu", "parmesao",
      "tomate", "carne", "caldo de carne",
      "molho de soja", "miso"
    ])) {
      perfis.push("umami");
    }

    if (contem([
      "cafe", "cacau amargo",
      "chocolate amargo", "rucula",
      "jilo", "endivia"
    ])) {
      perfis.push("amargo");
    }

    if (
      receita.categoria === "entrada" ||
      receita.categoria === "lanche" ||
      contem(["salada leve", "legumes cozidos"])
    ) {
      perfis.push("leve");
    }

    return [...new Set(perfis)];
  }

  // =====================================================
  // CONVERSÃO DAS BEBIDAS
  // =====================================================

  function converterBebida(item) {
    return {
      id: item.id,
      nome: item.name || "",
      marca: item.brand || "",
      categoria: normalizar(item.category || ""),
      estilo: item.style || "",
      aroma: item.aroma || "",
      sabor: item.flavor || "",
      corpo: item.body || "",
      amargor: item.bitterness || "",
      carbonatacao: item.carbonation || "",
      descricao: item.description || "",
      imagem: item.image_url || "",
      teorAlcoolico: item.alcohol_content,
      alcoolica: item.is_alcoholic === true,
      fonte: item.source_url || ""
    };
  }

  // =====================================================
  // ANÁLISE DAS CARACTERÍSTICAS DA BEBIDA
  // =====================================================

  function analisarBebida(bebida) {
    const texto = normalizar([
      bebida.aroma,
      bebida.sabor,
      bebida.corpo,
      bebida.amargor,
      bebida.carbonatacao,
      bebida.descricao
    ].join(" "));

    const sinais = [];

    if (
      contemPalavras(texto, [
        "amargor", "amargo", "amarga"
      ]) &&
      !contemPalavras(normalizar(bebida.amargor), [
        "baixo", "baixa", "suave", "leve", "ausente"
      ])
    ) {
      sinais.push("amargo");
    }

    if (contemPalavras(texto, [
      "limao", "laranja", "citrico",
      "citrica", "maracuja"
    ])) {
      sinais.push("citrico");
    }

    if (contemPalavras(texto, [
      "refrescante", "refrescancia"
    ])) {
      sinais.push("refrescante");
    }

    if (contemPalavras(texto, [
      "doce", "dulcor", "adocicado"
    ])) {
      sinais.push("doce");
    }

    if (contemPalavras(texto, [
      "tostado", "torrado",
      "cafe", "chocolate"
    ])) {
      sinais.push("tostado");
    }

    if (
      bebida.carbonatacao &&
      String(bebida.carbonatacao).trim() !== ""
    ) {
      sinais.push("carbonatado");
    }

    if (contemPalavras(texto, [
      "malte", "maltado", "maltada",
      "cereal", "pao"
    ])) {
      sinais.push("maltado");
    }

    return [...new Set(sinais)];
  }

  // =====================================================
  // MOTOR DE HARMONIZAÇÃO
  // =====================================================

  function pontuarHarmonizacao(perfisReceita, bebida) {
    const sinaisBebida = analisarBebida(bebida);

    let pontos = 0;
    const motivos = [];

    function adicionar(perfil, sinal, valor, motivo) {
      if (
        perfisReceita.includes(perfil) &&
        sinaisBebida.includes(sinal)
      ) {
        pontos += valor;
        motivos.push(motivo);
      }
    }

    adicionar(
      "doce", "amargo", 4,
      "O amargor documentado pode criar contraste com a doçura da receita."
    );

    adicionar(
      "doce", "tostado", 2,
      "As notas tostadas podem complementar o perfil doce do prato."
    );

    adicionar(
      "picante", "refrescante", 3,
      "O perfil refrescante documentado pode ajudar a equilibrar a sensação de picância."
    );

    adicionar(
      "picante", "citrico", 2,
      "As notas cítricas documentadas podem trazer contraste à picância."
    );

    adicionar(
      "acido", "refrescante", 2,
      "O perfil refrescante documentado pode acompanhar a acidez da receita."
    );

    adicionar(
      "acido", "maltado", 1,
      "As notas de malte documentadas podem oferecer contraste à acidez."
    );

    adicionar(
      "salgado", "refrescante", 2,
      "O perfil refrescante documentado pode acompanhar os sabores salgados."
    );

    adicionar(
      "salgado", "maltado", 2,
      "As notas de malte documentadas podem complementar o perfil salgado."
    );

    adicionar(
      "gorduroso", "carbonatado", 3,
      "A carbonatação informada pode ajudar a limpar a sensação de gordura no paladar."
    );

    adicionar(
      "gorduroso", "citrico", 2,
      "As notas cítricas documentadas podem criar contraste com a gordura."
    );

    adicionar(
      "gorduroso", "amargo", 1,
      "O amargor documentado pode criar contraste com a untuosidade."
    );

    adicionar(
      "umami", "maltado", 2,
      "As notas maltadas documentadas podem acompanhar a intensidade do umami."
    );

    adicionar(
      "umami", "refrescante", 1,
      "O perfil refrescante documentado pode equilibrar a intensidade do prato."
    );

    adicionar(
      "amargo", "doce", 2,
      "As notas doces documentadas podem contrastar com o amargor da receita."
    );

    adicionar(
      "leve", "refrescante", 2,
      "O perfil leve e refrescante documentado pode acompanhar a delicadeza da receita."
    );

    if (
      perfisReceita.includes("doce") &&
      perfisReceita.includes("picante") &&
      sinaisBebida.includes("refrescante") &&
      sinaisBebida.includes("citrico")
    ) {
      pontos += 2;
      motivos.push(
        "A combinação de notas cítricas e perfil refrescante considera tanto a doçura quanto a picância do prato."
      );
    }

    if (
      perfisReceita.includes("picante") &&
      perfisReceita.includes("gorduroso") &&
      sinaisBebida.includes("carbonatado")
    ) {
      pontos += 1;
      motivos.push(
        "A carbonatação documentada pode contribuir para equilibrar a sensação de gordura e picância."
      );
    }

    return {
      pontos,
      motivos: [...new Set(motivos)],
      sinais: sinaisBebida
    };
  }

  // =====================================================
  // SELEÇÃO DAS BEBIDAS
  // =====================================================

  function selecionarMelhorBebida(perfis, bebidas, tipo) {
    const candidatas = bebidas
      .filter(bebida => {
        if (tipo === "alcoolica") {
          return bebida.alcoolica === true;
        }

        return bebida.alcoolica === false;
      })
      .map(bebida => ({
        bebida,
        resultado: pontuarHarmonizacao(perfis, bebida)
      }))
      .filter(item =>
        item.resultado.pontos >= 2 &&
        item.resultado.motivos.length > 0
      )
      .sort((a, b) =>
        b.resultado.pontos - a.resultado.pontos
      );

    return candidatas.length > 0
      ? candidatas[0]
      : null;
  }

  function selecionarAguaPortfolio(bebidas) {
    const aguas = bebidas.filter(bebida => {
      if (bebida.alcoolica !== false) return false;

      const categoriaAgua = [
        "water",
        "agua",
        "aguas",
        "agua mineral"
      ].includes(bebida.categoria);

      const nome = normalizar(
        bebida.nome + " " + bebida.marca
      );

      const nomeAgua =
        contemPalavras(nome, [
          "agua", "agua mineral", "agua com gas",
          "agua sem gas", "agua natural"
        ]);

      const proteica = contemPalavras(nome, [
        "proteina", "protein", "whey"
      ]);

      return (categoriaAgua || nomeAgua) && !proteica;
    });

    if (!aguas.length) return null;

    const semGas = aguas.find(bebida => {
      const texto = normalizar(
        bebida.nome + " " + bebida.descricao
      );

      return contemPalavras(texto, [
        "sem gas", "natural", "still"
      ]);
    });

    return semGas || aguas[0];
  }

  // =====================================================
  // ELEMENTOS VISUAIS
  // =====================================================

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;

    if (texto !== undefined) {
      elemento.textContent = texto;
    }

    return elemento;
  }

  function criarImagemBebida(bebida) {
    if (!bebida.imagem) return null;

    const imagem = document.createElement("img");
    imagem.className = "pairing-product-image";
    imagem.src = bebida.imagem;
    imagem.alt = "Imagem de " + bebida.nome;
    imagem.loading = "lazy";

    imagem.onerror = () => {
      imagem.remove();
    };

    return imagem;
  }

  function criarDetalheBebida(bloco, icone, rotulo, valor) {
    if (!valor || !String(valor).trim()) return;

    const linha = criarElemento(
      "p",
      "pairing-detail"
    );

    const simbolo = criarElemento(
      "span",
      "pairing-detail-icon",
      icone
    );

    simbolo.setAttribute("aria-hidden", "true");

    linha.appendChild(simbolo);
    linha.appendChild(document.createTextNode(
      rotulo + ": " + valor
    ));

    bloco.appendChild(linha);
  }

  function criarIndicacaoBebida(resultado, titulo, configuracao = {}) {
    const bloco = criarElemento(
      "article",
      "pairing-option"
    );

    if (configuracao.destaque) {
      bloco.classList.add("pairing-option-featured");
    }

    bloco.appendChild(criarElemento(
      "h4",
      "pairing-option-title",
      titulo
    ));

    if (!resultado) {
      bloco.appendChild(criarElemento(
        "p",
        "pairing-unavailable",
        configuracao.mensagem ||
        "Ainda não temos informações oficiais suficientes no catálogo para indicar uma bebida compatível com segurança."
      ));

      return bloco;
    }

    const bebida = resultado.bebida;

    const produto = criarElemento(
      "div",
      "pairing-product"
    );

    const imagem = criarImagemBebida(bebida);

    if (imagem) {
      produto.appendChild(imagem);
    }

    const identificacao = criarElemento(
      "div",
      "pairing-product-info"
    );

    identificacao.appendChild(criarElemento(
      "p",
      "pairing-beverage-name",
      bebida.nome
    ));

    if (bebida.marca) {
      identificacao.appendChild(criarElemento(
        "p",
        "pairing-brand",
        bebida.marca
      ));
    }

    if (bebida.estilo) {
      identificacao.appendChild(criarElemento(
        "p",
        "pairing-style",
        bebida.estilo
      ));
    }

    produto.appendChild(identificacao);
    bloco.appendChild(produto);

    if (resultado.fallback) {
      bloco.classList.add("pairing-neutral");

      bloco.appendChild(criarElemento(
        "p",
        "pairing-reason",
        resultado.mensagem
      ));

    } else {
      const detalhes = criarElemento(
        "div",
        "pairing-details"
      );

      criarDetalheBebida(
        detalhes, "◌", "Aroma", bebida.aroma
      );

      criarDetalheBebida(
        detalhes, "✦", "Sabor", bebida.sabor
      );

      criarDetalheBebida(
        detalhes, "◒", "Corpo", bebida.corpo
      );

      criarDetalheBebida(
        detalhes, "◇", "Amargor", bebida.amargor
      );

      criarDetalheBebida(
        detalhes, "◎", "Carbonatação", bebida.carbonatacao
      );

      if (detalhes.children.length) {
        bloco.appendChild(detalhes);
      }

      bloco.appendChild(criarElemento(
        "p",
        "pairing-reason",
        "Por que combina: " +
        resultado.resultado.motivos.join(" ")
      ));
    }

    if (
      !resultado.fallback &&
      bebida.teorAlcoolico != null
    ) {
      bloco.appendChild(criarElemento(
        "p",
        "pairing-alcohol-content",
        "Teor alcoólico: " + bebida.teorAlcoolico + "%"
      ));
    }

    if (bebida.fonte) {
      const fonte = document.createElement("a");

      fonte.href = bebida.fonte;
      fonte.textContent = "Consultar fonte oficial";
      fonte.target = "_blank";
      fonte.rel = "noopener noreferrer";
      fonte.className = "pairing-source";

      bloco.appendChild(fonte);
    }

    if (bebida.alcoolica) {
      bloco.appendChild(criarElemento(
        "p",
        "pairing-age-notice",
        "Bebida alcoólica: recomendada somente para maiores de 18 anos."
      ));
    }

    return bloco;
  }

  // =====================================================
  // HARMONIZAÇÃO AUTOMÁTICA
  // =====================================================

  function criarHarmonizacaoAutomatica(receita, bebidas) {
    const secao = criarElemento(
      "section",
      "automatic-pairing"
    );

    secao.setAttribute(
      "aria-label",
      "Harmonização de bebidas para esta receita"
    );

    const cabecalho = criarElemento(
      "div",
      "pairing-heading"
    );

    cabecalho.appendChild(criarElemento(
      "span",
      "pairing-eyebrow",
      "HARMONIZE+ RECOMENDA"
    ));

    cabecalho.appendChild(criarElemento(
      "h3",
      "",
      "Harmonização ideal"
    ));

    cabecalho.appendChild(criarElemento(
      "p",
      "pairing-intro",
      "Descubra a bebida do portfólio que melhor acompanha esta receita."
    ));

    secao.appendChild(cabecalho);

    const perfis = analisarReceita(receita);

    if (perfis.length > 0) {
      secao.appendChild(criarElemento(
        "p",
        "pairing-profile",
        "Perfil identificado: " + perfis.join(", ") + "."
      ));
    } else {
      secao.appendChild(criarElemento(
        "p",
        "pairing-profile",
        "Não foi possível identificar características sensoriais suficientes para uma combinação específica."
      ));
    }

    const alcoolica = selecionarMelhorBebida(
      perfis,
      bebidas,
      "alcoolica"
    );

    const semAlcool = selecionarMelhorBebida(
      perfis,
      bebidas,
      "sem_alcool"
    );

    const aguaFallback = !semAlcool
      ? selecionarAguaPortfolio(bebidas)
      : null;

    let principal = null;
    let tituloPrincipal = "Sugestão em destaque";

    if (alcoolica && semAlcool) {
      if (
        alcoolica.resultado.pontos >=
        semAlcool.resultado.pontos
      ) {
        principal = alcoolica;
      } else {
        principal = semAlcool;
      }
    } else if (alcoolica) {
      principal = alcoolica;
    } else if (semAlcool) {
      principal = semAlcool;
    }

    if (principal) {
      secao.appendChild(criarIndicacaoBebida(
        principal,
        tituloPrincipal,
        { destaque: true }
      ));

      if (principal === alcoolica) {
        secao.appendChild(criarIndicacaoBebida(
          semAlcool,
          "Alternativa sem álcool"
        ));
      } else {
        secao.appendChild(criarIndicacaoBebida(
          alcoolica,
          "Alternativa alcoólica"
        ));
      }

    } else if (aguaFallback) {
      secao.appendChild(criarIndicacaoBebida(
        {
          bebida: aguaFallback,
          fallback: true,
          mensagem:
            "Esta é uma opção neutra para acompanhar a refeição. Como não há dados sensoriais suficientes para justificar uma harmonização específica, a água é apresentada como acompanhamento, e não como uma combinação técnica."
        },
        "Acompanhamento neutro",
        { destaque: true }
      ));

      secao.appendChild(criarIndicacaoBebida(
        null,
        "Outras combinações",
        {
          mensagem:
            "O catálogo ainda não possui outra bebida com informações suficientes para sustentar uma harmonização específica."
        }
      ));

    } else {
      secao.appendChild(criarIndicacaoBebida(
        null,
        "Sugestão de bebida",
        {
          destaque: true,
          mensagem:
            "Não há uma bebida com informações suficientes para justificar uma harmonização neste momento. Cadastre ou ative produtos no catálogo para disponibilizar recomendações."
        }
      ));
    }

    return secao;
  }

  // =====================================================
  // RESTAURANTES RECOMENDADOS
  // =====================================================

  function criarSecaoRestaurantes(receita, relacoes) {
    const secao = criarElemento(
      "section",
      "recommended-restaurants"
    );

    secao.setAttribute(
      "aria-label",
      "Restaurantes relacionados a esta receita"
    );

    secao.appendChild(criarElemento(
      "span",
      "pairing-eyebrow",
      "HARMONIZE+ INDICA"
    ));

    secao.appendChild(criarElemento(
      "h3",
      "",
      "Onde experimentar?"
    ));

    secao.appendChild(criarElemento(
      "p",
      "pairing-intro",
      "Confira restaurantes que oferecem pratos relacionados a esta receita."
    ));

    const pratos = relacoes.filter(relacao => {
      const prato = relacao.restaurant_dishes;
      const restaurante = prato && prato.restaurants;

      return (
        relacao.recipe_id === receita.id &&
        prato &&
        restaurante &&
        restaurante.status === "published"
      );
    });

    if (!pratos.length) {
      secao.appendChild(criarElemento(
        "p",
        "pairing-unavailable",
        "Ainda não encontramos restaurantes publicados relacionados a esta receita."
      ));

      return secao;
    }

    const restaurantesExibidos = new Set();

    pratos.forEach(relacao => {
      const prato = relacao.restaurant_dishes;
      const restaurante = prato.restaurants;

      if (restaurantesExibidos.has(restaurante.id)) {
        return;
      }

      restaurantesExibidos.add(restaurante.id);

      const cartao = criarElemento(
        "article",
        "restaurant-card"
      );

      if (restaurante.image_url) {
        const imagem = document.createElement("img");

        imagem.src = restaurante.image_url;
        imagem.alt = "Imagem de " + restaurante.name;
        imagem.loading = "lazy";
        imagem.className = "restaurant-card-image";

        imagem.onerror = () => imagem.remove();

        cartao.appendChild(imagem);
      }

      const conteudo = criarElemento(
        "div",
        "restaurant-card-content"
      );

      conteudo.appendChild(criarElemento(
        "h4",
        "",
        restaurante.name || "Restaurante"
      ));

      conteudo.appendChild(criarElemento(
        "p",
        "restaurant-dish-name",
        "Prato relacionado: " + (prato.name || "Não informado")
      ));

      if (prato.description) {
        conteudo.appendChild(criarElemento(
          "p",
          "",
          prato.description
        ));
      }

      const endereco = [
        restaurante.address,
        restaurante.city,
        restaurante.state
      ].filter(Boolean).join(", ");

      if (endereco) {
        conteudo.appendChild(criarElemento(
          "p",
          "restaurant-card-detail",
          "Endereço: " + endereco
        ));
      }

      if (restaurante.phone) {
        conteudo.appendChild(criarElemento(
          "p",
          "restaurant-card-detail",
          "Telefone: " + restaurante.phone
        ));
      }

      if (restaurante.website) {
        const site = document.createElement("a");

        let urlSite = restaurante.website;

        if (!/^https?:\/\//i.test(urlSite)) {
          urlSite = "https://" + urlSite;
        }

        site.href = urlSite;
        site.textContent = "Visitar site do restaurante";
        site.target = "_blank";
        site.rel = "noopener noreferrer";

        conteudo.appendChild(site);
      }

      const verificacao = restaurante.verification_status;

      let textoVerificacao =
        "Informações de verificação pendentes.";

      if (verificacao === "verified") {
        textoVerificacao =
          "Informações do estabelecimento verificadas.";
      } else if (verificacao === "not_verified") {
        textoVerificacao =
          "Informações do estabelecimento ainda não verificadas.";
      }

      conteudo.appendChild(criarElemento(
        "p",
        "restaurant-verification",
        textoVerificacao
      ));

      conteudo.appendChild(criarElemento(
        "p",
        "restaurant-safety-notice",
        "A indicação deste restaurante não garante ausência de alérgenos ou contaminação cruzada. Confirme os ingredientes e as condições de preparo diretamente com o estabelecimento antes de consumir."
      ));

      cartao.appendChild(conteudo);
      secao.appendChild(cartao);
    });

    return secao;
  }

  // =====================================================
  // CARTÃO DA RECEITA
  // =====================================================

  function criarCartao(receita, bebidas) {
    const conjunto = criarElemento(
      "div",
      "result-item"
    );

    const cartao = criarElemento(
      "article",
      "recipe-card"
    );

    if (receita.imagem) {
      const foto = document.createElement("img");

      foto.className = "recipe-card-image";
      foto.src = receita.imagem;
      foto.alt = "Fotografia de " + receita.nome;
      foto.loading = "lazy";
      foto.onerror = () => foto.remove();

      cartao.appendChild(foto);
    }

    const conteudo = criarElemento(
      "div",
      "recipe-card-content"
    );

    conteudo.appendChild(criarElemento(
      "span",
      "recipe-category",
      nomesCategorias[receita.categoria] || receita.categoria
    ));

    conteudo.appendChild(criarElemento(
      "h2",
      "",
      receita.nome
    ));

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

    if (receita.alergenicos.length > 0) {
      conteudo.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Alergênicos informados: " +
        receita.alergenicos.join(", ")
      ));
    } else {
      conteudo.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Nenhum alergênico cadastrado na ficha. Consulte a equipe."
      ));
    }

    if (receita.restricoesCompativeis.length > 0) {
      conteudo.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Características alimentares: " +
        receita.restricoesCompativeis.join(", ")
      ));
    }

    const detalhes = document.createElement("details");
    detalhes.className = "recipe-details";

    const abrir = document.createElement("summary");
    abrir.textContent = "Ver receita completa";

    detalhes.appendChild(abrir);

    const corpo = criarElemento(
      "div",
      "recipe-full-details"
    );

    corpo.appendChild(criarElemento(
      "h3",
      "",
      "Ingredientes"
    ));

    const ingredientes = document.createElement("ul");

    receita.ingredientes.forEach(item => {
      ingredientes.appendChild(criarElemento(
        "li",
        "",
        typeof item === "string"
          ? item
          : JSON.stringify(item)
      ));
    });

    corpo.appendChild(ingredientes);

    corpo.appendChild(criarElemento(
      "h3",
      "",
      "Modo de preparo"
    ));

    const preparo = document.createElement("ol");

    receita.preparo.forEach(etapa => {
      preparo.appendChild(criarElemento(
        "li",
        "",
        typeof etapa === "string"
          ? etapa
          : JSON.stringify(etapa)
      ));
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

    detalhes.appendChild(corpo);
    conteudo.appendChild(detalhes);

    conteudo.appendChild(criarElemento(
      "p",
      "recipe-meta",
      "Importante: confira os ingredientes, a embalagem e as condições de preparo diretamente com o estabelecimento antes de consumir."
    ));

    cartao.appendChild(conteudo);

    conjunto.appendChild(cartao);

    conjunto.appendChild(
      criarHarmonizacaoAutomatica(receita, bebidas)
    );

    return conjunto;
  }

  // =====================================================
  // MENSAGENS
  // =====================================================

  function mostrarMensagem(titulo, mensagem) {
    vazio.hidden = false;

    vazio.querySelector("h2").textContent = titulo;
    vazio.querySelector("p").textContent = mensagem;
  }

  // =====================================================
  // CONSULTA AO SUPABASE
  // =====================================================

  try {
    const client = window.harmonizeSupabase;

    if (!client) {
      throw new Error(
        "Conexão com o Supabase não encontrada."
      );
    }

    const [receitasResultado, bebidasResultado] =
      await Promise.all([
        client
          .from("recipes")
          .select("*")
          .eq("status", "published"),

        client
          .from("beverages")
          .select(`
            id,
            name,
            brand,
            category,
            style,
            aroma,
            flavor,
            body,
            bitterness,
            carbonation,
            description,
            image_url,
            alcohol_content,
            is_alcoholic,
            source_url
          `)
          .eq("active", true)
      ]);

    if (receitasResultado.error) {
      throw receitasResultado.error;
    }

    const catalogo = (
      receitasResultado.data || []
    ).map(converterReceita);

    let bebidas = [];
    let erroCatalogoBebidas = false;

    if (bebidasResultado.error) {
      console.error(
        "Erro ao consultar catálogo de bebidas:",
        bebidasResultado.error
      );

      erroCatalogoBebidas = true;
    } else {
      bebidas = (
        bebidasResultado.data || []
      ).map(converterBebida);
    }

    const encontrados = catalogo
      .filter(compativel)
      .slice(0, 3);

    // =====================================================
    // BUSCA DOS RESTAURANTES RELACIONADOS
    // =====================================================

    let relacoesRestaurantes = [];
    let erroRestaurantes = false;

    if (encontrados.length > 0) {
      const idsReceitas = encontrados.map(
        receita => receita.id
      );

      const resultadoRestaurantes = await client
        .from("restaurant_dish_recipes")
        .select(`
          recipe_id,
          restaurant_dishes!inner (
            id,
            name,
            description,
            restaurants!inner (
              id,
              name,
              address,
              city,
              state,
              phone,
              website,
              image_url,
              verification_status,
              status
            )
          )
        `)
        .in("recipe_id", idsReceitas);

      if (resultadoRestaurantes.error) {
        console.error(
          "Erro ao consultar restaurantes relacionados:",
          resultadoRestaurantes.error
        );

        erroRestaurantes = true;
      } else {
        relacoesRestaurantes =
          resultadoRestaurantes.data || [];
      }
    }

    // =====================================================
    // EXIBIÇÃO DOS RESULTADOS
    // =====================================================

    encontrados.forEach(receita => {
      const conjunto = criarCartao(
        receita,
        erroCatalogoBebidas ? [] : bebidas
      );

      if (erroCatalogoBebidas) {
        const secao = conjunto.querySelector(
          ".automatic-pairing"
        );

        if (secao) {
          secao.replaceChildren(
            criarElemento(
              "h3",
              "",
              "Harmonização automática"
            ),
            criarElemento(
              "p",
              "pairing-unavailable",
              "Não foi possível consultar o catálogo de bebidas neste momento. A harmonização automática está temporariamente indisponível."
            )
          );
        }
      }

      // Adiciona a recomendação de restaurantes.
      if (erroRestaurantes) {
        const secaoErro = criarElemento(
          "section",
          "recommended-restaurants"
        );

        secaoErro.appendChild(criarElemento(
          "h3",
          "",
          "Restaurantes recomendados"
        ));

        secaoErro.appendChild(criarElemento(
          "p",
          "pairing-unavailable",
          "Não foi possível consultar os restaurantes neste momento. Tente novamente mais tarde."
        ));

        conjunto.appendChild(secaoErro);
      } else {
        conjunto.appendChild(
          criarSecaoRestaurantes(
            receita,
            relacoesRestaurantes
          )
        );
      }

      resultados.appendChild(conjunto);
    });

    loading.hidden = true;
    vazio.hidden = encontrados.length > 0;

    if (temRestricao("Alergia alimentar")) {
      mostrarMensagem(
        "Sua busca exige uma verificação específica",
        "Não encontramos opções que atendam aos critérios de verificação necessários para a alergia informada. Não considere uma receita segura sem confirmação individual dos ingredientes e do preparo."
      );

    } else if (temRestricao("Outra necessidade")) {
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
