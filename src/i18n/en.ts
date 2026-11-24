export const en = {
  'picker.title': 'Pick a song',
  'level.keys': 'Keys',
  'level.rhythm': 'Rhythm',
  'hand.title': 'Put your hand here',
  'hand.thumbOn': 'Thumb on {note}',
  'play.next': 'Next',
  'plug.title': 'Plug in the keyboard',
  'plug.tap': 'Or tap the keys',
  'results.again': 'Play again',
  'results.other': 'Another song',
  'medals.title': 'My medals',
} as const;

export type TKey = keyof typeof en;
