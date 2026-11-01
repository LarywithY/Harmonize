
const supabase = window.harmonizeSupabase;

async function iniciarPainel() {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    window.location.href = "login.html";
    return;
  }

  const { data: membro, error } = await supabase
    .from("team_members")
    .select("display_name, role")
    .eq("user_id", user.id)
    .single();

  if (error || !membro) {
    document.getElementById("boasVindas").textContent =
      "Acesso não autorizado";
    document.getElementById("mensagem").textContent =
      "Seu usuário não foi encontrado na equipe do Harmonize+.";
    document.getElementById("erro").textContent =
      "Entre em contato com a administração do projeto.";
    await supabase.auth.signOut();
    return;
  }

  const nomes = {
    admin: "Administradora",
    editor: "Editora",
    reviewer: "Revisora"
  };

  document.getElementById("boasVindas").textContent =
    `Olá, ${membro.display_name}!`;

  document.getElementById("papel").textContent =
    nomes[membro.role] || membro.role;

  document.getElementById("mensagem").textContent =
    "Seu acesso foi confirmado. A conexão com o banco de dados está funcionando.";
}

document.getElementById("sair").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

iniciarPainel();
