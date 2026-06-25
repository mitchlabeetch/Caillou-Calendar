/**
 * Common emoji set used by the event-title emoji picker.
 *
 * Hand-curated list of safe, monochrome-friendly glyphs. The picker
 * is intentionally short — covering the most-used categories —
 * rather than the full Unicode block (which is unwieldy on a phone).
 */
export const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'People',
    emojis: ['👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '🙋', '💁', '🙅', '🤷', '🤝'],
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🎳', '🏸', '🥊', '🏊', '🚴', '🧗', '🏃', '🧘'],
  },
  {
    name: 'Travel',
    emojis: ['✈️', '🚗', '🚌', '🚆', '🚇', '🚲', '🛵', '🏖️', '🏝️', '🏔️', '🗽', '🗼', '🎡', '🎢', '🎠'],
  },
  {
    name: 'Food',
    emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥝', '🥑', '🍞', '🧀', '🍕'],
  },
  {
    name: 'Celebration',
    emojis: ['🎂', '🍰', '🎉', '🎊', '🎁', '🎈', '🎀', '🎆', '🎇', '✨', '🌟', '⭐', '💝', '💖', '🎶'],
  },
  {
    name: 'School',
    emojis: ['📚', '📖', '✏️', '📝', '📐', '🎒', '🎓', '💼', '💻', '🖥️', '📱', '🔬', '🔭', '🧪', '🧮'],
  },
  {
    name: 'Home',
    emojis: ['🏠', '🏡', '🛏️', '🛋️', '🚿', '🧹', '🧺', '🧸', '🪴', '🪞', '🪑', '🧯', '🪟', '🚪', '🔑'],
  },
  {
    name: 'Health',
    emojis: ['💊', '💉', '🩺', '🩹', '🦷', '👓', '🧴', '🧼', '🧽', '🪥', '🛁', '🧖', '💆', '🧠', '❤️'],
  },
];