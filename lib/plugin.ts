'use strict';
import { Options, MSALBasic } from './src/types';
import { MSAL } from './src/main';
import { mixin } from "./mixin";
export const msalMixin = mixin;

export default class msalPlugin {
    static install(Vue: any, options: Options): void {
        Vue.prototype.$msal = new msalPlugin(options, Vue);
    }
    constructor(options: Options, Vue: any = undefined) {
        const msal = new MSAL(options);
        if (Vue && options.framework && options.framework.globalMixin) {
            Vue.mixin(mixin);
        }
        const exposed: MSALBasic = {
            data: msal.data,
            async signIn() { await msal.signIn(); },
            async signOut() { await msal.signOut(); },
            async getTokenPopup() { await msal.getTokenPopup(); },
            isAuthenticated() { return msal.isAuthenticated(); },
            saveCustomData(key: string, data: any) { msal.saveCustomData(key, data); }
        };
        return exposed;
    }
}
