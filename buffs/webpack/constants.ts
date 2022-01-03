export const cactbotModules = {
  buff: 'buff/buff',
  settings: 'buff/settings'
};

export const cactbotChunks = {};

export const cactbotHtmlChunksMap = {
  'buff/buff.html': {
    chunks: [
      cactbotModules.buff,
    ],
  },
  'buff/settings.html': {
    chunks: [
        cactbotModules.settings,
    ]
  }
};
