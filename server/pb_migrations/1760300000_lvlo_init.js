/// <reference path="../pb_data/types.d.ts" />
// Esquema inicial de Lvlo (PocketBase v0.40): partidas, comentarios y lista de espera.
// Se aplica solo al arrancar PocketBase. Para cambios futuros, crea un archivo nuevo con un número mayor.

migrate((app) => {
  // ---------- Ajustes generales ----------
  const settings = app.settings();
  settings.meta.appName = "Lvlo";
  const api = $os.getenv("API_DOMAIN");
  if (api) settings.meta.appURL = "https://" + api;
  settings.meta.senderName = "Lvlo";
  settings.meta.senderAddress = $os.getenv("MAIL_SENDER") || "no-reply@lvlo.app";
  // PocketBase está detrás de Caddy: así ve la IP real del usuario (necesario para limitar abusos)
  settings.trustedProxy.headers = ["X-Forwarded-For"];
  settings.rateLimits.enabled = true;
  app.save(settings);

  // ---------- Partidas guardadas: un registro por usuario ----------
  const saves = new Collection({
    type: "base",
    name: "saves",
    listRule:   "user = @request.auth.id",
    viewRule:   "user = @request.auth.id",
    createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
    updateRule: "user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)",
    deleteRule: "user = @request.auth.id",
    fields: [
      { name: "user", type: "relation", required: true, maxSelect: 1, cascadeDelete: true, collectionId: "_pb_users_auth_" },
      { name: "data", type: "json", maxSize: 2000000 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_saves_user ON saves (user)"],
  });
  app.save(saves);

  // ---------- Comentarios enviados desde la app ----------
  // Cualquiera puede enviar; solo tú (superusuario) puedes leerlos desde el panel.
  const feedback = new Collection({
    type: "base",
    name: "feedback",
    listRule: null,
    viewRule: null,
    createRule: "@request.body.status:isset = false && @request.body.note:isset = false && (@request.body.user:isset = false || @request.body.user = @request.auth.id)",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "user", type: "relation", required: false, maxSelect: 1, cascadeDelete: false, collectionId: "_pb_users_auth_" },
      { name: "kind", type: "select", required: true, maxSelect: 1, values: ["idea", "bug", "otro"] },
      { name: "rating", type: "number", min: 0, max: 5, onlyInt: true },
      { name: "message", type: "text", required: true, min: 3, max: 2000 },
      { name: "lang", type: "text", max: 8 },
      { name: "version", type: "text", max: 20 },
      { name: "platform", type: "text", max: 40 },
      { name: "level", type: "number", min: 0, onlyInt: true },
      // Para tu gestión interna
      { name: "status", type: "select", maxSelect: 1, values: ["nuevo", "revisado", "planificado", "hecho", "descartado"] },
      { name: "note", type: "text", max: 2000 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
  app.save(feedback);

  // ---------- Lista de espera de la landing (lvlo.app) ----------
  // Cualquiera puede apuntarse; solo tú puedes ver la lista. Un correo solo puede estar una vez.
  const waitlist = new Collection({
    type: "base",
    name: "waitlist",
    listRule: null,
    viewRule: null,
    createRule: "@request.body.consent = true",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "email", type: "email", required: true },
      { name: "lang", type: "text", max: 8 },
      { name: "beta", type: "bool" },
      { name: "platform", type: "select", maxSelect: 1, values: ["android", "iphone", "otro"] },
      { name: "consent", type: "bool", required: true },
      { name: "source", type: "text", max: 60 },
      { name: "created", type: "autodate", onCreate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_waitlist_email ON waitlist (email COLLATE NOCASE)"],
  });
  app.save(waitlist);
}, (app) => {
  for (const name of ["waitlist", "feedback", "saves"]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
  }
});
