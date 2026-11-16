import type { Challenge, Exercise } from '../types';

export const CHALLENGES: Challenge[] = [
  {
    id: 'max-pullups',
    name: 'Maximum shybů',
    kind: 'reps',
    better: 'higher',
    summary: 'Kolik shybů dáš na jeden zátah.',
    rules: [
      'Začínáš ve visu s propnutými pažemi.',
      'Počítá se opakování, kdy se brada dostane nad hrazdu.',
      'Jakmile se pustíš hrazdy, pokus končí.',
    ],
    exercises: ['pullup'],
  },
  {
    id: 'max-pushups',
    name: 'Maximum kliků',
    kind: 'reps',
    better: 'higher',
    summary: 'Kolik kliků dáš bez položení kolen.',
    rules: [
      'Tělo držíš po celou dobu v jedné rovině.',
      'Dole se hrudník dostane na šířku pěsti nad zem, nahoře propneš paže.',
      'Položení kolen nebo odpočinek delší než 3 sekundy pokus ukončí.',
    ],
    exercises: ['pushup'],
  },
  {
    id: 'max-dips',
    name: 'Maximum dipů',
    kind: 'reps',
    better: 'higher',
    summary: 'Kolik dipů na bradlech dáš na jeden zátah.',
    rules: [
      'Dole jsou ramena pod úrovní loktů, nahoře propneš paže.',
      'Jakmile se dotkneš země, pokus končí.',
    ],
    exercises: ['dip'],
  },
  {
    id: 'dead-hang',
    name: 'Vis na hrazdě',
    kind: 'time',
    better: 'higher',
    summary: 'Jak dlouho vydržíš viset na hrazdě.',
    rules: [
      'Stopky spusť ve chvíli, kdy se nohy odlepí od země.',
      'Visíš na obou rukou, bez přehmatávání.',
      'Stopky zastav, jakmile se pustíš nebo se dotkneš země.',
    ],
    exercises: ['hang'],
  },
  {
    id: 'stovka',
    name: 'Stovka na čas',
    kind: 'time',
    better: 'lower',
    summary: '20 shybů, 30 dipů a 50 kliků co nejrychleji.',
    rules: [
      'Celkem 20 shybů, 30 dipů a 50 kliků.',
      'Pořadí i rozdělení do sérií je na tobě.',
      'Stopky běží od prvního opakování do posledního, včetně odpočinku.',
    ],
    exercises: ['pullup', 'dip', 'pushup'],
  },
];

export const EXERCISES: Exercise[] = [
  {
    id: 'pullup',
    name: 'Shyb',
    steps: [
      'Chyť hrazdu nadhmatem o něco šířeji než na šířku ramen.',
      'Zpevni břicho a stáhni lopatky dolů a k sobě.',
      'Přitáhni se, dokud brada není nad hrazdou.',
      'Kontrolovaně se spusť zpět do propnutých paží.',
    ],
    mistakes: ['Kopání nohama a houpání.', 'Poloviční rozsah bez propnutí paží.'],
  },
  {
    id: 'pushup',
    name: 'Klik',
    steps: [
      'Dlaně polož pod ramena, nohy u sebe.',
      'Zpevni břicho a hýždě, tělo tvoří rovnou linii.',
      'Spouštěj se s lokty zhruba 45° od těla.',
      'Vytlač se zpět do propnutých paží.',
    ],
    mistakes: ['Prohnutá bedra.', 'Lokty vytočené do stran.'],
  },
  {
    id: 'dip',
    name: 'Dip na bradlech',
    steps: [
      'Vzepři se na bradlech s propnutými pažemi.',
      'Mírně se předkloň a pokrč kolena.',
      'Spouštěj se, dokud ramena nejsou pod úrovní loktů.',
      'Vytlač se zpět nahoru.',
    ],
    mistakes: ['Ramena vytažená k uším.', 'Příliš malý rozsah pohybu.'],
  },
  {
    id: 'hang',
    name: 'Vis',
    steps: [
      'Chyť hrazdu nadhmatem na šířku ramen.',
      'Palec obtoč kolem hrazdy.',
      'Lehce stáhni lopatky, ať nevisíš jen na šlachách.',
      'Dýchej klidně a nehoupej se.',
    ],
    mistakes: ['Zadržování dechu.', 'Úplně povolená ramena.'],
  },
];

const EQUIPMENT_CS: Record<string, string> = {
  horizontal_bar: 'hrazda',
  parallel_bars: 'bradla',
  'sit-up': 'lavice na sedy-lehy',
  'push-up': 'madla na kliky',
  monkey_bars: 'ručkovací žebřík',
  inclined_ladder: 'šikmý žebřík',
  inclined_bar: 'šikmá hrazda',
  horizontal_ladder: 'vodorovný žebřík',
  rings: 'kruhy',
  wall_bars: 'ribstole',
  stairs: 'schody',
  balance_beam: 'kladina',
  elliptical_trainer: 'eliptický trenažér',
  exercise_bike: 'rotoped',
  air_walker: 'chodítko',
  rower: 'veslovací trenažér',
  stepper: 'stepper',
  twist: 'twister',
  sign: 'informační tabule',
};

export function equipmentLabel(key: string): string {
  return EQUIPMENT_CS[key] ?? key.replace(/_/g, ' ');
}
