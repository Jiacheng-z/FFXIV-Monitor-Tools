import UserConfig from '../cactbot/resources/user_config';
import { BaseOptions } from '../cactbot/types/data';
import { Job } from '../cactbot/types/job';

import { BuffInfo } from './buff_tracker';

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

  PhysicalFontSize: number;
  MagicFontSize: number;

  BigBuffIconWidth: number;
  BigBuffIconHeight: number;
  BigBuffBarHeight: number;
  BigBuffTextHeight: number;
  BigBuffBorderSize: number;
  BigBuffBarMaxWidth: number;
  BigBuffNoticeTTSOn: boolean;

  DotIconWidth: number;
  DotIconHeight: number;
  DotBarHeight: number;
  DotTextHeight: number;
  DotBorderSize: number;
  DotNoticeLessThanSecond: number;
  DotNoticeTTS: string;

  GpAlarmPoint: number;
  GpAlarmSoundVolume: number;
  NotifyExpiredProcsInCombat: number;
  NotifyExpiredProcsInCombatSound: 'disabled' | 'expired' | 'threshold';
  CompactView: boolean;
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

  PhysicalFontSize: 20,
  MagicFontSize: 20,

  BigBuffIconWidth: 32,
  BigBuffIconHeight: 20,
  BigBuffBarHeight: 20,
  BigBuffTextHeight: 0,
  BigBuffBorderSize: 0,
  BigBuffBarMaxWidth: 250, // 30秒团辅进度条最大宽度
  BigBuffNoticeTTSOn: true,

  DotIconWidth: 32,
  DotIconHeight: 25,
  DotBarHeight: 5,
  DotTextHeight: 0,
  DotBorderSize: 1,
  DotNoticeLessThanSecond: 7, // <0 取消提醒, >0 剩余n秒时提醒
  DotNoticeTTS: "续DoT", // 提醒语音

  GpAlarmPoint: 0,
  GpAlarmSoundVolume: 0.8,
  NotifyExpiredProcsInCombat: 5,
  NotifyExpiredProcsInCombatSound: 'threshold',
  CompactView: false,
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
