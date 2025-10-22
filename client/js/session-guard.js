async function me() {
  const res = await fetch("/api/session/me");
  if (!res.ok) {
    window.location.href = "/login.html";
    return null;
  }
  return res.json();
}

(async () => {
  const u = await me();
  if (!u) return;
  // Pinta nombre/rol si existen los spans
  const n = document.getElementById("nombre");
  const r = document.getElementById("rol");
  if (n) n.textContent = u.nombre;
  if (r) r.textContent = u.rol;

  // Hook logout
  const btn = document.getElementById("logout");
  if (btn) {
    btn.addEventListener("click", async () => {
      await fetch("/api/session/logout", { method: "POST" });
      window.location.href = "/login.html";
    });
  }
})();
