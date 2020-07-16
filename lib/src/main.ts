import * as msal from "@azure/msal-browser";

import { iMSAL, Account, DataObject, Options, Auth, CacheOptions, Request } from './types';

export class MSAL implements iMSAL {
    private msalLibrary: any;
    public data: DataObject = {
        isAuthenticated: false,
        accessToken: '',
        idToken: '',
        user: { name: '', userName: ''},
        custom: {},
        account: {
            accountIdentifier: "",
            homeAccountIdentifier: "",
            userName: "",
            name: "",
            idToken: {},
            idTokenClaims: {},
            sid: "",
            environment: "",
        }
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
        return this.msalLibrary.loginPopup(this.loginRequest).then(loginResponse => {
            console.log(loginResponse);
            if (loginResponse !== null) {
                this.data.user.userName = loginResponse.account.username;
                this.data.accessToken = loginResponse.accessToken;
                this.data.idToken = loginResponse.idToken;
                this.data.account = loginResponse.account
            } else {
                // need to call getAccount here?
                const currentAccounts = this.msalLibrary.getAllAccounts();
                console.log('all accounts: ');
                console.log(currentAccounts);
                if (currentAccounts === null) {
                    return;
                } else if (currentAccounts.length > 1) {
                    // Add choose account code here
                } else if (currentAccounts.length === 1) {
                    this.data.user.userName = currentAccounts[0].username;
                    this.data.user.userName = currentAccounts[0].name;
                    console.log('this.data: ');
                    console.log(this.data);
                }
            }
            console.log('after handle');
            console.log(this.data);
            
        }).catch(function (error) {
            console.log(error);
        });
    }
    signOut() {
        const logoutRequest = {
            account: this.msalLibrary.getAccountByUsername(this.data.user.userName)
        };
        this.msalLibrary.logout(logoutRequest);
    }
    async getTokenPopup() {
        this.loginRequest.account = this.data.account
        console.log('in get token popup!');
        return await this.msalLibrary.acquireTokenSilent(this.loginRequest).catch(async (error) => {
            console.log("silent token acquisition fails.");
            if (error instanceof msal.InteractionRequiredAuthError) {
                console.log("acquiring token using popup");
                return this.msalLibrary.acquireTokenPopup(this.loginRequest).catch(error => {
                    console.error(error);
                }); 
            } else {
                console.error(error);
            }
        });
    }
    isAuthenticated() {
        return this.msalLibrary.getAllAccounts() !== null
    }
    // handleLoginResponse(response) {
    //     console.log('the response: ');
    //     console.log(response);
    //     console.log('this: ');
    //     console.log(this);
    //     if (response !== null) {
    //         this.data.user.userName = response.account.username;
    //         this.data.account = response.account
    //         console.log('response is not null');
    //         console.log(response);
    //     } else {
    //         // need to call getAccount here?
    //         const currentAccounts = this.msalLibrary.getAllAccounts();
    //         console.log('all accounts: ');
    //         console.log(currentAccounts);
    //         if (currentAccounts === null) {
    //             return;
    //         } else if (currentAccounts.length > 1) {
    //             // Add choose account code here
    //         } else if (currentAccounts.length === 1) {
    //             this.data.user.userName = currentAccounts[0].username;
    //             this.data.user.userName = currentAccounts[0].name;
    //             console.log('this.data: ');
    //             console.log(this.data);
    //         }
    //     }
    //     // if (response !== null) {
    //     //     this.data.idToken = response.idToken;
    //     //     this.data.accessToken = response.accessToken;
    //     //     this.data.user.name = response.account.name;
    //     //     this.data.user.userName = response.account.userName;
    //     // } else {
    //     //     let account = this.msalLibrary.getAccount()
    //     //     if (account !== null) {
    //     //         console.log(account);
    //     //         this.data.idToken = account.idToken;
    //     //         this.data.accessToken = ''
    //     //         this.data.user.name = account.name;
    //     //         this.data.user.userName = account.userName;
    //     //     }
    //     // }
    // }
}
