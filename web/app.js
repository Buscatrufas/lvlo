(() => {
"use strict";
/* ================= Idioma ================= */
const LANG_KEY = "lvlo-lang";
function detectLang(){
  try{ const s = localStorage.getItem(LANG_KEY); if (s && I18N[s]) return s; }catch(e){}
  const n = (navigator.language || "es").slice(0,2).toLowerCase();
  return I18N[n] ? n : "es";
}
let lang = detectLang();
const L = () => I18N[lang];
function t(k, v){
  let s = L().s[k] ?? I18N.es.s[k] ?? k;
  if (v) Object.keys(v).forEach(x => { s = s.split("{"+x+"}").join(v[x]); });
  return s;
}
function setLang(l, fromRemote){
  if (!I18N[l]) return;
  lang = l;
  try{ localStorage.setItem(LANG_KEY, l); }catch(e){}
  document.documentElement.lang = l === "zh" ? "zh-CN" : l;
  if (!fromRemote) track("lang_change", {lang:l});
  if (state && !fromRemote && state.lang !== l){ state.lang = l; commit(); } else render();
}

/* ================= Modelo ================= */
const ATTR_KEYS = ["fuerza","cultura","inteligencia","ambicion","talento","carisma","espiritu"];
const aName = a => L().attrs[a];

// Cada categoría reparte su XP: 70 % al atributo principal, 30 % al secundario. unlock = nivel de personaje.
const CATS = {
  salud:{a:["fuerza","espiritu"],unlock:1}, mental:{a:["espiritu","inteligencia"],unlock:1}, lectura:{a:["cultura","inteligencia"],unlock:1},
  social:{a:["carisma","cultura"],unlock:1}, hogar:{a:["ambicion","talento"],unlock:1}, cocina:{a:["fuerza","talento"],unlock:2},
  carrera:{a:["ambicion","inteligencia"],unlock:3}, escuela:{a:["inteligencia","cultura"],unlock:4}, aire:{a:["fuerza","espiritu"],unlock:5},
  arte:{a:["talento","cultura"],unlock:6}, humanidad:{a:["carisma","espiritu"],unlock:7}, diversion:{a:["talento","carisma"],unlock:8}, viajes:{a:["cultura","carisma"],unlock:9},
};
const CAT_KEYS = Object.keys(CATS);
const cName = c => L().cats[c];
const catColor = c => `var(--a-${CATS[c].a[0]})`;

const DIFF = {facil:{xp:10,unlock:1}, media:{xp:25,unlock:3}, dificil:{xp:50,unlock:6}, epica:{xp:100,unlock:10}};
const DIFF_KEYS = Object.keys(DIFF);
const dName = d => L().diff[d];
const TIERS = [{key:"facil",min:1,xp:15},{key:"media",min:3,xp:40},{key:"dificil",min:6,xp:80},{key:"epica",min:10,xp:150}];
const tierName = i => L().tiers[i];
const timeName = k => L().time[k];

// Retos en español con su duración: 5 = minutos, 30 = media hora, t = una tarde, p = proyecto de días o semanas.
// Los textos en otros idiomas están en QT con el mismo orden.
const Q = {
  salud:[[["Levántate sin posponer la alarma","5"],["Haz 20 sentadillas seguidas","5"],["Camina 8.000 pasos hoy","30"],["Estira 10 minutos al despertar","30"],["Bebe 2 litros de agua en el día","5"]],[["Corre 5 km sin parar","30"],["Entrena fuerza 3 días esta semana","p"],["Prueba un deporte nuevo: pádel, natación, escalada…","t"],["Aguanta una plancha de 1 minuto","5"]],[["Haz 10 dominadas seguidas","5"],["Completa una carrera de 10 km","t"],["Aprende a hacer el pino apoyado en la pared","p"],["Juega una liga o un torneo amateur","p"]],[["Haz el pino libre durante 30 segundos","p"],["Consigue tu primer muscle-up","p"],["Termina una media maratón o un triatlón sprint","p"]]],
  mental:[[["Haz algo que te relaje durante 15 minutos","30"],["Medita 5 minutos","5"],["Escribe tres cosas por las que estés agradecido","5"],["Pasa 30 minutos sin pantallas antes de dormir","30"],["Pide cita con un profesional de salud mental si sientes que lo necesitas","30"]],[["Escribe un diario 7 días seguidos","p"],["Pasa un día entero sin redes sociales","p"],["Duerme 7 horas o más 5 noches seguidas","p"],["Aprende una técnica de respiración y úsala","30"]],[["Medita 20 días en un mes","p"],["Haz un curso de mindfulness o gestión del estrés","p"],["Haz una revisión de tu año: qué funcionó y qué cambiar","t"]],[["Asiste a un retiro de meditación","p"],["Llega a 100 días seguidos con tu hábito de calma","p"],["Revisa tus valores y escribe tu plan de vida","p"]]],
  lectura:[[["Lee una página de un libro","5"],["Lee 20 páginas","30"],["Escucha un capítulo de un audiolibro","30"],["Visita una librería o una biblioteca","t"]],[["Termina un libro","p"],["Lee todos los días durante 30 días","p"],["Únete a un club de lectura","t"],["Lee un libro de un género que nunca lees","p"]],[["Lee 12 libros en un año","p"],["Lee un clásico de más de 500 páginas","p"],["Escribe la reseña de 5 libros que hayas leído","p"]],[["Lee 50 libros en un año","p"],["Completa 10 títulos de la colección de clásicos","p"],["Lee un libro entero en otro idioma","p"]]],
  social:[[["Envía una felicitación de cumpleaños","5"],["Escribe a un amigo con el que no hablas hace tiempo","5"],["Da las gracias a alguien por algo concreto","5"],["Llama a un familiar sin un motivo concreto","30"]],[["Organiza un plan con amigos","t"],["Escribe a un amigo que vive en otro país","30"],["Conoce a alguien nuevo y mantén la conversación","t"],["Envía una carta escrita a mano","30"]],[["Organiza una comida o cena en casa","t"],["Ten una conversación difícil que estabas evitando","30"],["Únete a un grupo o club nuevo","p"]],[["Visita a un amigo que vive en otro país","p"],["Habla en público ante un grupo grande","t"],["Organiza un reencuentro de antiguos compañeros","p"]]],
  hogar:[[["Cambia una bombilla por una de bajo consumo","5"],["Ordena un cajón","5"],["Haz la cama nada más levantarte","5"],["Riega y cuida tus plantas","5"]],[["Limpia a fondo una habitación","t"],["Arregla algo que lleva tiempo roto","t"],["Cuelga un cuadro o una estantería tú mismo","t"],["Vacía y reorganiza un armario","t"]],[["Pinta una habitación","p"],["Monta un huerto urbano o un jardín vertical","p"],["Cambia una lámpara o un enchufe con la corriente cortada","t"],["Automatiza algo de tu casa: luces, persianas, riego","p"]],[["Reforma una estancia completa","p"],["Construye un mueble desde cero","p"],["Consigue tu propia casa y múdate","p"]]],
  cocina:[[["Cambia la comida basura por un aperitivo saludable","5"],["Come 5 raciones de fruta y verdura hoy","30"],["Prepárate la comida de mañana","30"],["Cocina una receta nueva","t"]],[["Una semana sin refrescos ni bollería","p"],["Cocina un plato típico de otro país","t"],["Haz pan casero","t"],["Planifica el menú semanal y compra con lista","30"]],[["Come vegetariano durante una semana","p"],["Cocina una cena para 6 personas","t"],["Aprende a hacer pasta fresca o sushi","t"]],[["Come vegetariano durante un mes","p"],["Haz un curso de cocina","p"],["Crea tu recetario con 20 recetas probadas","p"]]],
  carrera:[[["Actualiza y mejora tu CV","30"],["Apunta todos tus gastos de hoy","5"],["Mejora tu perfil profesional en LinkedIn","30"],["Revisa tus suscripciones y cancela una que no uses","30"]],[["Haz un presupuesto mensual y cúmplelo","p"],["Pide feedback sincero a tu responsable o a un compañero","30"],["Ahorra el 10 % de tus ingresos este mes","p"],["Aprende una habilidad muy demandada en tu sector","p"]],[["Consigue una certificación profesional","p"],["Negocia una mejora de salario o condiciones","t"],["Reúne un fondo de emergencia de 3 meses de gastos","p"],["Da una charla en un evento profesional","t"]],[["Empieza tu propio negocio","p"],["Consigue el puesto que buscas","p"],["Diseña un plan de inversión a largo plazo y síguelo un año","p"]]],
  escuela:[[["Ve un documental","t"],["Aprende 10 palabras en otro idioma","30"],["Ve una charla y anota la idea principal","30"],["Investiga una duda hasta resolverla","30"]],[["Completa un curso online corto","p"],["Estudia 30 minutos 5 días seguidos","p"],["Aprende lo básico de una herramienta nueva","t"],["Asiste a un taller presencial","t"]],[["Consigue un certificado oficial de idioma","p"],["Completa un curso universitario online","p"],["Escribe un artículo explicando algo que has aprendido","t"]],[["Gradúate en una carrera o un máster","p"],["Empieza un doctorado","p"],["Alcanza el nivel C1 en un idioma","p"]]],
  aire:[[["Pasa 30 minutos al aire libre","30"],["Come o desayuna en un parque","30"],["Sal a caminar sin el móvil","30"],["Mira un amanecer o un atardecer","30"]],[["Haz una ruta de senderismo de 10 km","t"],["Pasa una noche de acampada","p"],["Aprende a orientarte con mapa y brújula","t"],["Haz una ruta larga en bicicleta","t"]],[["Sube a un pico de más de 2.000 metros","p"],["Haz un curso de escalada","p"],["Haz una travesía de varios días","p"]],[["Escala una montaña técnica con guía","p"],["Completa el Camino de Santiago","p"],["Sube a un pico de más de 3.000 metros","p"]]],
  arte:[[["Dibuja algo, aunque sea un boceto rápido","30"],["Descubre un grupo de música nuevo y escucha un disco entero","t"],["Visita una galería o un museo de arte","t"],["Fotografía un detalle de arquitectura interesante","30"],["Escribe un poema corto","30"]],[["Dibuja algo cada semana durante un mes","p"],["Aprende a tocar una canción completa","p"],["Ve un concierto en directo","t"],["Escribe un relato de 1.000 palabras","t"]],[["Completa una serie fotográfica de 20 imágenes","p"],["Publica o expón tu obra","t"],["Toca en público, aunque sea en una jam","t"],["Escribe un poemario de 20 poemas","p"]],[["Da un concierto en un local","p"],["Vende tus propias fotografías u obras","p"],["Publica un libro","p"]]],
  humanidad:[[["Ofrece ayuda a alguien que la necesite","5"],["Dona ropa que ya no uses","30"],["Deja una reseña útil a un pequeño negocio","5"],["Recoge basura durante tu paseo","30"]],[["Dona sangre","t"],["Haz voluntariado una tarde","t"],["Colabora cada mes con una causa","30"],["Enseña algo que sabes a quien lo necesite","t"]],[["Haz voluntariado cada semana durante un mes","p"],["Inscríbete como donante de médula","t"],["Organiza una recogida de alimentos","p"]],[["Organiza un evento para recaudar fondos para una causa","p"],["Lidera un proyecto de voluntariado","p"],["Crea una iniciativa solidaria en tu barrio","p"]]],
  diversion:[[["Sal a observar las estrellas","t"],["Juega a un juego de mesa con alguien","t"],["Haz un crucigrama o un puzle","30"],["Ve una película clásica que no hayas visto","t"]],[["Aprende un truco de magia","30"],["Monta una noche de juegos con amigos","t"],["Prueba un escape room","t"],["Aprende a hacer malabares con 3 pelotas","p"]],[["Programa un juego sencillo","p"],["Participa en un concurso de preguntas","t"],["Monta una maqueta o un kit de electrónica","p"]],[["Diseña y publica tu propio videojuego","p"],["Crea un juego de mesa y pruébalo con amigos","p"],["Organiza un evento temático para 20 personas","p"]]],
  viajes:[[["Visita un rincón de tu ciudad que no conozcas","t"],["Prueba un restaurante de una cocina que no conozcas","t"],["Haz de turista en tu propia ciudad","t"],["Visita un museo local","t"]],[["Haz una escapada de fin de semana a un sitio nuevo","p"],["Visita una región en la que nunca hayas estado","p"],["Viaja en tren por el placer del viaje","t"],["Aprende 20 frases del idioma de tu próximo destino","30"]],[["Viaja a un país nuevo","p"],["Haz un viaje en solitario","p"],["Visita otro continente","p"]],[["Vive un mes en otro país","p"],["Múdate a otro país","p"],["Visita las 7 maravillas del mundo moderno","p"]]],
};
const qText = (c, ti, qi) => lang === "es" ? Q[c][ti][qi][0] : (QT[lang]?.[c]?.[ti]?.[qi] || Q[c][ti][qi][0]);

const COLLECTIONS = {
  lectura:{xp:30, size:() => L().books.length,  title:i => L().books[i],  sub:i => L().authors[i]},
  viajes: {xp:60, size:() => L().places.length, title:i => L().places[i], sub:i => L().countries[i]},
};

/* ================= Avatar ================= */
const AV = {
  skin:  {sw:true, opts:[["#F5D3B3"],["#E9B48A"],["#C98E62"],["#A0673F"],["#6E4426"],["#4A2E1A"]]},
  hair:  {opts:[["corto"],["largo"],["rizado"],["mono"],["rapado"],["calvo"],["cresta",6]]},
  hairC: {sw:true, opts:[["#1E1A18"],["#4A2F1E"],["#8A5A2B"],["#C99A4E"],["#E3C27A"],["#A33B2B"],["#9A9A9A"],["#3B6BD0",5],["#C0489A",5],["#2FA37A",8]]},
  eyes:  {opts:[["normal"],["feliz"],["serio"],["guino",3]]},
  beard: {opts:[["no"],["barba"],["corta"],["bigote"],["perilla"]]},
  outfit:{opts:[["camiseta"],["sudadera"],["camisa"],["chaqueta",3],["armadura",8],["gala",12]]},
  outC:  {sw:true, opts:[["#3A6FD8"],["#D1493F"],["#2E8B57"],["#2B2F3A"],["#E6E2DA"],["#D88A12"],["#7A5AC8",4],["#C2408A",4]]},
  acc:   {opts:[["no"],["gafas"],["sol",2],["gorra",3],["cascos",4],["corona",15]]},
  bg:    {sw:true, opts:[["#BFD3F2"],["#F2D2BF"],["#C9E8D5"],["#E3D3F2"],["#F5E6A8"],["#2B3245"],["#F2B8C6",6],["#9BE0E0",6]]},
  frame: {opts:[["no"],["bronce"],["plata",5],["oro",10],["diamante",20]]},
};
const AV_DEFAULT = {skin:"#E9B48A", hair:"corto", hairC:"#4A2F1E", eyes:"normal", beard:"no", outfit:"camiseta", outC:"#3A6FD8", acc:"no", bg:"#BFD3F2", frame:"bronce"};
const FRAMES = {bronce:"#B07040", plata:"#B8C0CC", oro:"#E2B23A", diamante:"#7FD8F0"};

function shade(hex, f){
  const n = parseInt(hex.slice(1),16); const r=n>>16, g=(n>>8)&255, b=n&255;
  const m = v => Math.max(0, Math.min(255, Math.round(f<0 ? v*(1+f) : v+(255-v)*f)));
  return "#" + [m(r),m(g),m(b)].map(v => v.toString(16).padStart(2,"0")).join("");
}

function avatarSVG(a, sfx){
  a = Object.assign({}, AV_DEFAULT, a || {});
  const id = "clip" + (sfx || "x");
  const skin = a.skin, sd = shade(skin,-.18), hc = a.hairC;
  const oc = a.outfit === "armadura" ? "#9AA4B2" : a.outfit === "gala" ? "#20242E" : a.outC, od = shade(oc,-.25);
  let back = "", front = "", body = "", face = "", acc = "";
  if (a.hair === "largo") back = `<path d="M33 54 C30 22 47 17 60 17 C75 17 91 23 87 54 L91 98 C82 101 74 99 71 95 L73 62 L47 62 L49 95 C46 99 38 101 29 98 Z" fill="${hc}"/>`;
  if (a.hair === "rizado") back = [[38,40,12],[48,28,12],[60,24,13],[72,28,12],[82,40,12],[35,56,9],[85,56,9]].map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="${hc}"/>`).join("");
  if (a.hair === "mono") back = `<circle cx="60" cy="19" r="10" fill="${hc}"/>`;
  body = `<path d="M16 122 C16 99 36 88 60 88 C84 88 104 99 104 122 Z" fill="${oc}"/>`;
  const neck = `<rect x="52" y="70" width="16" height="22" rx="4" fill="${sd}"/>`;
  if (a.outfit === "camiseta") body += `<path d="M48 89 Q60 99 72 89" fill="none" stroke="${od}" stroke-width="3"/>`;
  if (a.outfit === "sudadera") body += `<path d="M40 92 Q60 108 80 92 L76 90 Q60 100 44 90 Z" fill="${od}"/><path d="M55 98 L54 112 M65 98 L66 112" stroke="#F2F2F2" stroke-width="2" stroke-linecap="round"/>`;
  if (a.outfit === "camisa") body += `<path d="M50 88 L60 100 L52 104 Z M70 88 L60 100 L68 104 Z" fill="#F4F4F4"/><circle cx="60" cy="108" r="1.6" fill="${od}"/><circle cx="60" cy="116" r="1.6" fill="${od}"/>`;
  if (a.outfit === "chaqueta") body += `<path d="M50 89 L60 122 L70 89 Z" fill="#F4F4F4"/><path d="M48 89 L58 112 L50 122 L40 92 Z M72 89 L62 112 L70 122 L80 92 Z" fill="${od}"/>`;
  if (a.outfit === "armadura") body += `<ellipse cx="28" cy="102" rx="13" ry="9" fill="#C3CAD4"/><ellipse cx="92" cy="102" rx="13" ry="9" fill="#C3CAD4"/><path d="M44 96 Q60 104 76 96 M42 108 Q60 116 78 108" fill="none" stroke="#6B7584" stroke-width="2"/><circle cx="60" cy="112" r="4" fill="#E2B23A"/>`;
  if (a.outfit === "gala") body += `<path d="M51 89 L60 122 L69 89 Z" fill="#F7F7F7"/><path d="M53 95 L60 99 L53 103 Z M67 95 L60 99 L67 103 Z" fill="#C2412D"/><circle cx="60" cy="99" r="2" fill="#8E2C1F"/>`;
  const head = `<circle cx="38" cy="56" r="5" fill="${sd}"/><circle cx="82" cy="56" r="5" fill="${sd}"/><ellipse cx="60" cy="52" rx="22" ry="25" fill="${skin}"/>`;
  const top = `M37 50 C36 27 48 22 60 22 C73 22 85 28 83 50 C80 39 72 34 60 34 C49 34 41 39 37 50 Z`;
  if (a.hair === "corto" || a.hair === "largo" || a.hair === "mono") front = `<path d="${top}" fill="${hc}"/>`;
  if (a.hair === "rapado") front = `<path d="${top}" fill="${hc}" opacity=".55"/>`;
  if (a.hair === "rizado") front = [[44,32,8],[54,27,8],[66,27,8],[76,32,8]].map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="${hc}"/>`).join("");
  if (a.hair === "cresta") front = `<path d="M52 34 L55 10 L60 30 L64 8 L67 32 L72 14 L70 36 Z" fill="${hc}"/><path d="${top}" fill="${hc}" opacity=".35"/>`;
  const brow = a.hair === "calvo" ? shade(skin,-.45) : hc, eyeC = "#1B1E26";
  face += `<path d="M46 46 L56 45 M64 45 L74 46" stroke="${brow}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (a.eyes === "normal") face += `<circle cx="51" cy="54" r="2.8" fill="${eyeC}"/><circle cx="69" cy="54" r="2.8" fill="${eyeC}"/>`;
  if (a.eyes === "feliz") face += `<path d="M47 55 Q51 50 55 55 M65 55 Q69 50 73 55" fill="none" stroke="${eyeC}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (a.eyes === "serio") face += `<path d="M47 54 L55 54 M65 54 L73 54" stroke="${eyeC}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (a.eyes === "guino") face += `<circle cx="51" cy="54" r="2.8" fill="${eyeC}"/><path d="M65 55 Q69 51 73 55" fill="none" stroke="${eyeC}" stroke-width="2.4" stroke-linecap="round"/>`;
  face += `<path d="M59 57 Q57 62 60 63" fill="none" stroke="${sd}" stroke-width="1.8" stroke-linecap="round"/>`;
  if (a.beard === "barba") face += `<path d="M38 54 C40 78 50 82 60 82 C70 82 80 78 82 54 C79 68 72 71 60 71 C48 71 41 68 38 54 Z" fill="${hc}"/>`;
  if (a.beard === "corta") face += `<path d="M40 60 C43 76 51 79 60 79 C69 79 77 76 80 60 C76 70 70 72 60 72 C50 72 44 70 40 60 Z" fill="${hc}" opacity=".6"/>`;
  if (a.beard === "bigote" || a.beard === "barba") face += `<path d="M51 66 Q60 61 69 66 Q60 67 51 66 Z" fill="${hc}"/>`;
  if (a.beard === "perilla") face += `<path d="M55 73 Q60 80 65 73 Q60 75 55 73 Z" fill="${hc}"/><path d="M52 66 Q60 62 68 66 Q60 67 52 66 Z" fill="${hc}"/>`;
  face += `<path d="M54 68 Q60 73 66 68" fill="none" stroke="#7A3B2E" stroke-width="2.2" stroke-linecap="round"/>`;
  if (a.acc === "gafas") acc = `<g fill="none" stroke="#2A2E38" stroke-width="2"><circle cx="51" cy="54" r="6.5"/><circle cx="69" cy="54" r="6.5"/><path d="M57.5 54 L62.5 54 M44.5 53 L39 51 M75.5 53 L81 51"/></g>`;
  if (a.acc === "sol") acc = `<g><rect x="43" y="49" width="15" height="10" rx="4" fill="#15171C"/><rect x="62" y="49" width="15" height="10" rx="4" fill="#15171C"/><path d="M58 53 L62 53 M43 52 L38 50 M77 52 L82 50" stroke="#15171C" stroke-width="2"/></g>`;
  if (a.acc === "gorra") acc = `<path d="M36 44 C36 22 48 18 60 18 C72 18 84 22 84 44 Z" fill="${oc}"/><path d="M58 40 C70 36 86 38 96 44 C86 46 70 46 58 44 Z" fill="${od}"/><circle cx="60" cy="19" r="2.5" fill="${od}"/>`;
  if (a.acc === "cascos") acc = `<path d="M35 54 C33 18 87 18 85 54" fill="none" stroke="#2A2E38" stroke-width="4"/><rect x="29" y="47" width="10" height="17" rx="4" fill="#2A2E38"/><rect x="81" y="47" width="10" height="17" rx="4" fill="#2A2E38"/>`;
  if (a.acc === "corona") acc = `<path d="M42 30 L46 14 L54 24 L60 10 L66 24 L74 14 L78 30 Z" fill="#E2B23A" stroke="#A97F16" stroke-width="1.5"/><circle cx="60" cy="22" r="2.5" fill="#C2412D"/>`;
  const frame = a.frame !== "no" ? `<circle cx="60" cy="60" r="57" fill="none" stroke="${FRAMES[a.frame]}" stroke-width="5"/>${a.frame==="diamante"?`<circle cx="60" cy="60" r="52" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1"/>`:""}` : "";
  return `<svg viewBox="0 0 120 120" role="img" aria-label="${t("avatar")}"><defs><clipPath id="${id}"><circle cx="60" cy="60" r="56"/></clipPath></defs>
    <circle cx="60" cy="60" r="56" fill="${a.bg}"/><g clip-path="url(#${id})">${back}${body}${neck}${head}${front}${face}${acc}</g>${frame}</svg>`;
}

/* ================= Progresión ================= */
function levelFrom(xp, base, step){
  let lvl = 1, need = base, rest = Math.max(0, xp);
  while (rest >= need){ rest -= need; lvl++; need = base + step*(lvl-1); }
  return {lvl, into:rest, need};
}
const heroLevel = xp => levelFrom(xp, 80, 40);
const catLevel  = xp => levelFrom(xp, 40, 20);
const attrLevel = xp => levelFrom(xp, 50, 25);
const TITLE_LV = [1,4,8,12,16,20,30];
const titleFor = l => { let i = 0; TITLE_LV.forEach((v,k) => { if (l >= v) i = k; }); return L().titles[i]; };

/* ================= Fechas ================= */
const pad = n => String(n).padStart(2,"0");
const dkey = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today = () => dkey(new Date());
const addDays = (k, n) => { const [y,m,d] = k.split("-").map(Number); return dkey(new Date(y, m-1, d+n)); };
const fmtDate = k => { const [y,m,d] = k.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString(LOCALES[lang],{day:"numeric",month:"short"}); };
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
function hash(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ================= Estado ================= */
const LS_KEY = "lvlo-v1";
let state = null, tab = "hoy", questCat = "salud", pendingName = "";

function blankState(name){
  const cxp = {}, axp = {};
  CAT_KEYS.forEach(c => cxp[c] = 0); ATTR_KEYS.forEach(a => axp[a] = 0);
  return {v:2, lang, updatedAt:0, hero:{name, created:today(), avatar:{...AV_DEFAULT}}, cxp, axp, habits:[], tasks:[], goals:[], done:{}, coll:{}, daily:null, log:{}};
}
function starter(s){
  const d = today(), st = L().starter;
  s.habits.push(
    {id:uid(), title:st.h[0], cat:"salud",   diff:"facil", days:[], created:d},
    {id:uid(), title:st.h[1], cat:"lectura", diff:"facil", days:[], created:d},
    {id:uid(), title:st.h[2], cat:"mental",  diff:"facil", days:[], created:d},
  );
  s.tasks.push({id:uid(), title:st.t, cat:"social", diff:"facil", done:false, created:d});
  s.goals.push({id:uid(), title:st.g, cat:"salud", target:15, from:d, deadline:addDays(d,30), done:false});
}

// Pasa los datos de la primera versión (6 categorías antiguas) al sistema actual
function migrate(s){
  if (!s || s.v === 2) return s;
  const map = {salud:"salud", mente:"escuela", trabajo:"carrera", social:"social", bienestar:"mental", hogar:"hogar"};
  const n = blankState(s.hero?.name || "Héroe");
  n.hero.created = s.hero?.created || today();
  Object.entries(s.xp || {}).forEach(([old, x]) => { const c = map[old] || "salud"; n.cxp[c] += x; splitAttr(n, c, x); });
  const fix = o => ({...o, cat: map[o.cat] || o.cat});
  n.habits = (s.habits||[]).map(fix); n.tasks = (s.tasks||[]).map(fix); n.goals = (s.goals||[]).map(fix);
  Object.entries(s.log || {}).forEach(([d, day]) => { n.log[d] = {}; Object.entries(day).forEach(([old, e]) => { n.log[d][map[old]||old] = e; }); });
  n.updatedAt = Date.now();
  return n;
}
function splitAttr(s, cat, amt){
  const [p, q] = CATS[cat].a, a = Math.round(amt * 0.7);
  s.axp[p] = Math.max(0, (s.axp[p]||0) + a);
  s.axp[q] = Math.max(0, (s.axp[q]||0) + (amt - a));
}
function loadLocal(){ try{ const r = localStorage.getItem(LS_KEY); return r ? migrate(JSON.parse(r)) : null; }catch(e){ return null; } }
function saveLocal(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }

const totalXP = s => CAT_KEYS.reduce((a,c) => a + (s.cxp[c]||0), 0);
const heroLvl = () => heroLevel(totalXP(state)).lvl;
const isOpen = c => heroLvl() >= CATS[c].unlock;
const openCats = () => CAT_KEYS.filter(isOpen);
const cLvl = c => catLevel(state.cxp[c]||0).lvl;

function logXP(cat, amount, count){
  const d = today();
  const day = state.log[d] || (state.log[d] = {});
  const e = day[cat] || (day[cat] = {x:0, n:0});
  e.x += amount; e.n += count;
  if (e.x <= 0 && e.n <= 0) delete day[cat];
  const cutoff = addDays(d, -180);
  Object.keys(state.log).forEach(k => { if (k < cutoff) delete state.log[k]; });
}
function streak(days){
  const set = new Set(days); let k = today(), n = 0;
  if (!set.has(k)) k = addDays(k,-1);
  while (set.has(k)){ n++; k = addDays(k,-1); }
  return n;
}
const streakBonus = n => Math.min(Math.floor(n/7)*0.1, 0.5);

function gain(cat, amt, count, label){
  const bH = heroLvl(), bC = cLvl(cat), bOpen = openCats();
  state.cxp[cat] = Math.max(0, (state.cxp[cat]||0) + amt);
  splitAttr(state, cat, amt);
  logXP(cat, amt, count);
  if (amt <= 0) return;
  const aH = heroLvl(), aC = cLvl(cat);
  const newCats = openCats().filter(c => !bOpen.includes(c));
  if (aH > bH) track("level_up", {level:aH});
  if (aH > bH) toast(`<span class="lvlup">${t("lvlUp",{l:aH})}</span> ${newCats.length ? t("newCat",{c:newCats.map(cName).join(", ")}) : t("youAre",{t:titleFor(aH)})}`, 3200);
  else if (aC > bC) toast(`<span class="lvlup">${cName(cat)} ${aC}</span>${TIERS.some(x => x.min === aC) ? t("newRank") : ""}`, 2600);
  else { const [p,q] = CATS[cat].a; toast(`+${amt} XP${label ? " · " + label : ""} · ${aName(p)} ${t("and")} ${aName(q)}`, 1400); }
}
function commit(){ state.updatedAt = Date.now(); saveLocal(); render(); queueSync(); }

/* ================= Retos ================= */
const CH = [];
CAT_KEYS.forEach(c => Q[c].forEach((tier, ti) => tier.forEach(([, time], qi) => CH.push({id:`${c}-${ti}-${qi}`, cat:c, ti, qi, time, xp:TIERS[ti].xp}))));
const chById = id => CH.find(x => x.id === id);
const chText = ch => qText(ch.cat, ch.ti, ch.qi);
const available = ch => isOpen(ch.cat) && cLvl(ch.cat) >= TIERS[ch.ti].min && !state.done[ch.id];

function dailyChallenge(){
  const d = today();
  if (state.daily && state.daily.date === d) return state.daily;
  const pool = CH.filter(ch => available(ch) && ch.time !== "p");
  if (!pool.length) return null;
  const pick = pool[hash(d + state.hero.created + state.hero.name) % pool.length];
  return {date:d, id:pick.id, done:false};
}
function completeChallenge(id, isDaily){
  const ch = chById(id); if (!ch || state.done[id]) return;
  state.done[id] = today();
  let amt = ch.xp, label = "";
  const dc = dailyChallenge();
  if (isDaily || (dc && dc.id === id && !dc.done)){ amt = Math.round(ch.xp * 1.5); label = t("dailyLbl"); state.daily = {...dc, done:true}; }
  gain(ch.cat, amt, 1, label);
  commit();
}
function challengeToTask(id, asHabit){
  const ch = chById(id); if (!ch) return;
  const diff = TIERS[ch.ti].key, title = chText(ch);
  if (asHabit) state.habits.push({id:uid(), title, cat:ch.cat, diff, days:[], created:today()});
  else state.tasks.push({id:uid(), title, cat:ch.cat, diff, done:false, created:today(), from:id});
  toast(asHabit ? t("addedHabit") : t("addedTask"));
  commit();
}

/* ================= Acciones ================= */
function toggleHabit(id){
  const h = state.habits.find(x => x.id === id); if (!h) return;
  const d = today(), i = h.days.indexOf(d);
  if (i >= 0){ h.days.splice(i,1); gain(h.cat, -(h.lastGain || DIFF[h.diff].xp), -1); }
  else {
    const amt = Math.round(DIFF[h.diff].xp * (1 + streakBonus(streak(h.days.concat(d)))));
    h.days.push(d); h.lastGain = amt; h.days = h.days.filter(k => k >= addDays(d,-120));
    gain(h.cat, amt, 1);
  }
  commit();
}
function toggleTask(id){
  const tk = state.tasks.find(x => x.id === id); if (!tk) return;
  tk.done = !tk.done; tk.doneAt = tk.done ? today() : null;
  let amt = DIFF[tk.diff].xp;
  if (tk.from){ const ch = chById(tk.from); if (ch) amt = ch.xp; if (tk.done) state.done[tk.from] = today(); else delete state.done[tk.from]; }
  gain(tk.cat, tk.done ? amt : -amt, tk.done ? 1 : -1);
  commit();
}
function toggleColl(cat, idx){
  const key = `${cat}-${idx}`, xp = COLLECTIONS[cat].xp;
  if (state.coll[key]){ delete state.coll[key]; gain(cat, -xp, -1); }
  else { state.coll[key] = today(); gain(cat, xp, 1, L().coll[cat]); }
  commit();
}
function goalProgress(g){
  let n = 0;
  Object.keys(state.log).forEach(k => { if (k >= g.from && (!g.deadline || k <= g.deadline)) n += (state.log[k][g.cat]?.n || 0); });
  return Math.max(0, n);
}
function claimGoal(id){
  const g = state.goals.find(x => x.id === id); if (!g || g.done) return;
  g.done = true; g.doneAt = today();
  gain(g.cat, 30 + g.target * 5, 0, t("goalLbl"));
  commit();
}

/* ================= Servidor (PocketBase), analítica y sincronización ================= */
const CFG = self.LVLO_CONFIG || {};
const pb = (CFG.API_URL && window.PocketBase) ? new window.PocketBase(CFG.API_URL) : null;
if (pb) pb.autoCancellation(false);
const authed = () => !!(pb && pb.authStore.isValid && pb.authStore.record);
const myId = () => authed() ? pb.authStore.record.id : null;

// Analítica sin cookies (Umami). Solo eventos de uso, nunca textos que escribe el usuario.
function track(name, data){ try{ window.umami && window.umami.track(name, data); }catch(e){} }
if (CFG.UMAMI_URL && CFG.UMAMI_WEBSITE_ID){
  const s = document.createElement("script");
  s.defer = true; s.src = CFG.UMAMI_URL.replace(/\/$/, "") + "/script.js"; s.dataset.websiteId = CFG.UMAMI_WEBSITE_ID;
  document.head.appendChild(s);
}
function platform(){
  if (document.referrer.startsWith("android-app://")) return "android";
  if (window.matchMedia && matchMedia("(display-mode: standalone)").matches) return "pwa";
  return "web";
}

let saveRec = null, unsub = null, syncState = authed() ? "wait" : "local", syncTimer = null, writing = false, dirty = false;
function setSync(s){ syncState = s; const el = document.getElementById("sync"); if (el) el.outerHTML = syncChip(); }
function syncChip(){
  if (!pb) return `<span id="sync" class="sync"><i></i>${t("sync_local")}</span>`;
  const cls = {ok:"ok", wait:"wait", off:"off", local:""}[syncState];
  const tag = syncState === "local" ? "button" : "span";
  return `<${tag} id="sync" class="sync ${cls}" ${tag === "button" ? `data-act="auth" style="border:0"` : ""}><i></i>${t("sync_" + syncState)}</${tag}>`;
}
function queueSync(){ if (!authed()) return; dirty = true; setSync("wait"); clearTimeout(syncTimer); syncTimer = setTimeout(flush, 900); }

async function flush(){
  if (!authed() || writing || !dirty || !state) return;
  if (!navigator.onLine){ setSync("off"); return; }
  writing = true; dirty = false;
  try{
    state.owner = myId();
    const data = JSON.parse(JSON.stringify(state));
    if (saveRec) await pb.collection("saves").update(saveRec, {data});
    else { const r = await pb.collection("saves").create({user: myId(), data}); saveRec = r.id; subscribeSave(); }
    saveLocal();
    setSync(dirty ? "wait" : "ok");
  }catch(e){
    dirty = true;
    if (e && e.status === 401){ pb.authStore.clear(); setSync("local"); render(); }
    else if (e && e.status === 404){ saveRec = null; }
    else setSync("off");
  }finally{
    writing = false;
    if (dirty && authed()) syncTimer = setTimeout(flush, 5000);
  }
}

// Descarga la partida de la cuenta y decide qué copia gana (la más reciente)
async function pull(){
  if (!authed()) return;
  setSync("wait");
  try{
    await pb.collection("users").authRefresh();
    let rec = null;
    try{ rec = await pb.collection("saves").getFirstListItem(pb.filter("user = {:u}", {u: myId()})); }
    catch(e){ if (e.status !== 404) throw e; }
    if (rec){ saveRec = rec.id; subscribeSave(); }
    const remote = rec && rec.data && rec.data.hero ? migrate(rec.data) : null;
    // Copia local de esta cuenta: gana la más reciente.
    // Copia local sin cuenta: solo se sube si la cuenta aún no tiene partida (si la tiene, gana la cuenta
    // y la local se guarda aparte como respaldo). Una copia de OTRA cuenta nunca se sube.
    const mine = state && state.owner === myId();
    const anon = state && !state.owner;
    if (remote && mine && (state.updatedAt||0) >= (remote.updatedAt||0)){ dirty = true; await flush(); }
    else if (remote){
      if (anon){ try{ localStorage.setItem(LS_KEY + "-backup", JSON.stringify(state)); }catch(e){} }
      adopt(remote); setSync("ok");
    }
    else if (mine || anon){ dirty = true; await flush(); }
    else { state = null; saveLocal(); render(); setSync("ok"); }
  }catch(e){
    if (e && e.status === 401){ pb.authStore.clear(); setSync("local"); render(); }
    else setSync(navigator.onLine ? "off" : "off");
  }
}
function subscribeSave(){
  if (unsub || !saveRec) return;
  pb.collection("saves").subscribe(saveRec, ev => {
    if (ev.action === "delete"){ saveRec = null; return; }
    const r = ev.record && ev.record.data;
    if (r && r.hero && state && (r.updatedAt||0) > (state.updatedAt||0)) adopt(JSON.parse(JSON.stringify(r)));
  }).then(fn => { unsub = fn; }).catch(() => {});
}
function adopt(remote){
  state = migrate(remote); state.owner = myId(); saveLocal();
  if (state.lang && I18N[state.lang] && state.lang !== lang) setLang(state.lang, true); else render();
}
window.addEventListener("online", () => { if (dirty) flush(); else if (authed()) pull(); });
window.addEventListener("offline", () => { if (authed()) setSync("off"); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && authed() && !dirty) pull(); });

async function logout(){
  if (dirty) await flush();
  try{ if (unsub) unsub(); }catch(e){}
  unsub = null; saveRec = null;
  pb.authStore.clear();
  // Por privacidad, el dispositivo no conserva la partida de una cuenta cerrada
  state = null; try{ localStorage.removeItem(LS_KEY); }catch(e){}
  setSync("local"); tab = "hoy"; render(); toast(t("loggedOut"));
}
async function deleteAccount(){
  const id = myId(); if (!id) return;
  try{
    await pb.collection("users").delete(id);   // borra también su partida (borrado en cascada)
    try{ if (unsub) unsub(); }catch(e){}
    unsub = null; saveRec = null; pb.authStore.clear();
    if (state){ delete state.owner; saveLocal(); }
    track("account_deleted");
    setSync("local"); render(); toast(t("deleted"));
  }catch(e){ toast(t("netErr"), 3000); }
}
function exportData(){
  const payload = {app:"Lvlo", version:CFG.VERSION, exportedAt:new Date().toISOString(), account: authed() ? pb.authStore.record.email : null, data: state};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "lvlo-" + today() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- Hoja de inicio de sesión / registro ---------- */
function authSheet(startMode){
  if (!pb) return;
  let mode = startMode || "signup";
  const s = sheet(`<div class="auth" id="auth-box"></div>`, () => { const g = s.form.querySelector('[data-a="go"]'); if (g) g.click(); return false; });
  const box = s.form.querySelector("#auth-box");
  const draw = (msg, ok) => {
    box.innerHTML = `<h3>${t("authTitle")}</h3><p class="hint">${t("authSub")}</p>
      <label for="a-email">${t("email")}<input id="a-email" name="email" type="email" autocomplete="email" required></label>
      <label for="a-pass">${t("password")}<input id="a-pass" name="password" type="password" minlength="8" autocomplete="${mode==="signup"?"new-password":"current-password"}" required placeholder="${t("pwHint")}"></label>
      ${msg ? `<p class="${ok?"ok":"err"}" role="status">${msg}</p>` : ""}
      ${mode === "signup" ? `<p class="legal">${t("acceptPrivacy")} <a href="${CFG.PRIVACY_URL}" target="_blank" rel="noopener">${t("privacy")}</a>.</p>` : ""}
      <button type="button" class="btn" data-a="go">${mode === "signup" ? t("signup") : t("login")}</button>
      <button type="button" class="linkbtn" data-a="swap">${mode === "signup" ? t("haveAccount") : t("needAccount")}</button>
      ${mode === "login" ? `<button type="button" class="linkbtn" data-a="forgot">${t("forgot")}</button>` : ""}
      <div class="sheet-actions"><button type="button" class="btn ghost" data-close>${t("close")}</button></div>`;
  };
  const keep = () => [box.querySelector("#a-email").value, box.querySelector("#a-pass").value];
  const restore = ([e, p]) => { box.querySelector("#a-email").value = e; box.querySelector("#a-pass").value = p; };
  box.addEventListener("click", async e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const [email, pass] = keep();
    if (b.dataset.a === "swap"){ mode = mode === "signup" ? "login" : "signup"; draw(); restore([email, pass]); return; }
    if (b.dataset.a === "forgot"){
      if (!email){ box.querySelector("#a-email").focus(); return; }
      try{ await pb.collection("users").requestPasswordReset(email); }catch(err){}
      draw(t("resetSent"), true); restore([email, ""]); return;
    }
    if (!email){ box.querySelector("#a-email").focus(); return; }
    if (pass.length < 8){ draw(t("pwShort")); restore([email, pass]); return; }
    b.disabled = true;
    try{
      if (mode === "signup"){
        await pb.collection("users").create({email, password:pass, passwordConfirm:pass, emailVisibility:false});
        try{ await pb.collection("users").requestVerification(email); }catch(err){}
      }
      await pb.collection("users").authWithPassword(email, pass);
      track(mode);
      s.close();
      await pull();
      toast(mode === "signup" ? t("accSynced") : t("welcomeBack"), 2600);
      render();
    }catch(err){
      const msg = !err || !err.status ? t("netErr") : mode === "signup" ? t("signupErr") : t("authErr");
      draw(msg); restore([email, pass]);
    }
  });
  draw();
}

/* ---------- Comentarios ---------- */
function feedbackSheet(){
  let kind = "idea", rating = 0;
  const s = sheet(`<h3>${t("fbTitle")}</h3>
    <div class="chips" role="group" aria-label="${t("fbTitle")}" id="fb-kind">${[["idea",t("fbIdea")],["bug",t("fbBug")],["otro",t("fbOther")]].map(([k,l]) =>
      `<button type="button" class="chip" data-k="${k}" aria-pressed="${k===kind}">${l}</button>`).join("")}</div>
    <div><span class="hint">${t("fbRating")}</span><div class="stars" id="fb-stars">${[1,2,3,4,5].map(n =>
      `<button type="button" data-n="${n}" aria-pressed="false" aria-label="${t("stars",{n})}">★</button>`).join("")}</div></div>
    <label for="fb-msg">${t("fbMsg")}<textarea id="fb-msg" name="message" maxlength="2000" required placeholder="${t("fbPh")}"></textarea></label>
    <p class="err" id="fb-err" hidden style="color:var(--danger);font-size:13px;margin:0"></p>
    <div class="sheet-actions"><button type="button" class="btn ghost" data-close>${t("cancel")}</button><button type="submit" class="btn">${t("send")}</button></div>`,
  (fd) => {
    const message = String(fd.get("message") || "").trim(); if (message.length < 3) return false;
    const body = {kind, message, lang, version:CFG.VERSION, platform:platform(), level: state ? heroLvl() : 0};
    if (rating) body.rating = rating;
    if (authed()) body.user = myId();
    pb.collection("feedback").create(body)
      .then(() => { track("feedback_sent", {kind, rating}); toast(t("fbThanks"), 2400); })
      .catch(() => toast(t("fbErr"), 3000));
  });
  s.form.addEventListener("click", e => {
    const k = e.target.closest("[data-k]");
    if (k){ kind = k.dataset.k; s.form.querySelectorAll("[data-k]").forEach(b => b.setAttribute("aria-pressed", b === k)); }
    const st = e.target.closest("[data-n]");
    if (st){ rating = +st.dataset.n; s.form.querySelectorAll("[data-n]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.n <= rating)); }
  });
}

/* ---------- Novedades tras una actualización ---------- */
const SEEN_KEY = "lvlo-seen-version";
function newsText(entry){ return entry[lang] || entry.es || ""; }
function newsSheet(){
  const items = (CFG.CHANGELOG || []).slice(0, 5);
  sheet(`<h3>${t("whatsNew")}</h3><ul class="news">${items.map(e => `<li><b>${t("version",{v:esc(e.version)})}</b> · ${esc(newsText(e))}</li>`).join("")}</ul>
    <div class="sheet-actions"><button type="button" class="btn" data-close>${t("gotIt")}</button></div>`, () => false);
}
function maybeShowNews(){
  let seen = null; try{ seen = localStorage.getItem(SEEN_KEY); }catch(e){}
  try{ localStorage.setItem(SEEN_KEY, CFG.VERSION || ""); }catch(e){}
  if (seen && state && seen !== CFG.VERSION && (CFG.CHANGELOG||[]).length) newsSheet();
}

/* ================= Vistas ================= */
const $app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const catVar = c => `--cat:${catColor(c)}`;
const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>`;

function langPicker(){
  return `<div class="chips" role="group" aria-label="${t("langHead")}">${Object.entries(LANGS).map(([k,v]) =>
    `<button type="button" class="chip" data-act="lang" data-lang="${k}" aria-pressed="${k===lang}" lang="${k}">${v}</button>`).join("")}</div>`;
}

function render(){
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  if (!state || !state.hero?.name){ renderWelcome(); return; }
  const hx = heroLevel(totalXP(state));
  const views = {hoy:viewToday, retos:viewQuests, metas:viewGoals, personaje:viewStats, perfil:viewProfile};
  $app.innerHTML = `
  <header class="hero"><div class="wrap">
    <div class="hero-row">
      <div class="mini">${avatarSVG(state.hero.avatar, "h")}<b>${hx.lvl}</b></div>
      <div class="hero-name"><h1>${esc(state.hero.name)}</h1><p>${titleFor(hx.lvl)} · ${t("lvl",{l:hx.lvl})}</p></div>
      ${syncChip()}
    </div>
    <div class="bar" role="progressbar" aria-label="${t("xp")}" aria-valuemin="0" aria-valuemax="${hx.need}" aria-valuenow="${hx.into}"><span style="width:${(hx.into/hx.need*100).toFixed(1)}%"></span></div>
    <div class="xp-line"><span class="num">${hx.into} / ${hx.need} XP</span><span>${t("xpTo",{n:hx.need-hx.into, l:hx.lvl+1})}</span></div>
  </div></header>
  <div class="wrap page"><main>${views[tab]()}</main></div>
  ${navBar()}`;
}

function navBar(){
  const I = {
    hoy:'<path d="M4 6h16M4 12h16M4 18h10"/>',
    retos:'<path d="M5 3l14 9-14 9V3z"/>',
    metas:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    personaje:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    perfil:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  };
  return `<nav class="tabs" role="tablist">${Object.keys(I).map(k =>
    `<button role="tab" data-tab="${k}" aria-selected="${tab===k}"><svg viewBox="0 0 24 24">${I[k]}</svg>${t("tab_"+k)}</button>`).join("")}</nav>`;
}

function itemRow(kind, o, done, extra, xp){
  return `<div class="item ${done?"done":""}" style="${catVar(o.cat)}">
    <button class="check" data-act="${kind}" data-id="${o.id}" aria-label="${done?t("undo"):t("complete")}: ${esc(o.title)}">${CHECK}</button>
    <div style="min-width:0"><div class="t">${esc(o.title)}</div>
      <div class="meta"><span class="tag">${cName(o.cat)}</span><span>${dName(o.diff)}</span>${extra||""}</div></div>
    <div style="display:flex;align-items:center;gap:2px"><span class="xp-chip">+${xp || DIFF[o.diff].xp}</span>
      <button class="more" data-act="edit-${kind}" data-id="${o.id}" aria-label="${t("edit")}: ${esc(o.title)}">⋯</button></div>
  </div>`;
}

function viewToday(){
  const d = today();
  const dc = dailyChallenge();
  if (dc && (!state.daily || state.daily.date !== d)){ state.daily = dc; saveLocal(); }
  const ch = dc && chById(dc.id);
  const daily = ch ? `<div class="daily ${dc.done?"done":""}">
      <div class="quest-top"><span class="eyebrow">${t("daily")}</span><span class="time">${timeName(ch.time)}</span></div>
      <p>${esc(chText(ch))}</p>
      <div class="quest-top"><span class="locked">${cName(ch.cat)} · ${tierName(ch.ti)}</span>
        ${dc.done ? `<span class="locked">${t("doneToday")}</span>` : `<button class="btn gold small" data-act="daily" data-id="${ch.id}">${t("completeN",{n:Math.round(ch.xp*1.5)})}</button>`}</div>
    </div>` : "";
  const habits = state.habits.map(h => {
    const s = streak(h.days), b = streakBonus(s);
    const extra = s ? `<span>${t(s===1?"streak1":"streakN",{n:s})}${b?` · +${Math.round(b*100)} %`:""}</span>` : "";
    return itemRow("habit", h, h.days.includes(d), extra);
  }).join("");
  const tasks = state.tasks.filter(x => !x.done || x.doneAt === d).map(x => itemRow("task", x, x.done, "", x.from && chById(x.from) ? chById(x.from).xp : 0)).join("");
  const doneToday = state.habits.filter(h => h.days.includes(d)).length;
  const xpToday = Object.values(state.log[d] || {}).reduce((a,e) => a + e.x, 0);
  return `${daily}
  <button class="surprise" data-act="surprise"><div style="text-align:left"><b>${t("surprise")}</b><br><span>${t("surpriseSub")}</span></div><span class="dice" aria-hidden="true">?</span></button>
  <section class="sec">
    <div class="sec-head"><h2>${t("habitsHead",{a:doneToday,b:state.habits.length})}</h2><button class="link" data-act="new-habit">${t("addHabit")}</button></div>
    <div class="list">${habits || `<div class="empty">${t("habitsEmpty")}</div>`}</div>
  </section>
  <section class="sec">
    <div class="sec-head"><h2>${t("tasksHead")}</h2><button class="link" data-act="new-task">${t("addTask")}</button></div>
    <div class="list">${tasks || `<div class="empty">${t("tasksEmpty")}</div>`}</div>
  </section>
  <p class="hint">${t("todayHint",{n:`<b class="num">${xpToday}</b>`})}</p>`;
}

function viewQuests(){
  if (!isOpen(questCat)) questCat = openCats()[0];
  const c = questCat, l = cLvl(c), cx = catLevel(state.cxp[c]||0);
  const grid = CAT_KEYS.map(k => {
    const open = isOpen(k);
    return `<button class="cat-btn ${open?"":"lock"}" style="${catVar(k)}" data-act="qcat" data-cat="${k}" aria-pressed="${k===c}" ${open?"":"disabled"}>
      <b>${cName(k)}</b><small>${open ? `${t("Lvl",{l:cLvl(k)})} · ${aName(CATS[k].a[0])}` : t("opensAt",{l:CATS[k].unlock})}</small></button>`;
  }).join("");
  const tiers = TIERS.map((tr, ti) => {
    const open = l >= tr.min;
    const qs = Q[c][ti].map(([, time], qi) => {
      const id = `${c}-${ti}-${qi}`, done = state.done[id];
      const inTasks = state.tasks.some(x => x.from === id && !x.done);
      return `<div class="quest ${open?"":"off"}" style="${catVar(c)}">
        <div class="quest-top"><p>${esc(qText(c,ti,qi))}</p><span class="xp-chip">+${tr.xp}</span></div>
        <div class="quest-top"><span class="time">${timeName(time)}</span>
          ${done ? `<span class="locked">${t("completedOn",{d:fmtDate(done)})}</span>`
          : !open ? `<span class="locked">${t("needLevel",{l:tr.min, c:cName(c)})}</span>`
          : `<div class="btns">${inTasks ? `<span class="locked">${t("inTasks")}</span>` : `<button class="btn ghost small" data-act="to-task" data-id="${id}">${t("toTasks")}</button><button class="btn ghost small" data-act="to-habit" data-id="${id}">${t("asHabit")}</button>`}<button class="btn small" data-act="quest" data-id="${id}">${t("done")}</button></div>`}
        </div></div>`;
    }).join("");
    return `<section class="sec"><div class="sec-head"><h2>${tierName(ti)} · ${dName(tr.key)}</h2>${open?"":`<span class="locked">${t("Lvl",{l:tr.min})}</span>`}</div><div class="list">${qs}</div></section>`;
  }).join("");
  const col = COLLECTIONS[c];
  let coll = "";
  if (col){
    const size = col.size(); let n = 0;
    const items = [];
    for (let i = 0; i < size; i++){
      const dn = state.coll[`${c}-${i}`]; if (dn) n++;
      items.push(`<div class="coll-item ${dn?"done":""}" style="${catVar(c)}"><button class="check" data-act="coll" data-cat="${c}" data-i="${i}" aria-label="${esc(col.title(i))}">${CHECK}</button>
        <div><b>${esc(col.title(i))}</b><small>${esc(col.sub(i))}${dn ? " · " + fmtDate(dn) : ""}</small></div><span class="xp-chip">+${col.xp}</span></div>`);
    }
    coll = `<section class="sec"><div class="sec-head"><h2>${L().coll[c]}</h2><span class="locked num">${n}/${size}</span></div>
      <p class="hint">${t(c==="lectura"?"collRead":"collVisit",{n:col.xp})}</p><div class="coll">${items.join("")}</div></section>`;
  }
  return `<section class="sec"><div class="cat-grid">${grid}</div></section>
    <section class="sec" style="${catVar(c)}"><div class="sec-head"><h2>${cName(c)} · ${t("lvl",{l})}</h2><span class="locked num">${cx.into}/${cx.need} XP</span></div>
      <div class="bar"><span style="width:${(cx.into/cx.need*100).toFixed(1)}%;background:var(--cat)"></span></div>
      <p class="hint">${t("catHint",{a:aName(CATS[c].a[0]), b:aName(CATS[c].a[1])})}</p></section>
    ${tiers}${coll}`;
}

function viewGoals(){
  const d = today();
  const active = state.goals.filter(g => !g.done), done = state.goals.filter(g => g.done);
  const card = g => {
    const p = goalProgress(g), pct = Math.min(100, p / g.target * 100), reward = 30 + g.target*5;
    const late = !g.done && g.deadline && g.deadline < d;
    const action = g.done ? `<span class="locked">${t("achievedOn",{d:fmtDate(g.doneAt)})}</span>`
      : p >= g.target ? `<button class="btn gold small" data-act="claim" data-id="${g.id}">${t("claim",{n:reward})}</button>`
      : `<span class="locked">${late ? t("overdue") : g.deadline ? t("until",{d:fmtDate(g.deadline)}) : t("noDeadline")} · ${t("reward",{n:reward})}</span>`;
    return `<div class="goal" style="${catVar(g.cat)}">
      <div class="goal-top"><div style="min-width:0"><div class="t">${esc(g.title)}</div><div class="meta"><span class="tag">${cName(g.cat)}</span></div></div>
        <div style="display:flex;align-items:start;gap:2px"><span class="num" style="font-size:14px">${Math.min(p,g.target)}/${g.target}</span>
        <button class="more" data-act="edit-goal" data-id="${g.id}" aria-label="${t("editGoal")}">⋯</button></div></div>
      <div class="bar"><span style="width:${pct}%"></span></div><div>${action}</div></div>`;
  };
  return `<section class="sec"><div class="sec-head"><h2>${t("goalsHead")}</h2><button class="link" data-act="new-goal">${t("addGoal")}</button></div>
    <p class="hint">${t("goalsHint")}</p>
    <div class="list">${active.map(card).join("") || `<div class="empty">${t("goalsEmpty")}</div>`}</div></section>
    ${done.length ? `<section class="sec"><div class="sec-head"><h2>${t("goalsDone")}</h2></div><div class="list">${done.map(card).join("")}</div></section>` : ""}`;
}

function radar(){
  const lv = ATTR_KEYS.map(a => { const s = attrLevel(state.axp[a]||0); return s.lvl + s.into/s.need; });
  const max = Math.max(5, Math.ceil(Math.max(...lv)));
  const cx = 180, cy = 150, R = 100, n = ATTR_KEYS.length;
  const pt = (i, r) => { const a = -Math.PI/2 + i*2*Math.PI/n; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; };
  let rings = "";
  for (let k = 1; k <= 4; k++) rings += `<polygon points="${ATTR_KEYS.map((_,i)=>pt(i,R*k/4).join(",")).join(" ")}" fill="none" stroke="var(--line)"/>`;
  const axes = ATTR_KEYS.map((_,i) => { const [x,y] = pt(i,R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; }).join("");
  const poly = lv.map((v,i) => pt(i, R*v/max).join(",")).join(" ");
  const dots = lv.map((v,i) => { const [x,y] = pt(i,R*v/max); return `<circle cx="${x}" cy="${y}" r="4" fill="var(--a-${ATTR_KEYS[i]})"/>`; }).join("");
  const labels = ATTR_KEYS.map((a,i) => { const [x,y] = pt(i,R+18); const anchor = Math.abs(x-cx)<5?"middle":x>cx?"start":"end";
    return `<text x="${x}" y="${y+4}" text-anchor="${anchor}">${aName(a)} ${Math.floor(lv[i])}</text>`; }).join("");
  return `<svg class="radar" viewBox="0 0 360 290" role="img" aria-label="${t("radar")}">${rings}${axes}
    <polygon points="${poly}" fill="var(--xp)" fill-opacity=".22" stroke="var(--xp)" stroke-width="2"/>${dots}${labels}</svg>`;
}

function viewStats(){
  const hx = heroLevel(totalXP(state));
  const stats = ATTR_KEYS.map(a => { const s = attrLevel(state.axp[a]||0);
    const from = CAT_KEYS.filter(c => CATS[c].a[0] === a).map(cName).join(", ");
    return `<div class="stat" style="--cat:var(--a-${a})"><div class="stat-top"><span>${aName(a)}</span><b>${s.lvl}</b></div>
      <div class="bar"><span style="width:${(s.into/s.need*100).toFixed(1)}%"></span></div>
      <small><span class="num">${s.into}/${s.need}</span> · ${esc(from)}</small></div>`; }).join("");
  const cats = CAT_KEYS.map(c => { const open = isOpen(c), s = catLevel(state.cxp[c]||0);
    return `<div class="catrow" style="${catVar(c)}${open?"":";opacity:.5"}"><span class="tag">${cName(c)}</span>
      <div class="bar"><span style="width:${open?(s.into/s.need*100).toFixed(1):0}%"></span></div>
      <span class="num">${open ? t("lv",{l:s.lvl}) : t("opensAt",{l:CATS[c].unlock})}</span></div>`; }).join("");
  const d = today(); const days = []; let max = 1, sum30 = 0, active = 0;
  for (let i = 29; i >= 0; i--){ const k = addDays(d,-i); const x = Object.values(state.log[k]||{}).reduce((a,e)=>a+Math.max(0,e.x),0); days.push(x); max = Math.max(max,x); sum30 += x; if (x>0) active++; }
  const bars = days.map(x => `<span class="${x?"":"zero"}" style="height:${x? Math.max(4, x/max*100):3}%" title="${x} XP"></span>`).join("");
  const best = state.habits.reduce((m,h) => Math.max(m, streak(h.days)), 0);
  const nChal = Object.keys(state.done).length;
  return `<div class="card-hero">${avatarSVG(state.hero.avatar, "c")}<div><h2>${esc(state.hero.name)}</h2><p>${titleFor(hx.lvl)} · ${t("lvl",{l:hx.lvl})}</p><p>${t("since",{d:fmtDate(state.hero.created)})}</p></div></div>
    <section class="sec"><div class="kpis">
      <div class="kpi"><b class="num">${totalXP(state)}</b><small>${t("kTotal")}</small></div>
      <div class="kpi"><b class="num">${nChal}</b><small>${t("kChal")}</small></div>
      <div class="kpi"><b class="num">${best}</b><small>${t("kStreak")}</small></div></div></section>
    <section class="sec"><div class="sec-head"><h2>${t("attrsHead")}</h2></div><div class="panel">${radar()}</div><div class="stats">${stats}</div></section>
    <section class="sec"><div class="sec-head"><h2>${t("catsHead")}</h2><span class="locked">${t("catsOpen",{a:openCats().length, b:CAT_KEYS.length})}</span></div><div class="panel catrows">${cats}</div></section>
    <section class="sec"><div class="sec-head"><h2>${t("last30")}</h2><span class="locked">${t("activeDays",{a:active, x:sum30})}</span></div>
      <div class="panel"><div class="days">${bars}</div><div class="days-axis"><span>${fmtDate(addDays(d,-29))}</span><span>${t("today")}</span></div></div></section>`;
}

function viewProfile(){
  const a = Object.assign({}, AV_DEFAULT, state.hero.avatar), Lv = heroLvl();
  const groups = Object.entries(AV).map(([k, g]) => `<div class="opt-group"><span>${L().avg[k]}</span><div class="opts">${g.opts.map(([v, min]) => {
    const lock = min && Lv < min, sel = a[k] === v;
    const label = g.sw ? "" : esc(L().avo[k+"."+v] || v) + (lock ? `<span class="lk">${t("lv",{l:min})}</span>` : "");
    const style = g.sw ? `style="background:${v}"` : "";
    const aria = g.sw ? `aria-label="${L().avg[k]} ${v}${lock?" · "+t("opensAt",{l:min}):""}"` : "";
    return `<button class="opt ${g.sw?"sw":""}" ${style} ${aria} data-act="av" data-k="${k}" data-v="${v}" aria-pressed="${sel}" ${lock?`disabled title="${t("opensAt",{l:min})}"`:""}>${label}</button>`;
  }).join("")}</div></div>`).join("");
  return `<section class="sec"><div class="sec-head"><h2>${t("langHead")}</h2></div>${langPicker()}</section>
    <section class="sec"><div class="sec-head"><h2>${t("avatarHead")}</h2></div>
      <div class="av-editor"><div class="av-preview">${avatarSVG(a, "p")}</div>${groups}
      <p class="hint">${t("avatarHint")}</p></div></section>
    <section class="sec"><div class="sec-head"><h2>${t("charHead")}</h2></div>
      <label for="hero-name">${t("name")}<input id="hero-name" value="${esc(state.hero.name)}" maxlength="40"></label>
      <div><button class="btn small" data-act="rename">${t("saveName")}</button></div></section>
    <section class="sec"><div class="sec-head"><h2>${t("accHead")}</h2></div>
      ${authed() ? `<p class="hint">${t("signedAs",{e:esc(pb.authStore.record.email)})}</p><p class="hint">${t("accSynced")}</p>
        <div class="btns"><button class="btn small ghost" data-act="logout">${t("logout")}</button></div>`
      : `<p class="hint">${t("accLocal")}</p>${pb ? `<div><button class="btn small" data-act="auth">${t("connect")}</button></div>` : ""}`}
    </section>
    ${pb ? `<section class="sec"><div class="sec-head"><h2>${t("helpHead")}</h2></div><p class="hint">${t("helpSub")}</p>
      <div><button class="btn small gold" data-act="feedback">${t("feedback")}</button></div></section>` : ""}
    <section class="sec"><div class="btns">
      <button class="btn small ghost" data-act="export">${t("exportData")}</button>
      <button class="btn small danger" data-act="reset">${t("reset")}</button>
      ${authed() ? `<button class="btn small danger" data-act="delete-account">${t("deleteAccount")}</button>` : ""}</div></section>
    <footer class="foot"><span>${t("version",{v:esc(CFG.VERSION||"")})}</span>
      <button class="linkbtn" style="font-size:12px;padding:0" data-act="news">${t("whatsNew")}</button>
      <a href="${CFG.PRIVACY_URL}" target="_blank" rel="noopener">${t("privacy")}</a>
      <a href="${CFG.LEGAL_URL}" target="_blank" rel="noopener">${t("legal")}</a></footer>`;
}

function renderWelcome(){
  const typed = document.getElementById("w-name")?.value;
  $app.innerHTML = `<div class="wrap"><div class="welcome">
    ${langPicker()}
    <div style="width:120px">${avatarSVG(AV_DEFAULT,"w")}</div>
    <h1>Lvlo</h1>
    <p>${t("welcome")}</p>
    <label for="w-name">${t("askName")}<input id="w-name" maxlength="40" value="${esc(typed ?? pendingName)}" placeholder="${t("namePh")}"></label>
    <label class="check-row" for="w-starter"><input type="checkbox" id="w-starter" checked> ${t("starter")}</label>
    <button class="btn" data-act="start">${t("create")}</button>
    ${pb && !authed() ? `<button class="linkbtn" data-act="login">${t("loginLink")}</button>` : ""}
    <p class="legal"><a href="${CFG.PRIVACY_URL}" target="_blank" rel="noopener">${t("privacy")}</a> · <a href="${CFG.LEGAL_URL}" target="_blank" rel="noopener">${t("legal")}</a></p>
  </div></div>`;
}

/* ================= Hojas ================= */
function sheet(html, onSave){
  const bg = document.createElement("div"); bg.className = "sheet-bg";
  bg.innerHTML = `<form class="sheet">${html}</form>`;
  document.body.appendChild(bg);
  const form = bg.querySelector("form");
  const close = () => bg.remove();
  bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close]")) close(); });
  form.addEventListener("submit", e => { e.preventDefault(); if (onSave(new FormData(form), e.submitter) !== false) close(); });
  const catSel = form.querySelector("#f-cat"), diffSel = form.querySelector("#f-diff");
  if (catSel && diffSel){ const upd = () => fillDiff(diffSel, catSel.value); catSel.addEventListener("change", upd); upd(); }
  return {bg, form, close};
}
function fillDiff(sel, cat){
  const l = cLvl(cat), cur = sel.dataset.value || sel.value || "facil";
  sel.innerHTML = DIFF_KEYS.map(k => `<option value="${k}" ${DIFF[k].unlock > l ? "disabled" : ""} ${k===cur?"selected":""}>${dName(k)} · ${DIFF[k].xp} XP${DIFF[k].unlock > l ? ` (${t("lv",{l:DIFF[k].unlock})})` : ""}</option>`).join("");
  if (sel.selectedOptions[0]?.disabled) sel.value = "facil";
}
const catOptions = sel => openCats().concat(sel && !isOpen(sel) ? [sel] : []).map(c => `<option value="${c}" ${c===sel?"selected":""}>${cName(c)}</option>`).join("");
const sheetBtns = isNew => `<div class="sheet-actions">${isNew?"":`<button type="submit" class="btn ghost" name="del" value="1" style="margin-right:auto">${t("del")}</button>`}
  <button type="button" class="btn ghost" data-close>${t("cancel")}</button><button type="submit" class="btn">${t("save")}</button></div>`;

function editItem(kind, obj){
  const isNew = !obj, o = obj || {title:"", cat:"salud", diff:"facil"}, H = kind === "habit";
  sheet(`<h3>${isNew ? t(H?"newHabit":"newTask") : t(H?"editHabit":"editTask")}</h3>
    <label for="f-title">${t("name")}<input id="f-title" name="title" required maxlength="90" value="${esc(o.title)}" placeholder="${t(H?"habitPh":"taskPh")}"></label>
    <label for="f-cat">${t("cat")}<select id="f-cat" name="cat">${catOptions(o.cat)}</select></label>
    <label for="f-diff">${t("diff")}<select id="f-diff" name="diff" data-value="${o.diff}"></select></label>
    <p class="hint">${t(H?"hHabit":"hTask")} ${t("hDiff")}</p>${sheetBtns(isNew)}`,
  (fd, sub) => {
    const list = H ? state.habits : state.tasks;
    if (sub && sub.name === "del"){ const i = list.indexOf(obj); if (i>=0) list.splice(i,1); commit(); return; }
    const title = String(fd.get("title")).trim(); if (!title) return false;
    if (isNew){
      const n = {id:uid(), title, cat:fd.get("cat"), diff:fd.get("diff"), created:today()};
      if (H) n.days = []; else n.done = false;
      list.push(n);
    } else Object.assign(obj, {title, cat:fd.get("cat"), diff:fd.get("diff")});
    commit();
  });
}

function editGoal(g){
  const isNew = !g, d = today(), o = g || {title:"", cat:"lectura", target:10, deadline:addDays(d,30)};
  sheet(`<h3>${isNew ? t("newGoal") : t("editGoal")}</h3>
    <label for="g-title">${t("goal")}<input id="g-title" name="title" required maxlength="90" value="${esc(o.title)}" placeholder="${t("goalPh")}"></label>
    <label for="g-cat">${t("gCat")}<select id="g-cat" name="cat">${catOptions(o.cat)}</select></label>
    <div class="row2"><label for="g-target">${t("gTarget")}<input id="g-target" name="target" type="number" min="1" max="500" value="${o.target}" required></label>
      <label for="g-deadline">${t("gDeadline")}<input id="g-deadline" name="deadline" type="date" value="${o.deadline||""}" min="${d}"></label></div>
    <p class="hint">${t("gHint")}</p>${sheetBtns(isNew)}`,
  (fd, sub) => {
    if (sub && sub.name === "del"){ state.goals = state.goals.filter(x => x !== g); commit(); return; }
    const title = String(fd.get("title")).trim(); if (!title) return false;
    const vals = {title, cat:fd.get("cat"), target:Math.max(1, parseInt(fd.get("target"),10)||1), deadline:fd.get("deadline")||null};
    if (isNew) state.goals.push({id:uid(), from:d, done:false, ...vals}); else Object.assign(g, vals);
    commit();
  });
}

// Sorpréndeme: reto aleatorio filtrado por tiempo disponible
let surpriseTime = "all";
function surprise(){
  let current = null;
  const opts = [["all",t("any")],["5",timeName("5")],["30",timeName("30")],["t",timeName("t")],["p",timeName("p")]];
  const s = sheet(`<h3>${t("surprise")}</h3>
    <div class="chips" role="group" aria-label="${t("timeAvail")}">${opts.map(([k,l]) =>
      `<button type="button" class="chip" data-time="${k}" aria-pressed="${k===surpriseTime}">${l}</button>`).join("")}</div>
    <div id="pick"></div>
    <div class="sheet-actions"><button type="button" class="btn ghost" data-close>${t("close")}</button></div>`, () => false);
  const box = s.form.querySelector("#pick");
  const draw = () => {
    const pool = CH.filter(ch => available(ch) && (surpriseTime === "all" || ch.time === surpriseTime) && (!current || ch.id !== current.id));
    if (pool.length || !current) current = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
    box.innerHTML = current ? `<div class="pick" style="${catVar(current.cat)}">
        <div class="quest-top"><span class="tier">${cName(current.cat)} · ${tierName(current.ti)}</span><span class="time">${timeName(current.time)}</span></div>
        <p>${esc(chText(current))}</p>
        <div class="quest-top"><span class="xp-chip">+${current.xp} XP</span>
          <div class="btns"><button type="button" class="btn ghost small" data-s="again">${t("another")}</button><button type="button" class="btn ghost small" data-s="task">${t("toTasks")}</button><button type="button" class="btn small" data-s="done">${t("doneEx")}</button></div></div></div>`
      : `<div class="empty">${t("noSurprise")}</div>`;
  };
  s.form.addEventListener("click", e => {
    const tb = e.target.closest("[data-time]");
    if (tb){ surpriseTime = tb.dataset.time; s.form.querySelectorAll("[data-time]").forEach(b => b.setAttribute("aria-pressed", b === tb)); current = null; draw(); return; }
    const b = e.target.closest("[data-s]"); if (!b || !current) return;
    if (b.dataset.s === "again") draw();
    if (b.dataset.s === "task"){ challengeToTask(current.id, false); s.close(); }
    if (b.dataset.s === "done"){ completeChallenge(current.id); s.close(); }
  });
  draw();
}

function confirmDeleteAccount(){
  sheet(`<h3>${t("deleteAccount")}</h3><p class="hint">${t("deleteText")}</p>
    <div class="sheet-actions"><button type="button" class="btn ghost" data-close>${t("cancel")}</button><button type="submit" class="btn danger">${t("deleteAccount")}</button></div>`,
  () => { deleteAccount(); });
}
function confirmReset(){
  sheet(`<h3>${t("reset")}</h3><p class="hint">${t("resetText")}</p>
    <div class="sheet-actions"><button type="button" class="btn ghost" data-close>${t("cancel")}</button><button type="submit" class="btn danger">${t("deleteAll")}</button></div>`,
  () => { const h = state.hero; state = blankState(h.name); state.hero.avatar = h.avatar; tab = "hoy"; commit(); });
}

let toastTimer;
function toast(html, ms){
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div"); el.className = "toast"; el.setAttribute("role","status"); el.innerHTML = html;
  document.body.appendChild(el); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), ms || 2200);
}

/* ================= Eventos ================= */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act],[data-tab]"); if (!b || b.closest(".sheet")) return;
  if (b.dataset.tab){ tab = b.dataset.tab; render(); window.scrollTo(0,0); return; }
  const id = b.dataset.id;
  switch (b.dataset.act){
    case "lang": { const y = window.scrollY; setLang(b.dataset.lang); window.scrollTo(0, y); break; }
    case "auth": authSheet("signup"); break;
    case "login": authSheet("login"); break;
    case "logout": logout(); break;
    case "delete-account": confirmDeleteAccount(); break;
    case "export": exportData(); break;
    case "feedback": feedbackSheet(); break;
    case "news": newsSheet(); break;
    case "habit": toggleHabit(id); track("habit_toggle"); break;
    case "task": toggleTask(id); track("task_toggle"); break;
    case "new-habit": editItem("habit"); break;
    case "new-task": editItem("task"); break;
    case "edit-habit": editItem("habit", state.habits.find(x => x.id === id)); break;
    case "edit-task": editItem("task", state.tasks.find(x => x.id === id)); break;
    case "daily": completeChallenge(id, true); track("daily_done"); break;
    case "surprise": surprise(); track("surprise_open"); break;
    case "qcat": questCat = b.dataset.cat; render(); break;
    case "quest": completeChallenge(id); track("challenge_done", {cat:(chById(id)||{}).cat}); break;
    case "to-task": challengeToTask(id, false); break;
    case "to-habit": challengeToTask(id, true); break;
    case "coll": toggleColl(b.dataset.cat, +b.dataset.i); break;
    case "new-goal": editGoal(); break;
    case "edit-goal": editGoal(state.goals.find(x => x.id === id)); break;
    case "claim": claimGoal(id); track("goal_claimed"); break;
    case "av": { state.hero.avatar = Object.assign({}, AV_DEFAULT, state.hero.avatar, {[b.dataset.k]: b.dataset.v}); const y = window.scrollY; commit(); window.scrollTo(0, y); break; }
    case "rename": { const v = document.getElementById("hero-name").value.trim(); if (v){ state.hero.name = v; commit(); toast(t("nameSaved")); } break; }
    case "reset": confirmReset(); break;
    case "start": {
      const v = document.getElementById("w-name").value.trim();
      if (!v){ document.getElementById("w-name").focus(); return; }
      state = blankState(v);
      if (document.getElementById("w-starter").checked) starter(state);
      tab = "perfil"; commit(); track("character_created", {lang}); toast(t("customize"), 2400); break;
    }
  }
});

/* ================= Arranque ================= */
state = loadLocal();
if (state && state.lang && I18N[state.lang]) { lang = state.lang; try{ localStorage.setItem(LANG_KEY, lang); }catch(e){} }
else if (state) state.lang = lang;
render();
if (authed()) pull();
maybeShowNews();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));

})();
