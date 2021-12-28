import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

// Sohm Al (normal)
const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.SohmAl,
  timelineFile: 'sohm_al.txt',
  timelineTriggers: [
    {
      id: 'Sohm Al Raskovnik Bloody Caress',
      regex: /Bloody Caress/,
      beforeSeconds: 4,
      response: Responses.tankBuster('info'),
    },
    {
      id: 'Sohm Al Myath Third Leg Forward',
      regex: /Third Leg Forward/,
      beforeSeconds: 4,
      response: Responses.tankBuster('info'),
    },
    {
      id: 'Sohm Al Tioman Abyssic Buster',
      regex: /Abyssic Buster/,
      beforeSeconds: 4,
      response: Responses.tankCleave(),
    },
  ],
  triggers: [
    {
      id: 'Sohm Al Myath Stack',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '0017' }),
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Sohm Al Myath Spread',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '00AE' }),
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Sohm Al Myath Chyme',
      type: 'AddedCombatant',
      netRegex: NetRegexes.addedCombatant({ name: 'Chyme Of The Mountain', capture: false }),
      netRegexDe: NetRegexes.addedCombatant({ name: 'Gebirgsbrei', capture: false }),
      netRegexFr: NetRegexes.addedCombatant({ name: 'Chyme Des Montagnes', capture: false }),
      netRegexJa: NetRegexes.addedCombatant({ name: 'キームス・マウンテン', capture: false }),
      netRegexCn: NetRegexes.addedCombatant({ name: '圣山之糜', capture: false }),
      netRegexKo: NetRegexes.addedCombatant({ name: '산의 유미즙', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Chyme Add',
          de: 'Brei Add töten',
          fr: 'Tuez l\'add Chyme',
          ja: 'キームス・マウンテンを倒す',
          cn: '击杀圣山之糜',
          ko: '산의 유미즙 처치',
        },
      },
    },
    {
      id: 'Sohm Al Tioman Meteor',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '0007' }),
      condition: Conditions.targetIsYou(),
      response: Responses.meteorOnYou(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Chyme Of The Mountain': 'Gebirgsbrei',
        'Greenlinn': 'Grünklippe',
        'Hess Afah': 'Hess Afah',
        'Myath': 'Myath',
        'Raskovnik': 'Raskovnik',
        'The Wound': 'Wunde',
        'Tioman': 'Tioman',
      },
      'replaceText': {
        'Abyssic Buster': 'Abyss-Sprenger',
        'Acid Rain': 'Säureregen',
        'Bloody Caress': 'Vampirranke',
        'Chaos Blast': 'Chaos-Knall',
        'Comet': 'Komet',
        'Dark Star': 'Dunkler Stern',
        'Ensnare': 'Anspringen',
        'Floral Trap': 'Saugfalle',
        'Flower Devour': 'Riesenappetit',
        'Heavensfall': 'Himmelsfall',
        'Leafstorm': 'Blättersturm',
        'Mad Dash': 'Tollwütiger Sprint',
        'Meteor Impact': 'Meteoreinschlag',
        'Overbite': 'Überbiss',
        'Phytobeam': 'Phytostrahl',
        'Primordial Roar': 'Urgebrüll',
        'Razor Scales': 'Messerscharfe Schuppen',
        'Spit': 'Hypersekretion',
        'Sweet Scent': 'Süßlicher Geruch',
        'Third Leg Forward': 'Drittes Bein',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Chyme Of The Mountain': 'Chyme des montagnes',
        'Greenlinn': 'Vertaven',
        'Hess Afah': 'Hess Afah',
        'Myath': 'Myath',
        'Raskovnik': 'Raskovnik',
        'The Wound': 'La Plaie',
        'Tioman': 'Tioman',
      },
      'replaceText': {
        'Abyssic Buster': 'Brisement abyssal',
        'Acid Rain': 'Pluie acide',
        'Bloody Caress': 'Caresse sanglante',
        'Chaos Blast': 'Explosion de chaos',
        'Comet': 'Comète',
        'Dark Star': 'Étoile noire',
        'Ensnare': 'Piégeage',
        'Floral Trap': 'Piège floral',
        'Flower Devour': 'Bâfrée',
        'Heavensfall': 'Chute céleste',
        'Leafstorm': 'Tempête de feuilles',
        'Mad Dash': 'Ruée démente',
        'Meteor Impact': 'Impact de météore',
        'Overbite': 'Morsure violente',
        'Phytobeam': 'Rayon solaire',
        'Primordial Roar': 'Rugissement primitif',
        'Razor Scales': 'Écailles rasantes',
        'Spit': 'Crachat',
        'Sweet Scent': 'Doux parfum',
        'Third Leg Forward': 'Fauchage',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Chyme Of The Mountain': 'キームス・マウンテン',
        'Greenlinn': '碧の崖',
        'Hess Afah': 'ヘス・アファー',
        'Myath': 'マイス',
        'Raskovnik': 'ラスコヴニク',
        'The Wound': '霊峰の傷',
        'Tioman': 'ティオマン',
      },
      'replaceText': {
        'Abyssic Buster': 'アビスバスター',
        'Acid Rain': 'アシッドレイン',
        'Bloody Caress': 'ブラッディカレス',
        'Chaos Blast': 'カオスブラスト',
        'Comet': 'コメット',
        'Dark Star': 'ダークスター',
        'Ensnare': 'エンスネア',
        'Floral Trap': 'フローラルトラップ',
        'Flower Devour': '大食い',
        'Heavensfall': 'ヘヴンスフォール',
        'Leafstorm': 'リーフストーム',
        'Mad Dash': 'マッドダッシュ',
        'Meteor Impact': 'メテオインパクト',
        'Overbite': 'オーバーバイト',
        'Phytobeam': 'ソーラービーム',
        'Primordial Roar': 'プライモーディアルロア',
        'Razor Scales': 'レーザースケイル',
        'Spit': '放出',
        'Sweet Scent': 'スイートセント',
        'Third Leg Forward': 'サードレッグ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Chyme Of The Mountain': '圣山之糜',
        'Greenlinn': '碧崖',
        'Hess Afah': '永望顶',
        'Myath': '迈斯龙',
        'Raskovnik': '破锁花王',
        'The Wound': '灵伤',
        'Tioman': '刁曼',
      },
      'replaceText': {
        'Abyssic Buster': '深渊破坏',
        'Acid Rain': '酸雨',
        'Bloody Caress': '血腥的爱抚',
        'Chaos Blast': '混沌爆破',
        'Comet': '彗星',
        'Dark Star': '暗星',
        'Ensnare': '诱捕',
        'Floral Trap': '鲜花陷阱',
        'Flower Devour': '狼吞虎咽',
        'Heavensfall': '惊天动地',
        'Leafstorm': '绿叶风暴',
        'Mad Dash': '疯狂泼溅',
        'Meteor Impact': '陨石冲击',
        'Overbite': '咬合',
        'Phytobeam': '植物射线',
        'Primordial Roar': '原始嚎叫',
        'Razor Scales': '鳞刀',
        'Spit': '吐出',
        'Sweet Scent': '香气',
        'Third Leg Forward': '第三腿前扫',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Chyme Of The Mountain': '산의 유미즙',
        'Greenlinn': '청록 절벽',
        'Hess Afah': '헤스 아파',
        'Myath': '마이스',
        'Raskovnik': '라스코브니크',
        'The Wound': '영봉의 상처',
        'Tioman': '티오만',
      },
      'replaceText': {
        'Abyssic Buster': '심연의 파괴자',
        'Acid Rain': '산성비',
        'Bloody Caress': '피의 애무',
        'Chaos Blast': '혼돈 폭풍',
        'Comet': '혜성',
        'Dark Star': '어둠의 별',
        'Ensnare': '올가미',
        'Floral Trap': '향기의 덫',
        'Flower Devour': '폭식',
        'Heavensfall': '천지 붕괴',
        'Leafstorm': '잎사귀 폭풍',
        'Mad Dash': '광분 질주',
        'Meteor Impact': '운석 낙하',
        'Overbite': '피개 교합',
        'Phytobeam': '태양 광선',
        'Primordial Roar': '태고의 포효',
        'Razor Scales': '날카로운 비늘',
        'Spit': '방출',
        'Sweet Scent': '달콤한 향기',
        'Third Leg Forward': '제3의 다리 전진',
      },
    },
  ],
};

export default triggerSet;
