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
            cache: this.cache
        });

        if (this.auth.requireAuthOnInitialize) {
            console.log('requireAuthOnInitialize : ' + this.auth.requireAuthOnInitialize)
            this.signIn()
        }
        this.data.isAuthenticated = this.isAuthenticated();
        if (this.data.isAuthenticated) {
            console.log('isAuthenticated')
            const currentAccounts = this.lib.getAllAccounts();
            if (currentAccounts === null) {
                // No user signed in
                return;
            } else if (currentAccounts.length > 1) {
                // More than one user signed in, find desired user with getAccountByUsername(username)
            } else {
                console.log('logged in : ' + currentAccounts[0].username);
                const token = this.getTokenPopup()
            }
        } else {
            console.log('Not isAuthenticated!')
        }
    }
    isAuthenticated() {
        const currentAccounts = this.lib.getAllAccounts();
        if (currentAccounts === null) {
            // No user signed in
            return false;
        } else if (currentAccounts.length > 1) {
            // More than one user signed in, find desired user with getAccountByUsername(username)
            return true
        } else {
            return true
        }
    }
    async signIn() {
        this.lib.loginPopup(this.request).then(loginResponse => {
            console.log('id_token acquired at: ' + new Date().toString());
            console.log('got account!' + this.lib.getAccount())
        }).catch(error => {
            console.error(error);
        });
    }

    signOut() {
        this.lib.logout()
    }

    async getTokenPopup() {
        return await this.lib.acquireTokenSilent(this.request).catch(async (error) => {
            console.log("silent token acquisition fails. acquiring token using popup: " + error);
            // fallback to interaction when silent call fails
            return this.lib.acquireTokenPopup(this.request)
                .then(tokenResponse => {
                    return tokenResponse;
                }).catch(error => {
                    console.error(error);
                });
        });
    }
}
