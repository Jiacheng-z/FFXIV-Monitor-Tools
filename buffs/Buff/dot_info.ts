import Effect_id from "../cactbot/resources/effect_id";
// 战士
const surgingTempestImage = '../resources/images/000264.png'; // 红斩
// 骑士
// const goringBladeImage = '../resources/images/002506.png'; // 沥血剑
// 白魔
const diaImage = '../resources/images/002641.png'; // 天辉
// 学者
const biolysisImage = '../resources/images/002820.png'; // 蛊毒法
// 占星
const combustIIIImage = '../resources/images/003554.png'; // 焚灼
// 贤者
const eukrasianDosisIiiImage = '../resources/images/003682.png'; // 焚灼
// 武僧
// const demolishIiiImage = '../resources/images/000204.png'; // 破碎拳
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
const highThunderImage = '../resources/images/high_thunder.png';
// 召唤
// const bioIIIImage = '../resources/images/002689.png';
// const miasmaIIIImage = '../resources/images/002690.png';

// https://xivapi.com/docs/Icons 图标来源

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
        // goringBlade: {
        //     gainEffect: [Effect_id.GoringBlade],
        //     loseEffect: [Effect_id.GoringBlade],
        //     icon: goringBladeImage,
        //     borderColor: '#85421a',
        //     sortKey: 0,
        //     attackType: 'physical',
        //     tts: false,
        // },
        // 白魔
        dia: {
            gainEffect: [Effect_id.Dia_74F],
            loseEffect: [Effect_id.Dia_74F],
            icon: diaImage,
            borderColor: '#3eb9fa',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 学者
        biolysis: {
            gainEffect: [Effect_id.Biolysis_767],
            loseEffect: [Effect_id.Biolysis_767],
            icon: biolysisImage,
            borderColor: '#2e1fc4',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 占星
        combustIII: {
            gainEffect: [Effect_id.CombustIii_759],
            loseEffect: [Effect_id.CombustIii_759],
            icon: combustIIIImage,
            borderColor: '#62daf8',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 贤者
        eukrasianDosisIii: {
            gainEffect: [Effect_id.EukrasianDosisIii_A38],
            loseEffect: [Effect_id.EukrasianDosisIii_A38],
            icon: eukrasianDosisIiiImage,
            borderColor: '#c4acf6',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 武僧
        // demolish: {
        //     gainEffect: [Effect_id.Demolish_F6],
        //     loseEffect: [Effect_id.Demolish_F6],
        //     icon: demolishIiiImage,
        //     borderColor: '#f5cc19',
        //     sortKey: 0,
        //     attackType: 'physical',
        //     tts: false,
        // },
        // 龙骑
        chaosThrust: {
            gainEffect: [Effect_id.ChaosThrust_76],
            loseEffect: [Effect_id.ChaosThrust_76],
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
            gainEffect: [Effect_id.Higanbana_4CC],
            loseEffect: [Effect_id.Higanbana_4CC],
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
            gainEffect: [Effect_id.Stormbite_4B1],
            loseEffect: [Effect_id.Stormbite_4B1],
            icon: stormbiteImage,
            borderColor: '#3df6fd',
            sortKey: 0,
            attackType: 'physical',
            tts: true,
        },
        causticBite: {
            gainEffect: [Effect_id.CausticBite_4B0],
            loseEffect: [Effect_id.CausticBite_4B0],
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
        highThunder: {
            gainEffect: [Effect_id.HighThunder_F1F],
            loseEffect: [Effect_id.HighThunder_F1F],
            icon: highThunderImage,
            borderColor: '#b850e8',
            sortKey: 0,
            attackType: 'magic',
            tts: true,
        },
        // 召唤
        // bioIII: {
        //     gainEffect: [Effect_id.BioIii_4BE],
        //     loseEffect: [Effect_id.BioIii_4BE],
        //     icon: bioIIIImage,
        //     borderColor: '#e3e02d',
        //     sortKey: 0,
        //     attackType: 'magic',
        //     tts: true,
        // },
        // miasmaIII: {
        //     gainEffect: [Effect_id.MiasmaIii_4BF],
        //     loseEffect: [Effect_id.MiasmaIii_4BF],
        //     icon: miasmaIIIImage,
        //     borderColor: '#97abe0',
        //     sortKey: 0,
        //     attackType: 'magic',
        //     tts: false,
        // },
    }
}

