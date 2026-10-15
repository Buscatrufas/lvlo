// Configuración de Lvlo. Este es el único archivo que necesitas tocar en cada despliegue.
self.LVLO_CONFIG = {
  // Sube este número en cada versión: fuerza la actualización de la app en web y Android.
  VERSION: "1.0.0",

  // Dirección de tu API (PocketBase). Déjalo vacío para que la app funcione solo en local.
  API_URL: "https://api.lvlo.app",

  // Web pública (landing con lista de espera)
  SITE_URL: "https://lvlo.app",
  APP_URL: "https://app.lvlo.app",

  // Analítica Umami (opcional). Deja vacío UMAMI_URL para desactivarla.
  // Crea dos «websites» en Umami: uno para app.lvlo.app y otro para lvlo.app.
  UMAMI_URL: "https://stats.lvlo.app",
  UMAMI_WEBSITE_ID: "",
  UMAMI_LANDING_ID: "",

  // Páginas legales y contacto
  PRIVACY_URL: "https://lvlo.app/privacidad.html",
  LEGAL_URL: "https://lvlo.app/aviso-legal.html",
  CONTACT_EMAIL: "hola@lvlo.app",

  // Novedades que se muestran una vez tras cada actualización (la más reciente primero)
  CHANGELOG: [
    { version: "1.0.0", es: "Primera versión pública.", en: "First public release.", fr: "Première version publique.", zh: "首个公开版本。" },
  ],
};
