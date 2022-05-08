import UserConfig from '../cactbot/resources/user_config';
import { BaseOptions } from '../cactbot/types/data';
import { Job } from '../cactbot/types/job';
import {BuffInfo} from "./buff_info";

export interface UserConfigOptions {
  Scale: number;

  BigBuffNoticeTTSOn: boolean;
  DotNoticeLessThanSecond: number;
  DotNoticeTTSOn: boolean;
  DotNoticeTTS: string;

  TTSGoringBlade: boolean; // 骑士-沥血剑
  TTSSurgingTempest: boolean; // 战士-红斩
  TTSDia: boolean; // 白魔-天辉
  TTSBiolysis: boolean; // 学者-蛊毒法
  TTSCombustIII: boolean; // 占星-焚灼
  TTSEukrasianDosisIii: boolean; // 贤者-均衡注药
  TTSDemolish: boolean; // 武僧-破碎拳
  TTSChaoticSpring: boolean; // 龙骑-樱花
  TTSHiganbana: boolean; // 武士-彼岸花
  TTSDeathsDesign: boolean; // 镰刀-死亡之影
  TTSStormbite: boolean; // 诗人-狂风蚀箭
  TTSThunderIii: boolean; // 黑魔-暴雷
}

export const defaultUserConfig: UserConfigOptions = {
  Scale: 125,
  BigBuffNoticeTTSOn: true,
  DotNoticeLessThanSecond: 7,
  DotNoticeTTSOn: true,
  DotNoticeTTS: "续DoT", // 提醒语音

  TTSGoringBlade: false, // 骑士-沥血剑
  TTSSurgingTempest: true, // 战士-红斩
  TTSDia: true, // 白魔-天辉
  TTSBiolysis: true, // 学者-蛊毒法
  TTSCombustIII: true, // 占星-焚灼
  TTSEukrasianDosisIii: true, // 贤者-均衡注药
  TTSDemolish: false, // 武僧-破碎拳
  TTSChaoticSpring: false, // 龙骑-樱花
  TTSHiganbana: true, // 武士-彼岸花
  TTSDeathsDesign: true, // 镰刀-死亡之影
  TTSStormbite: true, // 诗人-狂风蚀箭
  TTSThunderIii: true, // 黑魔-暴雷
}

export interface JobsNonConfigOptions {
  JustBuffTracker: boolean;
  LowerOpacityOutOfCombat: boolean;
  OpacityOutOfCombat: number;
  PlayCountdownSound: boolean;
  HideWellFedAboveSeconds: number;
  ShowMPTickerOutOfCombat: boolean;
  MidHealthThresholdPercent: number;
  LowHealthThresholdPercent: number;
  BigBuffShowCooldownSeconds: number;

  Scale: number;
  PhysicalFontSize: number;
  MagicFontSize: number;

  BigBuffIconWidth: number;
  BigBuffIconHeight: number;
  BigBuffBarHeight: number;
  BigBuffBorderSize: number;
  BigBuffBarMaxWidth: number;
  BigBuffNoticeTTSOn: boolean;

  DotIconWidth: number;
  DotIconHeight: number;
  DotBarHeight: number;
  DotBorderSize: number;
  DotNoticeLessThanSecond: number;
  DotNoticeTTSOn: boolean;
  DotNoticeTTS: string;

  GpAlarmPoint: number;
  GpAlarmSoundVolume: number;
  NotifyExpiredProcsInCombat: number;
  NotifyExpiredProcsInCombatSound: 'disabled' | 'expired' | 'threshold';
  CompactView: boolean;

  TTSGoringBlade: boolean; // 骑士-沥血剑
  TTSSurgingTempest: boolean; // 战士-红斩
  TTSDia: boolean; // 白魔-天辉
  TTSBiolysis: boolean; // 学者-蛊毒法
  TTSCombustIII: boolean; // 占星-焚灼
  TTSEukrasianDosisIii: boolean; // 贤者-均衡注药
  TTSDemolish: boolean; // 武僧-破碎拳
  TTSChaoticSpring: boolean; // 龙骑-樱花
  TTSHiganbana: boolean; // 武士-彼岸花
  TTSDeathsDesign: boolean; // 镰刀-死亡之影
  TTSStormbite: boolean; // 诗人-狂风蚀箭
  TTSThunderIii: boolean; // 黑魔-暴雷
}

export interface JobsConfigOptions {
  ShowHPNumber: Job[];
  ShowMPNumber: Job[];
  ShowMPTicker: Job[];

  MaxLevel: number;

  PerBuffOptions: {
    [s: string]: Partial<BuffInfo>;
  };

  FarThresholdOffence: number;
  PldMediumMPThreshold: number;
  PldLowMPThreshold: number;
  DrkMediumMPThreshold: number;
  DrkLowMPThreshold: number;
  /**  One more fire IV and then despair. */
  BlmMediumMPThreshold: number;
  /** Should cast despair. */
  BlmLowMPThreshold: number;
}

const defaultJobsNonConfigOptions: JobsNonConfigOptions = {
  JustBuffTracker: false,
  LowerOpacityOutOfCombat: true,
  OpacityOutOfCombat: 0.5,
  PlayCountdownSound: true,
  HideWellFedAboveSeconds: 15 * 60,
  ShowMPTickerOutOfCombat: false,
  MidHealthThresholdPercent: 0.8,
  LowHealthThresholdPercent: 0.2,
  BigBuffShowCooldownSeconds: 20,

  Scale: 125, // 缩放
  PhysicalFontSize: 20,
  MagicFontSize: 20,

  BigBuffIconWidth: 32,
  BigBuffIconHeight: 20,
  BigBuffBarHeight: 20,
  BigBuffBorderSize: 0,
  BigBuffBarMaxWidth: 250, // 30秒团辅进度条最大宽度
  BigBuffNoticeTTSOn: true,

  DotIconWidth: 32,
  DotIconHeight: 25,
  DotBarHeight: 5,
  DotBorderSize: 1,
  DotNoticeLessThanSecond: 7, // <0 取消提醒, >0 剩余n秒时提醒
  DotNoticeTTSOn: true,
  DotNoticeTTS: "续DoT", // 提醒语音

  GpAlarmPoint: 0,
  GpAlarmSoundVolume: 0.8,
  NotifyExpiredProcsInCombat: 5,
  NotifyExpiredProcsInCombatSound: 'threshold',
  CompactView: false,

  TTSGoringBlade: false, // 骑士-沥血剑
  TTSSurgingTempest: true, // 战士-红斩
  TTSDia: true, // 白魔-天辉
  TTSBiolysis: true, // 学者-蛊毒法
  TTSCombustIII: true, // 占星-焚灼
  TTSEukrasianDosisIii: true, // 贤者-均衡注药
  TTSDemolish: false, // 武僧-破碎拳
  TTSChaoticSpring: false, // 龙骑-樱花
  TTSHiganbana: true, // 武士-彼岸花
  TTSDeathsDesign: true, // 镰刀-死亡之影
  TTSStormbite: true, // 诗人-狂风蚀箭
  TTSThunderIii: true, // 黑魔-暴雷
};

// See user/jobs-example.js for documentation.
const defaultJobsConfigOptions: JobsConfigOptions = {
  ShowHPNumber: ['PLD', 'WAR', 'DRK', 'GNB', 'WHM', 'SCH', 'AST', 'BLU'],
  ShowMPNumber: ['PLD', 'DRK', 'WHM', 'SCH', 'AST', 'BLM', 'BLU'],

  ShowMPTicker: ['BLM'],

  MaxLevel: 80,

  PerBuffOptions: {
    // This is noisy since it's more or less permanently on you.
    // Players are unlikely to make different decisions based on this.
    standardFinish: {
      hide: true,
    },
  },

  FarThresholdOffence: 24,
  PldMediumMPThreshold: 9400,
  PldLowMPThreshold: 3600,
  DrkMediumMPThreshold: 5999,
  DrkLowMPThreshold: 2999,
  // One more fire IV and then despair.
  BlmMediumMPThreshold: 3999,
  // Should cast despair.
  BlmLowMPThreshold: 2399,
};

export interface BuffOptions extends BaseOptions, JobsConfigOptions, JobsNonConfigOptions {}

const Options: BuffOptions = {
  ...UserConfig.getDefaultBaseOptions(),
  ...defaultJobsNonConfigOptions,
  ...defaultJobsConfigOptions,
};

export default Options;
