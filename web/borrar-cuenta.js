// Página pública de eliminación de cuenta (requisito de Google Play).
window.addEventListener("DOMContentLoaded", () => {
  const cfg = self.LVLO_CONFIG || {};
  const form = document.getElementById("del"), msg = document.getElementById("msg");
  if (cfg.CONTACT_EMAIL) document.getElementById("contact").textContent = cfg.CONTACT_EMAIL;
  const show = (text, ok) => { msg.hidden = false; msg.textContent = text; msg.className = ok ? "ok" : "err"; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cfg.API_URL || !window.PocketBase) { show("El servicio no está disponible ahora mismo. Escríbenos al correo de contacto."); return; }
    const pb = new window.PocketBase(cfg.API_URL);
    const btn = form.querySelector("button"); btn.disabled = true;
    try {
      await pb.collection("users").authWithPassword(document.getElementById("email").value, document.getElementById("pass").value);
      await pb.collection("users").delete(pb.authStore.record.id);
      pb.authStore.clear();
      form.reset(); form.querySelectorAll("input,button").forEach((el) => (el.disabled = true));
      show("Tu cuenta y tus datos se han eliminado.", true);
    } catch (err) {
      btn.disabled = false;
      show(err && err.status ? "El correo o la contraseña no son correctos." : "No hay conexión con el servidor. Inténtalo más tarde.");
    }
  });
});
