import msal from "msal";
import conf from "msal/lib-commonjs/Configuration";
import { AxiosRequestConfig } from "axios";

export type AuthError = msal.AuthError;
export type AuthResponse = msal.AuthResponse;

export type Auth = {
    clientId: string,
    authority? : string,
    tenantId?: string,
    tenantName?: string,
    knownAuthorities?: Array<string>;
    cloudDiscoveryMetadata?: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    navigateToLoginRequestUrl?: boolean
    validateAuthority?: boolean;
    requireAuthOnInitialize?: boolean,
    autoRefreshToken?: boolean,
    onAuthentication: (ctx: object, error: AuthError, response: AuthResponse) => any,
    onToken: (ctx: object, error: AuthError | null, response: AuthResponse | null) => any,
    beforeSignOut: (ctx: object) => any
}

export type Request = {
    scopes?: string[]
}

export type CacheOptions = conf.CacheOptions;
export type SystemOptions = conf.SystemOptions;
export type FrameworkOptions = {
    globalMixin?: boolean
}

export type Options = {
    auth: Auth,
    request?: Request,
    cache?: CacheOptions,
    system?: SystemOptions,
    framework?: FrameworkOptions
}

export type DataObject = {
    isAuthenticated: boolean,
    accessToken: string,
    idToken: string,
    user: object,
    custom: object
}

export type CallbackQueueObject = {
    id: string,
    callback: string,
    arguments: any[]
}

export interface MSALBasic {
    data: DataObject,
    signIn: () => Promise<any> | void,
    signOut: () => Promise<any> | void,
    getTokenPopup: () => Promise<any> | void,
    isAuthenticated: () => boolean
}