/*
 * (C) Copyright 2017-2018 OpenVidu (https://openvidu.io/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { MediaMode } from './MediaMode';
import { OpenViduRole } from './OpenViduRole';
import { RecordingLayout } from './RecordingLayout';
import { RecordingMode } from './RecordingMode';
import { SessionProperties } from './SessionProperties';
import { TokenOptions } from './TokenOptions';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export class Session {

    private static readonly API_SESSIONS = '/api/sessions';
    private static readonly API_TOKENS = '/api/tokens';

    sessionId: string;
    properties: SessionProperties;

    private Buffer = require('buffer/').Buffer;

    constructor(private hostname: string, private port: number, private basicAuth: string, properties?: SessionProperties) {
        if (!properties) {
            this.properties = {};
        } else {
            this.properties = properties;
        }
    }

    /**
     * Gets the unique identifier of the Session
     */
    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Gets a new token associated to Session object
     *
     * @returns A Promise that is resolved to the _token_ if success and rejected with an Error object if not
     */
    public generateToken(tokenOptions?: TokenOptions): Promise<string> {
        return new Promise<string>((resolve, reject) => {

            const data = JSON.stringify({
                session: this.sessionId,
                role: (!!tokenOptions && !!tokenOptions.role) ? tokenOptions.role : OpenViduRole.PUBLISHER,
                data: (!!tokenOptions && !!tokenOptions.data) ? tokenOptions.data : ''
            });

            axios.post(
                'https://' + this.hostname + ':' + this.port + Session.API_TOKENS,
                data,
                {
                    headers: {
                        'Authorization': this.basicAuth,
                        'Content-Type': 'application/json'
                    }
                }
            )
                .then(res => {
                    if (res.status === 200) {
                        // SUCCESS response from openvidu-server. Resolve token
                        resolve(res.data.id);
                    } else {
                        // ERROR response from openvidu-server. Resolve HTTP status
                        reject(new Error(res.status.toString()));
                    }
                }).catch(error => {
                    if (error.response) {
                        // The request was made and the server responded with a status code (not 2xx)
                        reject(new Error(error.response.status.toString()));
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.error(error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.error('Error', error.message);
                    }
                });
        });
    }

    /**
     * @hidden
     */
    public getSessionIdHttp(): Promise<string> {
        return new Promise<string>((resolve, reject) => {

            if (!!this.sessionId) {
                resolve(this.sessionId);
            }

            const data = JSON.stringify({
                mediaMode: !!this.properties.mediaMode ? this.properties.mediaMode : MediaMode.ROUTED,
                recordingMode: !!this.properties.recordingMode ? this.properties.recordingMode : RecordingMode.MANUAL,
                defaultRecordingLayout: !!this.properties.defaultRecordingLayout ? this.properties.defaultRecordingLayout : RecordingLayout.BEST_FIT,
                defaultCustomLayout: !!this.properties.defaultCustomLayout ? this.properties.defaultCustomLayout : '',
                customSessionId: !!this.properties.customSessionId ? this.properties.customSessionId : ''
            });

            axios.post(
                'https://' + this.hostname + ':' + this.port + Session.API_SESSIONS,
                data,
                {
                    headers: {
                        'Authorization': this.basicAuth,
                        'Content-Type': 'application/json'
                    }
                }
            )
                .then(res => {
                    if (res.status === 200) {
                        // SUCCESS response from openvidu-server. Resolve token
                        this.sessionId = res.data.id;
                        resolve(this.sessionId);
                    } else {
                        // ERROR response from openvidu-server. Resolve HTTP status
                        reject(new Error(res.status.toString()));
                    }
                }).catch(error => {
                    if (error.response) {
                        // The request was made and the server responded with a status code (not 2xx)
                        if (error.response.status === 409) {
                            // 'customSessionId' already existed
                            this.sessionId = this.properties.customSessionId;
                            resolve(this.sessionId);
                        } else {
                            reject(new Error(error.response.status.toString()));
                        }
                    } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.error(error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.error('Error', error.message);
                    }
                });
        });
    }

}