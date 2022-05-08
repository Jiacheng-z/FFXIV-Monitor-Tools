import Effect_id from "../cactbot/resources/effect_id";
// 战士
const surgingTempestImage = '../resources/images/000264.png'; // 红斩
// 骑士
const goringBladeImage = '../resources/images/002506.png'; // 沥血剑
// 白魔
const diaImage = '../resources/images/002641.png'; // 天辉
// 学者
const biolysisImage = '../resources/images/002820.png'; // 蛊毒法
// 占星
const combustIIIImage = '../resources/images/003554.png'; // 焚灼
// 贤者
const eukrasianDosisIiiImage = '../resources/images/003682.png'; // 焚灼
// 武僧
const demolishIiiImage = '../resources/images/000204.png'; // 破碎拳
// 龙骑
const chaosThrustIiiImage = '../resources/images/000308.png'; // 樱花怒放
const chaoticSpringImage = '../resources/images/chaotic_spring.png'; // 樱花2
// 武士
const higanbanaImage = '../resources/images/003160.png'; // 彼岸花
// 钐镰客
const deathsDesignImage = '../resources/images/003606.png';
// 诗人
const stormbiteImage = '../resources/images/002614.png';
const causticBiteImage = '../resources/images/002613.png';
// 黑魔
const thunderIiiImage = '../resources/images/000459.png';
// 召唤
const bioIIIImage = '../resources/images/002689.png';
const miasmaIIIImage = '../resources/images/002690.png';

// https://xivapi.com/docs/Icons 图标来源
const aEffectId = {
    'Dia': '74F', // 白魔 天辉
    'Biolysis': '767', // 学者 蛊毒法
    'CombustIII': '759', // 占星 焚灼
    'Demolish': 'F6',// 武僧 破碎拳
    'ChaosThrust': '76', // 龙骑 樱花怒放
    'BioIII': '4BE', // 剧毒菌
    'MiasmaIII': '4BF', // 瘴暍
} as const;

export interface DotInfo {
    name: string;
    gainEffect: string[];
    loseEffect: string[];
    icon: string;
    borderColor: string;
    sortKey: number;
    attackType: 'none' | 'physical' | 'magic';
    tts: boolean;
}

export class DotInfoList {
    static dotInfo: { [s: string]: Omit<DotInfo, 'name'> } = {
        // 战士 红斩
        surgingTempest: {
            gainEffect: [Effect_id.SurgingTempest],
            loseEffect: [Effect_id.SurgingTempest],
            icon: surgingTempestImage,
            borderColor: '#e9874a',
            sortKey: 0,
            attackType: 'none',
            tts: true,
        },
        // 骑士 沥血剑
        goringBlade: {
            gainEffect: [Effect_id.GoringBlade],
            loseEffect: [Effect_id.GoringBlade],
            icon: goringBladeImage,
            borderColor: '#85421a',
            sortKey: 0,
            attackType: 'physical',
            tts: false,
        },
        // 白魔
        dia: {
            gainEffect: [aEffectId.Dia],
            loseEffect: [aEffectId.Dia],
            icon: diaImage,
            borderColor: '#3eb9fa',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 学者
        biolysis: {
            gainEffect: [aEffectId.Biolysis],
            loseEffect: [aEffectId.Biolysis],
            icon: biolysisImage,
            borderColor: '#2e1fc4',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 占星
        combustIII: {
            gainEffect: [aEffectId.CombustIII],
            loseEffect: [aEffectId.CombustIII],
            icon: combustIIIImage,
            borderColor: '#62daf8',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 贤者
        eukrasianDosisIii: {
            gainEffect: [Effect_id.EukrasianDosisIii],
            loseEffect: [Effect_id.EukrasianDosisIii],
            icon: eukrasianDosisIiiImage,
            borderColor: '#c4acf6',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 武僧
        demolish: {
            gainEffect: [aEffectId.Demolish],
            loseEffect: [aEffectId.Demolish],
            icon: demolishIiiImage,
            borderColor: '#f5cc19',
            sortKey: 0,
            attackType: 'physical',
            tts: false,
        },
        // 龙骑
        chaosThrust: {
            gainEffect: [aEffectId.ChaosThrust],
            loseEffect: [aEffectId.ChaosThrust],
            icon: chaosThrustIiiImage,
            borderColor: '#83598c',
            sortKey: 0,
            attackType: 'physical',
            tts: false,
        },
        chaoticSpring: {
            gainEffect: [Effect_id.ChaoticSpring],
            loseEffect: [Effect_id.ChaoticSpring],
            icon: chaoticSpringImage,
            borderColor: '#83598c',
            sortKey: 0,
            attackType: 'physical',
            tts: false,
        },
        // 武士
        higanbana: {
            gainEffect: [Effect_id.Higanbana],
            loseEffect: [Effect_id.Higanbana],
            icon: higanbanaImage,
            borderColor: '#d9542a',
            sortKey: 0,
            attackType: 'physical',
            tts: true,
        },
        // 镰刀   DeathsDesign
        deathsDesign: {
            gainEffect: [Effect_id.DeathsDesign],
            loseEffect: [Effect_id.DeathsDesign],
            icon: deathsDesignImage,
            borderColor: '#49298c',
            sortKey: 0,
            attackType: 'none',
            tts: true,
        },
        // 诗人
        stormbite: {
            gainEffect: [Effect_id.Stormbite],
            loseEffect: [Effect_id.Stormbite],
            icon: stormbiteImage,
            borderColor: '#3df6fd',
            sortKey: 0,
            attackType: 'physical',
            tts: true,
        },
        causticBite: {
            gainEffect: [Effect_id.CausticBite],
            loseEffect: [Effect_id.CausticBite],
            icon: causticBiteImage,
            borderColor: '#e053bb',
            sortKey: 0,
            attackType: 'physical',
            tts: false,
        },
        // 黑魔
        thunderIII: {
            gainEffect: [Effect_id.ThunderIii],
            loseEffect: [Effect_id.ThunderIii],
            icon: thunderIiiImage,
            borderColor: '#93d5fd',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 召唤
        bioIII: {
            gainEffect: [aEffectId.BioIII],
            loseEffect: [aEffectId.BioIII],
            icon: bioIIIImage,
            borderColor: '#e3e02d',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        miasmaIII: {
            gainEffect: [aEffectId.MiasmaIII],
            loseEffect: [aEffectId.MiasmaIII],
            icon: miasmaIIIImage,
            borderColor: '#97abe0',
            sortKey: 0,
            attackType: 'magic',
            tts: false,
        },
    }
}

