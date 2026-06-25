/**
 * Locale sync script.
 *
 * Ensures all 6 locale files (en, fr, es, de, it, pt) have the same set
 * of keys. New keys added to en.json are mirrored into the other
 * locales with the English text as a fallback so missing translations
 * never cause runtime `undefined` lookups. Run after touching en.json.
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LANGS = ['en', 'fr', 'es', 'de', 'it', 'pt'];

// Per-language overrides for keys we want to translate right now.
// Anything not listed here stays in English as the fallback.
const OVERRIDES = {
  fr: {
    printPreview: 'Aperçu avant impression',
    print: 'Imprimer',
    familySchedule: 'Emploi du temps familial',
    agenda: 'Agenda',
    moveEvent: 'Déplacer vers…',
    exceptionDates: 'Dates à ignorer (séparées par des virgules, AAAA-MM-JJ)',
    templates: 'Modèles rapides',
    chooseTemplate: '— Choisir un modèle —',
    everyN: 'Tous les N',
    nextBirthday: 'Prochain anniversaire',
    quickStats: 'Cette semaine',
    today: "Aujourd'hui",
    inDaysShort: 'dans {{count}}j',
    pickEmoji: 'Choisir un emoji',
    voiceInput: 'Saisie vocale',
    listening: 'Écoute…',
    voiceNotSupported: "Saisie vocale non prise en charge dans ce navigateur",
    importIcs: 'Importer .ics',
    chooseFile: 'Choisir un fichier .ics',
    importedEvents: '{{count}} événement(s) importé(s)',
    importFailed: 'Échec de l import',
    uploadAvatar: 'Téléverser',
    removeAvatar: 'Retirer',
    allDay: 'Toute la journée',
    category: 'Catégorie',
    colorOverride: 'Couleur',
    tags: 'Tags (séparés par des virgules)',
    pinToTop: 'Épingler en haut',
    moveTo: 'Déplacer',
    moveToPrompt: 'Déplacer vers (AAAA-MM-JJ) :',
    invalidDate: 'Format de date invalide. Utiliser AAAA-MM-JJ.',
    avatar: 'Avatar',
  },
  es: {
    printPreview: 'Vista previa de impresión',
    print: 'Imprimir',
    familySchedule: 'Horario familiar',
    agenda: 'Agenda',
    moveEvent: 'Mover a…',
    exceptionDates: 'Saltar fechas (separadas por comas, AAAA-MM-DD)',
    templates: 'Plantillas rápidas',
    chooseTemplate: '— Elegir una plantilla —',
    everyN: 'Cada N',
    nextBirthday: 'Próximo cumpleaños',
    quickStats: 'Esta semana',
    today: 'Hoy',
    inDaysShort: 'en {{count}}d',
    pickEmoji: 'Elegir un emoji',
    voiceInput: 'Entrada por voz',
    listening: 'Escuchando…',
    voiceNotSupported: 'La entrada por voz no es compatible con este navegador',
    importIcs: 'Importar .ics',
    chooseFile: 'Elegir archivo .ics',
    importedEvents: '{{count}} evento(s) importado(s)',
    importFailed: 'Error al importar',
    uploadAvatar: 'Subir',
    removeAvatar: 'Quitar',
    allDay: 'Todo el día',
    category: 'Categoría',
    colorOverride: 'Color',
    tags: 'Etiquetas (separadas por comas)',
    pinToTop: 'Fijar arriba',
    moveTo: 'Mover',
    moveToPrompt: 'Mover a (AAAA-MM-DD):',
    invalidDate: 'Formato de fecha inválido. Usa AAAA-MM-DD.',
    avatar: 'Avatar',
  },
  de: {
    printPreview: 'Druckvorschau',
    print: 'Drucken',
    familySchedule: 'Familienplan',
    agenda: 'Agenda',
    moveEvent: 'Verschieben nach…',
    exceptionDates: 'Diese Termine überspringen (Komma-getrennt, JJJJ-MM-TT)',
    templates: 'Schnellvorlagen',
    chooseTemplate: '— Vorlage wählen —',
    everyN: 'Alle N',
    nextBirthday: 'Nächster Geburtstag',
    quickStats: 'Diese Woche',
    today: 'Heute',
    inDaysShort: 'in {{count}}T',
    pickEmoji: 'Emoji wählen',
    voiceInput: 'Spracheingabe',
    listening: 'Höre zu…',
    voiceNotSupported: 'Spracheingabe wird in diesem Browser nicht unterstützt',
    importIcs: '.ics importieren',
    chooseFile: '.ics-Datei wählen',
    importedEvents: '{{count}} Termin(e) importiert',
    importFailed: 'Import fehlgeschlagen',
    uploadAvatar: 'Hochladen',
    removeAvatar: 'Entfernen',
    allDay: 'Ganztägig',
    category: 'Kategorie',
    colorOverride: 'Farbe',
    tags: 'Tags (Komma-getrennt)',
    pinToTop: 'Oben anheften',
    moveTo: 'Verschieben',
    moveToPrompt: 'Verschieben nach (JJJJ-MM-TT):',
    invalidDate: 'Ungültiges Datumsformat. JJJJ-MM-TT verwenden.',
    avatar: 'Avatar',
  },
  it: {
    printPreview: 'Anteprima di stampa',
    print: 'Stampa',
    familySchedule: 'Programma della famiglia',
    agenda: 'Agenda',
    moveEvent: 'Sposta in…',
    exceptionDates: 'Salta queste date (separate da virgola, AAAA-MM-GG)',
    templates: 'Modelli rapidi',
    chooseTemplate: '— Scegli un modello —',
    everyN: 'Ogni N',
    nextBirthday: 'Prossimo compleanno',
    quickStats: 'Questa settimana',
    today: 'Oggi',
    inDaysShort: 'tra {{count}}g',
    pickEmoji: 'Scegli un emoji',
    voiceInput: 'Input vocale',
    listening: 'In ascolto…',
    voiceNotSupported: 'Input vocale non supportato in questo browser',
    importIcs: 'Importa .ics',
    chooseFile: 'Scegli file .ics',
    importedEvents: '{{count}} evento/i importato/i',
    importFailed: 'Importazione fallita',
    uploadAvatar: 'Carica',
    removeAvatar: 'Rimuovi',
    allDay: 'Tutto il giorno',
    category: 'Categoria',
    colorOverride: 'Colore',
    tags: 'Tag (separati da virgola)',
    pinToTop: 'Fissa in alto',
    moveTo: 'Sposta',
    moveToPrompt: 'Sposta a (AAAA-MM-GG):',
    invalidDate: 'Formato data non valido. Usa AAAA-MM-GG.',
    avatar: 'Avatar',
  },
  pt: {
    printPreview: 'Pré-visualização de impressão',
    print: 'Imprimir',
    familySchedule: 'Agenda da família',
    agenda: 'Agenda',
    moveEvent: 'Mover para…',
    exceptionDates: 'Saltar estas datas (separadas por vírgula, AAAA-MM-DD)',
    templates: 'Modelos rápidos',
    chooseTemplate: '— Escolher um modelo —',
    everyN: 'A cada N',
    nextBirthday: 'Próximo aniversário',
    quickStats: 'Esta semana',
    today: 'Hoje',
    inDaysShort: 'em {{count}}d',
    pickEmoji: 'Escolher um emoji',
    voiceInput: 'Entrada por voz',
    listening: 'A ouvir…',
    voiceNotSupported: 'Entrada por voz não suportada neste navegador',
    importIcs: 'Importar .ics',
    chooseFile: 'Escolher ficheiro .ics',
    importedEvents: '{{count}} evento(s) importado(s)',
    importFailed: 'Falha ao importar',
    uploadAvatar: 'Carregar',
    removeAvatar: 'Remover',
    allDay: 'Todo o dia',
    category: 'Categoria',
    colorOverride: 'Cor',
    tags: 'Etiquetas (separadas por vírgula)',
    pinToTop: 'Fixar no topo',
    moveTo: 'Mover',
    moveToPrompt: 'Mover para (AAAA-MM-DD):',
    invalidDate: 'Formato de data inválido. Use AAAA-MM-DD.',
    avatar: 'Avatar',
  },
};

function load(lang) {
  const file = path.join(LOCALES_DIR, lang + '.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function save(lang, data) {
  const file = path.join(LOCALES_DIR, lang + '.json');
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const en = load('en');
for (const lang of LANGS) {
  if (lang === 'en') continue;
  const data = load(lang);
  for (const key of Object.keys(en.app)) {
    if (!(key in data.app)) {
      data.app[key] = (OVERRIDES[lang] && OVERRIDES[lang][key]) ?? en.app[key];
    }
  }
  // Apply overrides for existing keys too (so the new translations land).
  if (OVERRIDES[lang]) {
    for (const [k, v] of Object.entries(OVERRIDES[lang])) {
      if (k in data.app) data.app[k] = v;
    }
  }
  save(lang, data);
  console.log(`synced ${lang}.json: ${Object.keys(data.app).length} keys`);
}