// tslint:disable
/**
 * MONEI API v1
 * The MONEI API is organized around [REST](https://en.wikipedia.org/wiki/Representational_State_Transfer). Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs. <br/><br/> **Base URL:** https://api.monei.com/v1 <br/><br/> **Client libraries:** <ul>   <li><a target=\"_blank\" href=\"https://github.com/MONEI/monei-php-sdk\">PHP SDK</a></li>   <li><a target=\"_blank\" href=\"https://github.com/MONEI/monei-python-sdk\">Python SDK</a></li>   <li><a target=\"_blank\" href=\"https://github.com/MONEI/monei-node-sdk\">Node.js SDK</a></li>   <li><a target=\"_blank\" href=\"https://postman.monei.com/\">Postman Collection</a></li> </ul>
 *
 * The version of the OpenAPI document: 1.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface ConfigurationParameters {
    apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>);
    username?: string;
    password?: string;
    accessToken?: string | ((name?: string, scopes?: string[]) => string);
    basePath?: string;
    baseOptions?: any;
}

export class Configuration {
    /**
     * parameter for apiKey security
     * @param name security name
     * @memberof Configuration
     */
    apiKey?: string | Promise<string> | ((name: string) => string) | ((name: string) => Promise<string>);
    /**
     * parameter for basic security
     * 
     * @type {string}
     * @memberof Configuration
     */
    username?: string;
    /**
     * parameter for basic security
     * 
     * @type {string}
     * @memberof Configuration
     */
    password?: string;
    /**
     * parameter for oauth2 security
     * @param name security name
     * @param scopes oauth2 scope
     * @memberof Configuration
     */
    accessToken?: string | ((name?: string, scopes?: string[]) => string);
    /**
     * override base path
     * 
     * @type {string}
     * @memberof Configuration
     */
    basePath?: string;
    /**
     * base options for axios calls
     *
     * @type {any}
     * @memberof Configuration
     */
    baseOptions?: any;

    constructor(param: ConfigurationParameters = {}) {
        this.apiKey = param.apiKey;
        this.username = param.username;
        this.password = param.password;
        this.accessToken = param.accessToken;
        this.basePath = param.basePath;
        this.baseOptions = param.baseOptions;
    }
}
