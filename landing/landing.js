// Landing de Lvlo: idioma, lista de espera y analítica.
(() => {
  "use strict";
  const CFG = self.LVLO_CONFIG || {};
  const LANGS = {es: "Español", en: "English", fr: "Français", zh: "中文"};
  const T = {
    es: {
      title: "Lvlo · Tu vida, con niveles", eyebrow: "Hábitos · Tareas · Retos", h1: "Tu vida, con niveles.",
      lead: "Lvlo convierte tus hábitos y tareas en un juego. Cada cosa que completas sube uno de tus siete atributos y, al subir de nivel, se abren retos más exigentes.",
      cta: "Apúntate a la lista de espera", lvl: "Nivel 9", title2: "Explorador",
      a1: "Fuerza", a2: "Cultura", a3: "Inteligencia", a4: "Talento", a5: "Espíritu", toast: "¡Nivel 9!", toast2: "Nueva categoría: Viajes",
      f1h: "atributos que suben contigo", f1p: "Fuerza, Cultura, Inteligencia, Ambición, Talento, Carisma y Espíritu. Leer sube tu Cultura; entrenar, tu Fuerza.",
      f2h: "categorías que se desbloquean", f2p: "De salud y lectura a viajes y creatividad, con unos 190 retos en cuatro rangos: de «lee una página» a «publica un libro».",
      f3h: "reto del día", f3p: "Un reto diario con XP extra y un botón «Sorpréndeme» según el tiempo que tengas: 5 minutos, una tarde o un proyecto.",
      formH: "Sé de los primeros", formP: "Te avisaremos una sola vez cuando Lvlo esté disponible. Si quieres, también puedes probar la beta antes que nadie.",
      email: "Tu correo", beta: "Quiero probar la beta", platform: "¿En qué móvil?", other: "Otro",
      consent: "Acepto recibir correos sobre el lanzamiento y la", privacy: "política de privacidad", submit: "Avisadme",
      privacyF: "Privacidad", legal: "Aviso legal", delete: "Eliminar cuenta",
      ok: "¡Listo! Te avisaremos en cuanto Lvlo esté disponible.", okBeta: "¡Listo! Te escribiremos para invitarte a la beta.",
      dup: "Ese correo ya está en la lista. ¡Gracias!", badEmail: "Escribe un correo válido.", needConsent: "Marca la casilla de aceptación para continuar.",
      net: "No se pudo enviar. Inténtalo de nuevo en un momento.",
    },
    en: {
      title: "Lvlo · Level up your life", eyebrow: "Habits · Tasks · Challenges", h1: "Your life, with levels.",
      lead: "Lvlo turns your habits and tasks into a game. Everything you complete raises one of your seven attributes, and levelling up unlocks harder challenges.",
      cta: "Join the waiting list", lvl: "Level 9", title2: "Explorer",
      a1: "Strength", a2: "Culture", a3: "Intelligence", a4: "Talent", a5: "Spirit", toast: "Level 9!", toast2: "New category: Travel",
      f1h: "attributes that grow with you", f1p: "Strength, Culture, Intelligence, Ambition, Talent, Charisma and Spirit. Reading raises Culture; training raises Strength.",
      f2h: "categories to unlock", f2p: "From health and reading to travel and creativity, with around 190 challenges in four ranks: from “read one page” to “publish a book”.",
      f3h: "daily challenge", f3p: "A daily challenge with bonus XP, plus a “Surprise me” button for the time you have: 5 minutes, an afternoon or a project.",
      formH: "Be one of the first", formP: "We'll email you once when Lvlo is available. If you like, you can also try the beta before anyone else.",
      email: "Your email", beta: "I want to try the beta", platform: "Which phone?", other: "Other",
      consent: "I agree to receive emails about the launch and accept the", privacy: "privacy policy", submit: "Notify me",
      privacyF: "Privacy", legal: "Legal notice", delete: "Delete account",
      ok: "Done! We'll let you know as soon as Lvlo is available.", okBeta: "Done! We'll write to invite you to the beta.",
      dup: "That email is already on the list. Thank you!", badEmail: "Please enter a valid email.", needConsent: "Tick the consent box to continue.",
      net: "Couldn't send it. Please try again in a moment.",
    },
    fr: {
      title: "Lvlo · Ta vie, avec des niveaux", eyebrow: "Habitudes · Tâches · Défis", h1: "Ta vie, avec des niveaux.",
      lead: "Lvlo transforme tes habitudes et tes tâches en jeu. Chaque chose accomplie fait progresser l'un de tes sept attributs et, en montant de niveau, tu débloques des défis plus exigeants.",
      cta: "Rejoindre la liste d'attente", lvl: "Niveau 9", title2: "Explorateur",
      a1: "Force", a2: "Culture", a3: "Intelligence", a4: "Talent", a5: "Esprit", toast: "Niveau 9 !", toast2: "Nouvelle catégorie : Voyages",
      f1h: "attributs qui progressent avec toi", f1p: "Force, Culture, Intelligence, Ambition, Talent, Charisme et Esprit. Lire fait monter ta Culture ; t'entraîner, ta Force.",
      f2h: "catégories à débloquer", f2p: "De la santé et la lecture aux voyages et à la créativité, avec environ 190 défis en quatre rangs : de « lis une page » à « publie un livre ».",
      f3h: "défi du jour", f3p: "Un défi quotidien avec de l'XP en bonus et un bouton « Surprends-moi » selon ton temps : 5 minutes, un après-midi ou un projet.",
      formH: "Fais partie des premiers", formP: "Nous t'écrirons une seule fois quand Lvlo sera disponible. Si tu veux, tu peux aussi tester la bêta avant tout le monde.",
      email: "Ton adresse e-mail", beta: "Je veux tester la bêta", platform: "Quel téléphone ?", other: "Autre",
      consent: "J'accepte de recevoir des e-mails sur le lancement et la", privacy: "politique de confidentialité", submit: "Prévenez-moi",
      privacyF: "Confidentialité", legal: "Mentions légales", delete: "Supprimer le compte",
      ok: "C'est fait ! Nous te préviendrons dès que Lvlo sera disponible.", okBeta: "C'est fait ! Nous t'écrirons pour t'inviter à la bêta.",
      dup: "Cette adresse est déjà sur la liste. Merci !", badEmail: "Saisis une adresse e-mail valide.", needConsent: "Coche la case d'acceptation pour continuer.",
      net: "Envoi impossible. Réessaie dans un instant.",
    },
    zh: {
      title: "Lvlo · 让生活升级", eyebrow: "习惯 · 任务 · 挑战", h1: "让你的生活也能升级。",
      lead: "Lvlo 把你的习惯和任务变成一场游戏。每完成一件事，七项属性之一就会提升；等级越高，解锁的挑战越有难度。",
      cta: "加入候补名单", lvl: "9级", title2: "探索者",
      a1: "力量", a2: "文化", a3: "智力", a4: "才华", a5: "心灵", toast: "升到9级！", toast2: "新类别：旅行",
      f1h: "项属性与你一同成长", f1p: "力量、文化、智力、抱负、才华、魅力和心灵。阅读提升文化，锻炼提升力量。",
      f2h: "个可解锁的类别", f2p: "从健康、阅读到旅行、创意，约190个挑战分为四个阶段：从“读一页书”到“出版一本书”。",
      f3h: "每日挑战", f3p: "每天一个额外奖励经验的挑战，还有“给我惊喜”按钮，按你的空闲时间挑选：5分钟、一个下午或一个长期项目。",
      formH: "抢先体验", formP: "Lvlo 上线时我们只会给你发一封邮件。你也可以抢先参加测试版。",
      email: "你的邮箱", beta: "我想参加测试版", platform: "你用什么手机？", other: "其他",
      consent: "我同意接收关于上线的邮件，并接受", privacy: "隐私政策", submit: "通知我",
      privacyF: "隐私", legal: "法律声明", delete: "删除账户",
      ok: "完成！Lvlo 上线后我们会第一时间通知你。", okBeta: "完成！我们会发邮件邀请你参加测试版。",
      dup: "这个邮箱已在名单中，谢谢！", badEmail: "请输入有效的邮箱。", needConsent: "请勾选同意框后继续。",
      net: "发送失败，请稍后再试。",
    },
  };

  const KEY = "lvlo-lang";
  let lang = "es";
  try { const s = localStorage.getItem(KEY); if (s && T[s]) lang = s; else { const n = (navigator.language || "es").slice(0, 2); if (T[n]) lang = n; } } catch (e) {}

  function apply(l) {
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.documentElement.lang = l === "zh" ? "zh-CN" : l;
    document.title = T[l].title;
    document.querySelectorAll("[data-i]").forEach((el) => {
      const k = el.dataset.i === "title" ? "title2" : el.dataset.i;
      if (T[l][k] != null) el.textContent = T[l][k];
    });
    document.querySelectorAll("#langs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.l === l));
  }

  function track(name, data) { try { window.umami && window.umami.track(name, data); } catch (e) {} }

  window.addEventListener("DOMContentLoaded", () => {
    const langs = document.getElementById("langs");
    langs.innerHTML = Object.entries(LANGS).map(([k, v]) => `<button type="button" class="chip" data-l="${k}" lang="${k}">${v}</button>`).join("");
    langs.addEventListener("click", (e) => { const b = e.target.closest("[data-l]"); if (b) { apply(b.dataset.l); track("lang_change", {lang: b.dataset.l}); } });
    apply(lang);
    if (CFG.CONTACT_EMAIL) document.getElementById("contact").textContent = CFG.CONTACT_EMAIL;

    if (CFG.UMAMI_URL && CFG.UMAMI_LANDING_ID) {
      const s = document.createElement("script");
      s.defer = true; s.src = CFG.UMAMI_URL.replace(/\/$/, "") + "/script.js"; s.dataset.websiteId = CFG.UMAMI_LANDING_ID;
      document.head.appendChild(s);
    }

    const form = document.getElementById("wl"), msg = document.getElementById("wl-msg");
    const beta = document.getElementById("wl-beta"), platWrap = document.getElementById("wl-platform-wrap");
    if (/android/i.test(navigator.userAgent)) document.getElementById("wl-platform").value = "android";
    else if (/iphone|ipad/i.test(navigator.userAgent)) document.getElementById("wl-platform").value = "iphone";
    beta.addEventListener("change", () => { platWrap.hidden = !beta.checked; });
    const show = (k, ok) => { msg.hidden = false; msg.textContent = T[lang][k]; msg.className = "l-msg " + (ok ? "ok" : "err"); };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("wl-email").value.trim();
      const consent = document.getElementById("wl-consent").checked;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { show("badEmail"); return; }
      if (!consent) { show("needConsent"); return; }
      const body = {email, lang, consent: true, beta: beta.checked, source: new URLSearchParams(location.search).get("ref") || "landing"};
      if (beta.checked) body.platform = document.getElementById("wl-platform").value;
      const btn = form.querySelector("button"); btn.disabled = true;
      try {
        const res = await fetch(CFG.API_URL.replace(/\/$/, "") + "/api/collections/waitlist/records", {
          method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body),
        });
        if (res.ok) { form.reset(); platWrap.hidden = true; show(body.beta ? "okBeta" : "ok", true); track("waitlist_join", {beta: body.beta, lang}); }
        else {
          const data = await res.json().catch(() => ({}));
          if (data && data.data && data.data.email && data.data.email.code === "validation_not_unique") show("dup", true);
          else if (data && data.data && data.data.email) show("badEmail");
          else show("net");
        }
      } catch (err) { show("net"); }
      finally { btn.disabled = false; }
    });
  });
})();
