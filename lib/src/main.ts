import _ from "lodash";
import * as msal from "@azure/msal-browser";
import {
    Auth,
    Request,
    CacheOptions,
    Options,
    DataObject,
    CallbackQueueObject,
    MSALBasic,
} from './types';

export class MSAL implements MSALBasic {
    private lib: any;
    private tokenExpirationTimers: {[key: string]: undefined | number} = {};
    public data: DataObject = {
        isAuthenticated: false,
        accessToken: '',
        idToken: '',
        user: {},
        custom: {}
    };
    public callbackQueue: CallbackQueueObject[] = [];
    private readonly auth: Auth = {
        clientId: '',
        authority: '',
        tenantId: 'common',
        tenantName: 'login.microsoftonline.com',
        validateAuthority: true,
        redirectUri: window.location.href,
        postLogoutRedirectUri: window.location.href,
        navigateToLoginRequestUrl: true,
        requireAuthOnInitialize: false,
        autoRefreshToken: true,
        onAuthentication: (error, response) => {},
        onToken: (error, response) => {},
        beforeSignOut: () => {}
    };
    private readonly cache: CacheOptions = {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true
    };
    private readonly request: Request = {
        scopes: ["user.read"]
    };
    constructor(private readonly options: Options) {
        if (!options.auth.clientId) {
            throw new Error('auth.clientId is required');
        }
        this.auth = Object.assign(this.auth, options.auth);
        this.cache = Object.assign(this.cache, options.cache);
        this.request = Object.assign(this.request, options.request);

        this.lib = new msal.PublicClientApplication({
            auth: {
                clientId: this.auth.clientId,
                authority: this.auth.authority || `https://login.microsoftonline.com/${this.auth.tenantId}`,
                redirectUri: this.auth.redirectUri,
                postLogoutRedirectUri: this.auth.postLogoutRedirectUri,
                navigateToLoginRequestUrl: this.auth.navigateToLoginRequestUrl
            },
            cache: this.cache,
            system: options.system
        });

        if (this.auth.requireAuthOnInitialize) {
            this.signIn()
        }
        this.data.isAuthenticated = this.isAuthenticated();
        if (this.data.isAuthenticated) {
            const currentAccounts = this.lib.getAllAccounts();
            if (currentAccounts === null) {
                // No user signed in
                return;
            } else if (currentAccounts.length > 1) {
                // More than one user signed in, find desired user with getAccountByUsername(username)
            } else {
                console.log('loggin in : ' + currentAccounts[0])
            }
        }
        this.getStoredCustomData();
    }
    isAuthenticated() {
        return !this.lib.isCallback(window.location.hash) && !!this.lib.getAccount();
    }
    // CUSTOM DATA
    saveCustomData(key: string, data: any) {
        if (!this.data.custom.hasOwnProperty(key)) {
            this.data.custom[key] = null;
        }
        this.data.custom[key] = data;
        this.storeCustomData();
    }
    private storeCustomData() {
        if (!_.isEmpty(this.data.custom)) {
            this.lib.store.setItem('msal.custom', JSON.stringify(this.data.custom));
        } else {
            this.lib.store.removeItem('msal.custom');
        }
    }
    private getStoredCustomData() {
        let customData = {};
        const customDataStr = this.lib.store.getItem('msal.custom');
        if (customDataStr) {
            customData = JSON.parse(customDataStr);
        }
        this.data.custom = customData;
    }
    async signIn() {
        try {
            const loginResponse = await this.lib.loginPopup(this.request);
        } catch (err) {
            console.log(err)
        }
    }

    signOut() {
        this.lib.logout()
    }

    async getTokenPopup() {
        return await this.lib.acquireTokenSilent(this.request).catch(async (error) => {
            console.log("silent token acquisition fails. acquiring token using popup");
            // fallback to interaction when silent call fails
            return await this.lib.acquireTokenPopup(this.request).catch(error => {
                console.log('error!' + error)
            });
        });
    }
}
