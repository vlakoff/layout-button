var { ExtensionAPI } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionCommon.sys.mjs"
);
var { AppConstants } = ChromeUtils.importESModule(
  "resource://gre/modules/AppConstants.sys.mjs"
);

var bbDetect = class extends ExtensionAPI {
  getAPI(context) {
    return {
      bbDetect: {
        async getVersionDisplay() {
          return AppConstants.MOZ_APP_VERSION_DISPLAY;
        }
      }
    };
  }
};
