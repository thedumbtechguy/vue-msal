import * as msal from "@azure/msal-browser";

import { iMSAL, DataObject, Options, Auth, CacheOptions, Request, User } from './types';

export class MSAL implements iMSAL {
    private msalLibrary: any;
    public data: DataObject = {
        isAuthenticated: false,
        accessToken: '',
        idToken: '',
        user: { name: '', userName: ''},
        custom: {}
    };
    // Config object to be passed to Msal on creation.
    // For a full list of msal.js configuration parameters, 
    // visit https://azuread.github.io/microsoft-authentication-library-for-js/docs/msal/modules/_authenticationparameters_.html
    private auth: Auth = {
        clientId: "",
        authority: "",
        redirectUri: "",
        onAuthentication: (error, response) => {},
        onToken: (error, response) => {},
        beforeSignOut: () => {}
    };
    private cache: CacheOptions = {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    };
    // Add here scopes for id token to be used at MS Identity Platform endpoints.
    private loginRequest: Request = {
        scopes: ["openid", "profile", "User.Read"]
    };

    // Add here scopes for access token to be used at MS Graph API endpoints.
    private tokenRequest: Request = {
        scopes: ["User.Read"]
    };

    constructor(options: Options) {
        if (!options.auth.clientId) {
            throw new Error('auth.clientId is required');
        }
        this.auth = Object.assign(this.auth, options.auth);
        this.cache = Object.assign(this.cache, options.cache);
        this.loginRequest = Object.assign(this.loginRequest, options.loginRequest);
        this.tokenRequest = Object.assign(this.tokenRequest, options.tokenRequest);
        
        const config: msal.Configuration = {
            auth: this.auth,
            cache: this.cache
        }
        this.msalLibrary = new msal.PublicClientApplication(config);
        this.signIn()
    }
    signIn() {
        this.msalLibrary.loginPopup(this.loginRequest).then(loginResponse => {
            console.log('id_token and access token acquired at: ' + new Date().toString());
            // set data attributes
            this.handleLoginResponse(loginResponse)
        }).catch(error => {
            console.error(error);
        });   
    }
    signOut() {
        this.msalLibrary.logout()
    }
    getTokenPopup() {
        console.log('in get token popup!');
        return this.msalLibrary.acquireTokenSilent(this.loginRequest).catch(error => {
            console.warn(error);
            console.warn("silent token acquisition fails. acquiring token using popup");

            // fallback to interaction when silent call fails
            return this.msalLibrary.acquireTokenPopup(this.loginRequest)
                .then(tokenResponse => {
                    console.log('token popup response: ');
                    console.log(tokenResponse);
                    
                    return tokenResponse;
                }).catch(error => {
                    console.error(error);
                });
        });
    }
    isAuthenticated() {
        return this.data.isAuthenticated
    }
    private handleLoginResponse(response) {
        if (response !== null) {
            this.data.idToken = response.idToken;
            this.data.accessToken = response.accessToken;
            this.data.user.name = response.account.name;
            this.data.user.userName = response.account.userName;
        } else {
            let account = this.msalLibrary.getAccount()
            if (account !== null) {
                console.log(account);
                this.data.idToken = account.idToken;
                this.data.accessToken = ''
                this.data.user.name = account.name;
                this.data.user.userName = account.userName;
            }
        }
    }
}
