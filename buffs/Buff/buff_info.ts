import EffectId from "../cactbot/resources/effect_id";

import {kAbility} from "./constants";

const potionImage = "../resources/images/000000.png";
// 骑士
const fightOrFlightImage = "../resources/images/000166.png"; // 战逃反应
const requiescatImage = "../resources/images/002513.png"; // 安魂
// 枪刃
const noMercyImage = "../resources/images/003402.png"; // 无情
// 学者
const chainStratagemImage = "../resources/images/002815.png"; // 连环计
// 占星
const divinationImage = "../resources/images/003553.png"; // 占卜
const astrodyneImage = "../resources/images/003558.png"; // 宏图
const theArrowImage = "../resources/images/003113.png"; // 放浪神
const theBalanceImage = "../resources/images/003110.png"; // 太阳神
const theBoleImage = "../resources/images/003112.png"; // 世界树
const theEwerImage = "../resources/images/003114.png"; // 河流神
const theSpearImage = "../resources/images/003111.png"; // 战争神
const theSpireImage = "../resources/images/003115.png"; // 建筑神
const ladyOfCrownsImage = "../resources/images/003146.png"; // 富贵
const lordOfCrownsImage = "../resources/images/003147.png"; // 领主
// 武僧
const riddleOfFireImage = "../resources/images/002541.png"; // 红莲
const brotherhoodImage = "../resources/images/002542.png"; // 义结金兰
// 龙骑
const lanceChargeImage = "../resources/images/000309.png"; // 猛枪
const battleLitanyImage = "../resources/images/002585.png"; // 战斗连祷
const leftEyeImage = "../resources/images/002587.png"; // 左眼
//忍者
// const trickAttackImage = "../resources/images/000618.png"; // 背刺
const mugImage = "../resources/images/000613.png"; // 夺取
// 钐镰客
const arcaneCircleImage = "../resources/images/003633.png"; // 秘环
// 诗人
const ragingStrikesImage = "../resources/images/000352.png"; // 猛者强击
const battleVoiceImage = "../resources/images/002601.png"; // 战斗之声
const radiantFinaleImage = "../resources/images/002622.png"; // 最终乐章
// 舞娘
const devilmentImage = "../resources/images/003471.png"; // 探戈
const technicalFinishImage = "../resources/images/003474.png"; // 技巧舞步
// 召唤
const devotionImage = "../resources/images/002688.png"; // 灵护
const searingLightImage = "../resources/images/002752.png"; // 灼热之光
// 赤魔
const emboldenImage = "../resources/images/003218.png"; // 鼓励

const aEffectId = {
    'Requiescat': '558', // 安魂祈祷
    'RiddleOfFire': '49D', // 红莲极意
    'RightEye': '5AD', // 巨龙右眼
    'RadiantFinale': 'B94', // 最终乐章

    'Mug':'8C8', // 夺取(能力技)
} as const;

export interface BuffInfo {
    name: string;
    activeAbility?: string[];
    cooldownAbility?: string[];
    gainEffect?: string[];
    loseEffect?: string[];
    mobGainsEffect?: string;
    mobLosesEffect?: string;
    durationSeconds?: number;
    useEffectDuration?: boolean;
    icon: string;
    side?: 'left' | 'right';
    borderColor: string;
    sortKey: number;
    cooldown?: number;
    sharesCooldownWith?: string[];
    hide?: boolean;
    stack?: number;
    partyOnly?: boolean;

    target?: 'you' | 'boss' ; // 赋给自己? true:给自己, false:给boss
    physicalUp?: number; //物理增伤百分比
    magicUp?: number; // 魔法增伤百分比
    physicalUpCount?: { [s: string]: number }; //物理增伤百分比
    magicUpCount?:  { [s: string]: number }; // 魔法增伤百分比
    meleeUp?: number; // 近战增伤比
    rangedUp?: number; // 远程增伤
    tts?: string; // tts播报
}

export class BuffInfoList {
    static buffInfo: { [s: string]: Omit<BuffInfo, 'name'> } = {
        potion: { // 强化药  26|2020-09-20T03:24:38.9810000+08:00|31|强化药|30.00|1039A1D9|水貂桑|1039A1D9|水貂桑|28D6|111340|111340||63c01dd83f9942aec827298ddef1519b
            gainEffect: [EffectId.Medicated],
            loseEffect: [EffectId.Medicated],
            useEffectDuration: true,
            icon: potionImage,
            borderColor: '#AA41B2',
            sortKey: 0,
            cooldown: 270, //CD
            target: 'you',
            physicalUp: 8,
            magicUp: 8,
        },
        // 骑士
        // 26|2020-09-20T03:16:28.1830000+08:00|4c|战逃反应|25.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|114648|114648||944a97734ac0fe2928b2e92739402f83
        fightOrFlight: {
            gainEffect: [EffectId.FightOrFlight],
            loseEffect: [EffectId.FightOrFlight],
            useEffectDuration: true,
            icon: fightOrFlightImage,
            borderColor: '#cc392a',
            sortKey: 0,
            cooldown: 60,
            target: 'you',
            physicalUp: 25,
            magicUp: 0,
        },
        // 战士
        // 黑骑
        // 枪刃
        noMercy: { // 无情
            gainEffect: [EffectId.NoMercy],
            loseEffect: [EffectId.NoMercy],
            useEffectDuration: true,
            icon: noMercyImage,
            borderColor: '#345ec4',
            sortKey: 0,
            cooldown: 60,
            target: 'you',
            physicalUp: 20,
            magicUp: 20,
        },
        // 学者
        // 26|2020-09-20T17:11:46.0110000+08:00|4c5|连环计|15.00|1039A1D9|水貂桑|4000031F|木人|00|7400000|46919||cef9177cfc401552bc4e8155d546096e
        chain: { // 连环计
            activeAbility: [kAbility.ChainStratagem],
            partyOnly: true,
            durationSeconds: 15,
            icon: chainStratagemImage,
            borderColor: '#849dfd',
            sortKey: 0,
            cooldown: 120,
            target: 'boss',
            physicalUp: 5,
            magicUp: 5,
            tts: '连环计',
        },
        // 占星
        divination: { // 占卜
            gainEffect: [EffectId.Divination],
            loseEffect: [EffectId.Divination],
            useEffectDuration: true,
            icon: divinationImage,
            borderColor: '#e8c353',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 6,
            magicUp: 6,
            tts: '占卜',
        },
        astrodyne: { // 宏图
            gainEffect: [EffectId.HarmonyOfMind],
            loseEffect: [EffectId.HarmonyOfMind],
            useEffectDuration: true,
            icon: astrodyneImage,
            borderColor: '#413952',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 5, // 物理增伤
            magicUp: 5, // 魔法增伤
        },
        arrow: { // 放浪神之箭
            gainEffect: [EffectId.TheArrow],
            loseEffect: [EffectId.TheArrow],
            useEffectDuration: true,
            icon: theArrowImage,
            borderColor: '#37ccee',
            sortKey: 0,
            target: 'you',
            meleeUp: 6,
            rangedUp: 3,
            tts: '近卡',
        },
        balance: { // 太阳神之衡
            gainEffect: [EffectId.TheBalance],
            loseEffect: [EffectId.TheBalance],
            useEffectDuration: true,
            icon: theBalanceImage,
            borderColor: '#ff5900',
            sortKey: 0,
            target: 'you',
            meleeUp: 6,
            rangedUp: 3,
            tts: '近卡',
        },
        bole: { // 世界树之干
            gainEffect: [EffectId.TheBole],
            loseEffect: [EffectId.TheBole],
            useEffectDuration: true,
            icon: theBoleImage,
            borderColor: '#22dd77',
            sortKey: 0,
            target: 'you',
            meleeUp: 3,
            rangedUp: 6,
            tts: '远卡',
        },
        ewer: { // 河流神之瓶
            gainEffect: [EffectId.TheEwer],
            loseEffect: [EffectId.TheEwer],
            useEffectDuration: true,
            icon: theEwerImage,
            borderColor: '#66ccdd',
            sortKey: 0,
            target: 'you',
            meleeUp: 3,
            rangedUp: 6,
            tts: '远卡',
        },
        spear: { // 战争神之枪
            gainEffect: [EffectId.TheSpear],
            loseEffect: [EffectId.TheSpear],
            useEffectDuration: true,
            icon: theSpearImage,
            borderColor: '#4477dd',
            sortKey: 0,
            target: 'you',
            meleeUp: 6,
            rangedUp: 3,
            tts: '近卡',
        },
        spire: { // 建筑神之塔
            gainEffect: [EffectId.TheSpire],
            loseEffect: [EffectId.TheSpire],
            useEffectDuration: true,
            icon: theSpireImage,
            borderColor: '#ddd044',
            sortKey: 0,
            target: 'you',
            meleeUp: 3,
            rangedUp: 6,
            tts: '远卡',
        },
        // 武僧
        riddleOfFire: { // 红莲
            gainEffect: [aEffectId.RiddleOfFire],
            loseEffect: [aEffectId.RiddleOfFire],
            useEffectDuration: true,
            icon: riddleOfFireImage,
            borderColor: '#dc625a',
            sortKey: 0,
            cooldown: 60,
            target: 'you',
            physicalUp: 15,
            magicUp: 15,
        },
        brotherhood: { // 义结金兰：斗气/攻击
            gainEffect: [EffectId.Brotherhood],
            loseEffect: [EffectId.Brotherhood],
            useEffectDuration: true,
            icon: brotherhoodImage,
            borderColor: '#994200',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '桃园',
        },
        // 龙骑
        lanceCharge: { // 猛枪
            gainEffect: [EffectId.LanceCharge],
            loseEffect: [EffectId.LanceCharge],
            useEffectDuration: true,
            icon: lanceChargeImage,
            borderColor: '#831819',
            sortKey: 0,
            cooldown: 60,
            target: 'you',
            physicalUp: 10,
            magicUp: 10,
        },
        litany: { //战斗连祷
            gainEffect: [EffectId.BattleLitany],
            loseEffect: [EffectId.BattleLitany],
            useEffectDuration: true,
            icon: battleLitanyImage,
            borderColor: '#009999',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '连祷',
        },
        lefteye: { // 巨龙左眼
            gainEffect: [EffectId.LeftEye],
            loseEffect: [EffectId.LeftEye],
            useEffectDuration: true,
            icon: leftEyeImage,
            borderColor: '#f85d48',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '左眼',
        },
        righteye: { // 巨龙右眼 单人+双人
            gainEffect: [EffectId.RightEye, aEffectId.RightEye],
            loseEffect: [EffectId.RightEye, aEffectId.RightEye],
            useEffectDuration: true,
            icon: leftEyeImage,
            borderColor: '#fa5437',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 10,
            magicUp: 10,
        },
        // 忍者
        // trick: { // 背刺
        //     activeAbility: [kAbility.TrickAttack],
        //     partyOnly: true,
        //     durationSeconds: 15,
        //     icon: trickAttackImage,
        //     borderColor: '#ff8400',
        //     sortKey: 0,
        //     cooldown: 60,
        //     target: 'boss',
        //     physicalUp: 10,
        //     magicUp: 10,
        // },
        mug: { // 夺取
            activeAbility: [aEffectId.Mug],
            partyOnly: true,
            durationSeconds: 20,
            icon: mugImage,
            borderColor: '#e2b640',
            sortKey: 0,
            cooldown: 120,
            target: 'boss',
            physicalUp: 5,
            magicUp: 5,
            tts: '夺取',
        },
        // 钐镰客
        arcaneCircle: { // 秘环
            gainEffect: [EffectId.ArcaneCircle],
            loseEffect: [EffectId.ArcaneCircle],
            useEffectDuration: true,
            icon: arcaneCircleImage,
            borderColor: '#d459dd',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 3,
            magicUp: 3,
            tts: '秘环',
        },
        // 诗人
        raging: { // 猛者 26|2020-09-20T03:48:12.5040000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||7f5d92a566794a793b65f97686f3699f
            gainEffect: [EffectId.RagingStrikes],
            loseEffect: [EffectId.RagingStrikes],
            useEffectDuration: true,
            icon: ragingStrikesImage,
            borderColor: '#db6509',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 15,
            magicUp: 15,
        },
        battlevoice: { // 战斗之声
            gainEffect: [EffectId.BattleVoice],
            loseEffect: [EffectId.BattleVoice],
            useEffectDuration: true,
            icon: battleVoiceImage,
            borderColor: '#D6371E',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 4,
            magicUp: 4,
            tts: '战斗之声',
        },
        radiantFinale: { // 终章
            gainEffect: [aEffectId.RadiantFinale],
            loseEffect: [aEffectId.RadiantFinale],
            useEffectDuration: true,
            icon: radiantFinaleImage,
            borderColor: '#fdf55a',
            sortKey: 0,
            cooldown: 110,
            target: 'you',
            physicalUp: 6,
            magicUp: 6,
            tts: '终章',
        },
        // 舞娘
        devilment: { // 进攻之探戈
            gainEffect: [EffectId.Devilment],
            loseEffect: [EffectId.Devilment],
            useEffectDuration: true,
            icon: devilmentImage,
            borderColor: '#006400',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 15,
            magicUp: 15,
            tts: '贪个',
        },
        technicalFinish: { // 技巧舞步结束
            gainEffect: [EffectId.TechnicalFinish],
            loseEffect: [EffectId.TechnicalFinish],
            useEffectDuration: true,
            icon: technicalFinishImage,
            borderColor: '#E0757C',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '技巧',
        },
        // 召唤
        searingLight: { // 灼热之光
            gainEffect: [EffectId.SearingLight],
            loseEffect: [EffectId.SearingLight],
            useEffectDuration: true,
            icon: searingLightImage,
            borderColor: '#fdd4fe',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 3,
            magicUp: 3,
            tts: '灼热',
        },
        emboldenIsMe: { // 鼓励(自己给自己) 4d7
            gainEffect: [EffectId.EmboldenSelf],
            loseEffect: [EffectId.EmboldenSelf],
            useEffectDuration: true,
            icon: emboldenImage,
            borderColor: '#bcbce3',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUp: 0,
            magicUp: 5,
            tts: '鼓励',
        },
        emboldenToMe: { // 鼓励(从赤魔得到) 511
            gainEffect: [EffectId.Embolden],
            loseEffect: [EffectId.Embolden],
            useEffectDuration: true,
            icon: emboldenImage,
            borderColor: '#bcbce3',
            sortKey: 1,
            cooldown: 120,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '鼓励',
        },
    }

    // 5.x版本
    static buffInfoV5: { [s: string]: Omit<BuffInfo, 'name'> } = {
        // 骑士
        // 26|2020-09-20T03:31:40.6740000+08:00|558|安魂祈祷|12.00|1039A1D9|水貂桑|1039A1D9|水貂桑|FF9C|114648|114648||35703e9553d4bf19abcbcd58e0da5257
        requiescat: {
            gainEffect: [aEffectId.Requiescat],
            loseEffect: [aEffectId.Requiescat],
            useEffectDuration: true,
            icon: requiescatImage,
            borderColor: '#2e70f5',
            sortKey: 0,
            cooldown: 60,
            target: 'you',
            physicalUp: 0,
            magicUp: 50,
        },
        // 占星
        ladyOfCrowns: { // 王冠之贵妇
            gainEffect: [EffectId.LadyOfCrowns],
            loseEffect: [EffectId.LadyOfCrowns],
            useEffectDuration: true,
            icon: ladyOfCrownsImage,
            borderColor: '#9e5599',
            sortKey: 0,
            target: 'you',
            meleeUp: 4,
            rangedUp: 5,
            tts: '远卡',
        },
        lordOfCrowns: { // 王冠之领主
            gainEffect: [EffectId.LordOfCrowns],
            loseEffect: [EffectId.LordOfCrowns],
            useEffectDuration: true,
            icon: lordOfCrownsImage,
            borderColor: '#9a2222',
            sortKey: 0,
            target: 'you',
            meleeUp: 8,
            rangedUp: 4,
            tts: '近卡',
        },
        // 武僧
        riddleOfFire: { // 红莲
            gainEffect: [aEffectId.RiddleOfFire],
            loseEffect: [aEffectId.RiddleOfFire],
            useEffectDuration: true,
            icon: riddleOfFireImage,
            borderColor: '#dc625a',
            sortKey: 0,
            cooldown: 90,
            target: 'you',
            physicalUp: 25,
            magicUp: 25,
        },
        brotherhood: { // 义结金兰：斗气/攻击
            gainEffect: [EffectId.Brotherhood],
            loseEffect: [EffectId.Brotherhood],
            useEffectDuration: true,
            icon: brotherhoodImage,
            borderColor: '#994200',
            sortKey: 0,
            cooldown: 90,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '桃园',
        },
        // 龙骑
        lanceCharge: { // 猛枪
            gainEffect: [EffectId.LanceCharge],
            loseEffect: [EffectId.LanceCharge],
            useEffectDuration: true,
            icon: lanceChargeImage,
            borderColor: '#831819',
            sortKey: 0,
            cooldown: 90,
            target: 'you',
            physicalUp: 15,
            magicUp: 15,
        },
        litany: { //战斗连祷
            gainEffect: [EffectId.BattleLitany],
            loseEffect: [EffectId.BattleLitany],
            useEffectDuration: true,
            icon: battleLitanyImage,
            borderColor: '#009999',
            sortKey: 0,
            cooldown: 180,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '连祷',
        },
        // 诗人
        raging: { // 猛者 26|2020-09-20T03:48:12.5040000+08:00|7d|猛者强击|20.00|1039A1D9|水貂桑|1039A1D9|水貂桑|00|111340|111340||7f5d92a566794a793b65f97686f3699f
            gainEffect: [EffectId.RagingStrikes],
            loseEffect: [EffectId.RagingStrikes],
            useEffectDuration: true,
            icon: ragingStrikesImage,
            borderColor: '#db6509',
            sortKey: 0,
            cooldown: 80,
            target: 'you',
            physicalUp: 10,
            magicUp: 10,
        },
        // 召唤
        devotion: { // 灵护
            gainEffect: [EffectId.Devotion],
            loseEffect: [EffectId.Devotion],
            useEffectDuration: true,
            icon: devotionImage,
            borderColor: '#ffbf00',
            sortKey: 0,
            cooldown: 180,
            target: 'you',
            physicalUp: 5,
            magicUp: 5,
            tts: '灵护',
        },
        // 赤魔
        emboldenIsMe: { // 鼓励(自己给自己) 4d7
            gainEffect: [EffectId.EmboldenSelf],
            loseEffect: [EffectId.EmboldenSelf],
            useEffectDuration: true,
            icon: emboldenImage,
            borderColor: '#bcbce3',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUpCount: {'05': 0, '04': 0, '03': 0, '02': 0, '01': 0}, // 物理增伤
            magicUpCount: {'05': 10, '04': 8, '03': 6, '02': 4, '01': 2}, // 魔法增伤
            tts: '鼓励',
        },
        emboldenToMe: { // 鼓励(从赤魔得到) 511
            gainEffect: [EffectId.Embolden],
            loseEffect: [EffectId.Embolden],
            useEffectDuration: true,
            icon: emboldenImage,
            borderColor: '#bcbce3',
            sortKey: 0,
            cooldown: 120,
            target: 'you',
            physicalUpCount: {'05': 10, '04': 8, '03': 6, '02': 4, '01': 2}, // 物理增伤
            magicUpCount: {'05': 0, '04': 0, '03': 0, '02': 0, '01': 0}, // 魔法增伤
            tts: '鼓励',
        },
    }
}

