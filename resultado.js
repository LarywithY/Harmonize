
/* =====================================================
   HARMONIZE+ — RECEITAS E HARMONIZAÇÃO AUTOMÁTICA
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

  // Identifica palavras completas para reduzir falsos positivos.
  // Exemplo: "sal" não será identificado dentro de "salada".
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

    // DOENÇA CELÍACA
    if (temRestricao("Doença celíaca")) {
      if (
        !v.semGlutenVerificado ||
        !v.contaminacaoCruzadaAvaliada ||
        !possuiTag("Doença celíaca")
      ) return false;
    }

    // SENSIBILIDADE AO GLÚTEN
    if (temRestricao("Sensibilidade ao glúten")) {
      if (
        !v.semGlutenVerificado ||
        !possuiTag("Sensibilidade ao glúten")
      ) return false;
    }

    // INTOLERÂNCIA À LACTOSE
    if (temRestricao("Intolerância à lactose")) {
      if (
        !v.semLactoseVerificado ||
        !possuiTag("Intolerância à lactose")
      ) return false;
    }

    // VEGETARIANA
    if (
      temRestricao("Vegetariana") &&
      !possuiTag("Vegetariana")
    ) return false;

    // VEGANA
    if (
      temRestricao("Vegana") &&
      !possuiTag("Vegana")
    ) return false;

    // OUTRA NECESSIDADE
    if (temRestricao("Outra necessidade")) {
      return false;
    }

    // ALERGIA ALIMENTAR
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

    // DIABETES TIPO 1
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

    // DOCE
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

    // PICANTE
    if (contem([
      "pimenta", "pimentao picante",
      "chili", "jalapeno", "malagueta",
      "dedo-de-moca", "dedo de moca",
      "molho picante", "curry picante"
    ])) {
      perfis.push("picante");
    }

    // ÁCIDO / CÍTRICO
    if (contem([
      "limao", "vinagre", "maracuja",
      "acerola", "laranja azeda",
      "molho citrico", "suco citrico"
    ])) {
      perfis.push("acido");
    }

    // SALGADO
    if (contem([
      "sal", "queijo", "bacon",
      "presunto", "azeitona", "shoyu",
      "molho de soja", "parmesao",
      "anchova", "calabresa"
    ])) {
      perfis.push("salgado");
    }

    // GORDUROSO
    if (contem([
      "frito", "fritura", "empanado",
      "manteiga", "creme de leite",
      "bacon", "queijo", "oleo",
      "azeite", "cremoso"
    ])) {
      perfis.push("gorduroso");
    }

    // UMAMI
    if (contem([
      "cogumelo", "shoyu", "parmesao",
      "tomate", "carne", "caldo de carne",
      "molho de soja", "miso"
    ])) {
      perfis.push("umami");
    }

    // AMARGO
    if (contem([
      "cafe", "cacau amargo",
      "chocolate amargo", "rucula",
      "jilo", "endivia"
    ])) {
      perfis.push("amargo");
    }

    // PERFIL LEVE
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
      teorAlcoolico: item.alcohol_content,
      alcoolica: item.is_alcoholic === true,
      fonte: item.source_url || ""
    };
  }

  // =====================================================
  // ANÁLISE DAS CARACTERÍSTICAS OFICIAIS DA BEBIDA
  // =====================================================

  function analisarBebida(bebida) {
    // A análise considera somente informações descritivas
    // cadastradas no catálogo.
    //
    // O estilo da bebida não é usado para presumir aroma,
    // amargor, refrescância ou sabor.
    //
    // Exemplo: nem toda IPA será automaticamente marcada
    // como amarga sem uma descrição oficial que confirme isso.

    const texto = normalizar([
      bebida.aroma,
      bebida.sabor,
      bebida.corpo,
      bebida.amargor,
      bebida.carbonatacao,
      bebida.descricao
    ].join(" "));

    const sinais = [];

    // AMARGOR
    // Não considera simplesmente qualquer campo preenchido.
    // Valores como "baixo" ou "suave" não geram esse sinal.
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

    // NOTAS CÍTRICAS
    if (contemPalavras(texto, [
      "limao", "laranja", "citrico",
      "citrica", "maracuja"
    ])) {
      sinais.push("citrico");
    }

    // REFRESCÂNCIA
    if (contemPalavras(texto, [
      "refrescante", "refrescancia"
    ])) {
      sinais.push("refrescante");
    }

    // DOÇURA
    // "Frutado" sozinho não significa necessariamente doce.
    if (contemPalavras(texto, [
      "doce", "dulcor", "adocicado"
    ])) {
      sinais.push("doce");
    }

    // NOTAS TOSTADAS
    if (contemPalavras(texto, [
      "tostado", "torrado",
      "cafe", "chocolate"
    ])) {
      sinais.push("tostado");
    }

    // CARBONATAÇÃO
    // Só considera o sinal quando o campo específico
    // de carbonatação estiver preenchido no catálogo.
    if (
      bebida.carbonatacao &&
      String(bebida.carbonatacao).trim() !== ""
    ) {
      sinais.push("carbonatado");
    }

    // NOTAS DE MALTE
    if (contemPalavras(texto, [
      "malte", "maltado", "maltada",
      "cereal", "pao"
    ])) {
      sinais.push("maltado");
    }

    return [...new Set(sinais)];
  }

  // =====================================================
  // MOTOR DE HARMONIZAÇÃO AUTOMÁTICA
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

    // DOCE
    adicionar(
      "doce",
      "amargo",
      4,
      "O amargor documentado pode criar contraste com a doçura da receita."
    );

    adicionar(
      "doce",
      "tostado",
      2,
      "As notas tostadas podem complementar o perfil doce do prato."
    );

    // PICANTE
    adicionar(
      "picante",
      "refrescante",
      3,
      "O perfil refrescante documentado pode ajudar a equilibrar a sensação de picância."
    );

    adicionar(
      "picante",
      "citrico",
      2,
      "As notas cítricas documentadas podem trazer contraste à picância."
    );

    // ÁCIDO
    adicionar(
      "acido",
      "refrescante",
      2,
      "O perfil refrescante documentado pode acompanhar a acidez da receita."
    );

    adicionar(
      "acido",
      "maltado",
      1,
      "As notas de malte documentadas podem oferecer contraste à acidez."
    );

    // SALGADO
    adicionar(
      "salgado",
      "refrescante",
      2,
      "O perfil refrescante documentado pode acompanhar os sabores salgados."
    );

    adicionar(
      "salgado",
      "maltado",
      2,
      "As notas de malte documentadas podem complementar o perfil salgado."
    );

    // GORDUROSO
    adicionar(
      "gorduroso",
      "carbonatado",
      3,
      "A carbonatação informada pode ajudar a limpar a sensação de gordura no paladar."
    );

    adicionar(
      "gorduroso",
      "citrico",
      2,
      "As notas cítricas documentadas podem criar contraste com a gordura."
    );

    adicionar(
      "gorduroso",
      "amargo",
      1,
      "O amargor documentado pode criar contraste com a untuosidade."
    );

    // UMAMI
    adicionar(
      "umami",
      "maltado",
      2,
      "As notas maltadas documentadas podem acompanhar a intensidade do umami."
    );

    adicionar(
      "umami",
      "refrescante",
      1,
      "O perfil refrescante documentado pode equilibrar a intensidade do prato."
    );

    // AMARGO
    adicionar(
      "amargo",
      "doce",
      2,
      "As notas doces documentadas podem contrastar com o amargor da receita."
    );

    // LEVE
    adicionar(
      "leve",
      "refrescante",
      2,
      "O perfil leve e refrescante documentado pode acompanhar a delicadeza da receita."
    );

    // PICANTE + DOCE
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

    // PICANTE + GORDUROSO
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

        // Para a alternativa sem álcool, exige que o
        // cadastro indique explicitamente is_alcoholic=false.
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

  function criarIndicacaoBebida(resultado, titulo) {
    const bloco = criarElemento("div", "pairing-option");

    bloco.appendChild(criarElemento(
      "h4",
      "",
      titulo
    ));

    if (!resultado) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Ainda não temos informações oficiais suficientes no catálogo para indicar uma bebida compatível com segurança."
      ));

      return bloco;
    }

    const bebida = resultado.bebida;

    bloco.appendChild(criarElemento(
      "p",
      "pairing-beverage-name",
      bebida.nome
    ));

    if (bebida.marca) {
      bloco.appendChild(criarElemento(
        "p",
        "pairing-brand",
        bebida.marca
      ));
    }

    if (bebida.estilo) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Estilo: " + bebida.estilo
      ));
    }

    if (bebida.aroma) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Aroma: " + bebida.aroma
      ));
    }

    if (bebida.sabor) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Sabor: " + bebida.sabor
      ));
    }

    if (bebida.corpo) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Corpo: " + bebida.corpo
      ));
    }

    if (bebida.amargor) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Amargor: " + bebida.amargor
      ));
    }

    if (bebida.carbonatacao) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Carbonatação: " + bebida.carbonatacao
      ));
    }

    if (bebida.teorAlcoolico != null) {
      bloco.appendChild(criarElemento(
        "p",
        "",
        "Teor alcoólico: " +
        bebida.teorAlcoolico +
        "%"
      ));
    }

    bloco.appendChild(criarElemento(
      "p",
      "pairing-reason",
      "Por que combina: " +
      resultado.resultado.motivos.join(" ")
    ));

    if (bebida.fonte) {
      const fonte = document.createElement("a");

      fonte.href = bebida.fonte;
      fonte.textContent = "Consultar fonte oficial";
      fonte.target = "_blank";
      fonte.rel = "noopener noreferrer";

      bloco.appendChild(fonte);
    }

    if (bebida.alcoolica) {
      bloco.appendChild(criarElemento(
        "p",
        "recipe-meta",
        "Bebida alcoólica: recomendada somente para maiores de 18 anos."
      ));
    }

    return bloco;
  }

  function criarHarmonizacaoAutomatica(receita, bebidas) {
    const secao = criarElemento(
      "section",
      "automatic-pairing"
    );

    secao.appendChild(criarElemento(
      "h3",
      "",
      "Harmonização automática"
    ));

    const perfis = analisarReceita(receita);

    if (perfis.length === 0) {
      secao.appendChild(criarElemento(
        "p",
        "",
        "Não identificamos características de sabor suficientes na descrição e nos ingredientes desta receita para sugerir uma harmonização confiável."
      ));

      return secao;
    }

    secao.appendChild(criarElemento(
      "p",
      "pairing-profile",
      "Perfil identificado: " +
      perfis.join(", ") + "."
    ));

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

    secao.appendChild(criarIndicacaoBebida(
      alcoolica,
      "Sugestão alcoólica"
    ));

    secao.appendChild(criarIndicacaoBebida(
      semAlcool,
      "Alternativa sem álcool"
    ));

    return secao;
  }

  // =====================================================
  // CARTÃO DA RECEITA
  // =====================================================

  function criarCartao(receita, bebidas) {
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
      ingredientes.appendChild(
        criarElemento(
          "li",
          "",
          typeof item === "string"
            ? item
            : JSON.stringify(item)
        )
      );
    });

    corpo.appendChild(ingredientes);

    corpo.appendChild(criarElemento(
      "h3",
      "",
      "Modo de preparo"
    ));

    const preparo = document.createElement("ol");

    receita.preparo.forEach(etapa => {
      preparo.appendChild(
        criarElemento(
          "li",
          "",
          typeof etapa === "string"
            ? etapa
            : JSON.stringify(etapa)
        )
      );
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

    // HARMONIZAÇÃO AUTOMÁTICA
    conteudo.appendChild(
      criarHarmonizacaoAutomatica(receita, bebidas)
    );

    // AVISO DE SEGURANÇA
    conteudo.appendChild(criarElemento(
      "p",
      "recipe-meta",
      "Importante: confira os ingredientes, a embalagem e as condições de preparo diretamente com o estabelecimento antes de consumir."
    ));

    cartao.appendChild(conteudo);

    return cartao;
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

    // As consultas são independentes:
    // uma falha no catálogo de bebidas não impede
    // a exibição das receitas.

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

    encontrados.forEach(receita => {
      const cartao = criarCartao(
        receita,
        erroCatalogoBebidas ? [] : bebidas
      );

      if (erroCatalogoBebidas) {
        const aviso = criarElemento(
          "p",
          "",
          "Não foi possível consultar o catálogo de bebidas neste momento. A harmonização automática está temporariamente indisponível."
        );

        const secao = cartao.querySelector(
          ".automatic-pairing"
        );

        if (secao) {
          secao.replaceChildren(
            criarElemento("h3", "", "Harmonização automática"),
            aviso
          );
        }
      }

      resultados.appendChild(cartao);
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
