module.exports = function(RED) {
    'use strict'
    const rp = require('request-promise')
    const errors = require('request-promise-core/errors')

    function OpenAMOAuth2(config) {
        RED.nodes.createNode(this, config)
        const clientId = this.credentials.clientId
        const clientSecret = this.credentials.clientSecret

        const server = RED.nodes.getNode(config.server)
        this.serverAddress = server.serverAddress()
        this.configCache = {}

        this.on('input', (msg) => {
            if (typeof msg === 'object' && typeof msg.payload === 'object' &&
                (msg.payload.grantType === 'authorization_code' || msg.payload.grantType === 'password' || msg.payload.grantType === 'client_credentials')) {
                const input = {
                    clientId,
                    clientSecret,
                    ...config,
                    ...msg.payload
                }
                if (input.clientId === '') {
                    input.clientId = clientId
                }
                if (input.clientSecret === '') {
                    input.clientSecret = clientSecret
                }
                if (input.redirectUri === '') {
                    input.redirectUri = config.redirectUri
                }
                this.getOAuth2Token(input, config).then(token => {
                    msg.payload = token
                    this.send([msg])
                    this.status({
                        fill: 'green',
                        shape: 'dot',
                        text: ' '
                    })
                }).catch(error => {
                    if (error instanceof errors.StatusCodeError) {
                        msg.statusCode = error.statusCode
                        msg.payload = error.error
                    } else if (error instanceof errors.RequestError || error instanceof errors.TransformError) {
                        // The request failed due to technical reasons.
                        // reason.cause is the Error object Request would pass into a callback.
                        msg.payload = error
                    } else {
                        msg.payload = {
                            name: error.name,
                            message: error.message
                        }
                        msg.payload = error
                    }
                    this.send([null, msg])
                    this.status({
                        fill: 'red',
                        shape: 'dot',
                        text: error.name
                    })
                    this.error(error)
                })
            }
        })

        this.on('close', () => {
            this.status({})
            this.configCache = {}
        })
    }
    RED.nodes.registerType('openam-oauth2', OpenAMOAuth2, {
        credentials: {
            clientId: {
                type: "text"
            },
            clientSecret: {
                type: "password"
            }
        }
    })

    OpenAMOAuth2.prototype.fetchOpenIDConfiguration = function(realm) {
        if (realm in this.configCache) {
            return this.configCache[realm]
        } else {
            const node = this
            const promise = rp({
                uri: `${this.serverAddress}/oauth2/.well-known/openid-configuration`,
                qs: {
                    '_realm': realm
                },
                json: true
            }).catch(error => {
                delete node.configCache[realm]
            })
            this.configCache[realm] = promise
            return promise
        }
    }

    OpenAMOAuth2.prototype.getOAuth2Token = function(input, config) {
        if (!input.clientId || !input.clientSecret) {
            return Promise.reject(new Error('missing clientId/clientSecret'))
        }

        const ops = {
            method: 'POST',
            //uri: 'https://myiot-am.forgerocklabs.net:443/openam/oauth2/realms/root/realms/edgecontroller/access_token',
            uri: `${this.serverAddress}/oauth2/access_token`,
            qs: {
                'realm': input.realm || '/'
            },
            form: {},
            json: true
        }

        //'Basic'.localeCompare(config.authMethod, 'en', {sensitivity: 'base'})
        if (config.authMethod === 'Basic') {
            ops.auth = {
                user: input.clientId,
                pass: input.clientSecret
            }
        } else {
            ops.form.client_id = input.clientId
            ops.form.client_secret = input.clientSecret
        }

        if (input.grantType === 'authorization_code') {
            ops.form.grant_type = input.grantType
            ops.form.code = input.code
            ops.form.redirect_uri = input.redirectUri
        } else if (input.grantType === 'password') {
            ops.form.grant_type = input.grantType
            ops.form.username = input.username
            ops.form.password = input.password
            if (typeof input.scope === 'string') {
                ops.form.scope = input.scope
            } else if (Array.isArray(input.scope)) {
                ops.form.scope = input.scope.join(' ')
            }
        } else if (input.grantType === 'client_credentials') {
            ops.form.grant_type = input.grantType
            if (typeof input.scope === 'string') {
                ops.form.scope = input.scope
            } else if (Array.isArray(input.scope)) {
                ops.form.scope = input.scope.join(' ')
            }
        }
        return rp(ops)
    }
}
