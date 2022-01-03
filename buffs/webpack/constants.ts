export const cactbotModules = {
  buff: 'Buff/buff',
  settings: 'Buff/settings'
};

export const cactbotChunks = {};

export const cactbotHtmlChunksMap = {
  'Buff/buff.html': {
    chunks: [
      cactbotModules.buff,
    ],
  },
  'Buff/settings.html': {
    chunks: [
        cactbotModules.settings,
    ]
  }
};
