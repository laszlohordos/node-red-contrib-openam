module.exports = function(RED) {
    'use strict'
    const PolicyAgent = require('@forgerock/openam-agent').PolicyAgent
    const Axios = require('axios')

    function RemoteServerNode(n) {
        RED.nodes.createNode(this, n)
        this.am = new PolicyAgent({
            serverUrl: n.serverUrl,
            username: this.credentials.username,
            password: this.credentials.password,
            realm: n.realm,
            letClientHandleErrors: true,
            logLevel: 'silly'
        })
    }
    RED.nodes.registerType('openam-server', RemoteServerNode, {
        credentials: {
            username: {
                type: "text"
            },
            password: {
                type: "password"
            }
        }
    })

    RemoteServerNode.prototype.serverAddress = function() {
        if (this.am) {
            return this.am.amClient.serverAddress
        }
        return ''
    }
    RemoteServerNode.prototype.realm = function() {
        return this.am.options.realm || '/'
    }

    RemoteServerNode.prototype.crestCreateRequest = async function(resourcePath, id, data, realmParam) {
        let newId = id
        let content = data
        let realm = realmParam
        if (typeof newId === 'object') {
            newId = null
            content = newId
            realm = content
        }
        if (typeof resourcePath !== 'string' || typeof content !== 'object') {
            throw Error('invalid create parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            if (typeof newId === 'string') {
                return Axios.put(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}/${newId}`, content, {
                    headers: {
                        [cookieName]: tokenId,
                        host: self.am.amClient.hostname,
                        'Content-Type': 'application/json',
                        'Accept-API-Version': 'protocol=2.0,resource=1.0',
                        'If-None-Match': '*'
                    },
                    params: {
                        realm: realm || self.am.options.realm || '/'
                    }
                }).then(res => res.data);
            } else {
                return Axios.post(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, content, {
                    headers: {
                        [cookieName]: tokenId,
                        host: self.am.amClient.hostname,
                        'Content-Type': 'application/json',
                        'Accept-API-Version': 'protocol=2.0,resource=1.0'
                    },
                    params: {
                        _action: 'create',
                        realm: self.am.options.realm || '/'
                    }
                }).then(res => res.data);
            }
        }, 2, 'crestCreateRequest')
    }

    RemoteServerNode.prototype.crestReadRequest = async function(resourcePath, realm) {
        if (typeof resourcePath !== 'string') {
            throw Error('invalid read parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios.get(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, {
                    headers: {
                        [cookieName]: tokenId,
                        host: self.am.amClient.hostname,
                        'Content-Type': 'application/json',
                        'Accept-API-Version': 'protocol=2.0,resource=1.0'
                    },
                    params: {
                        realm: realm || self.am.options.realm || '/'
                    }
                })
                .then(res => res.data);

        }, 2, 'crestReadRequest')
    }

    RemoteServerNode.prototype.crestUpdateRequest = async function(resourcePath, content, realm) {
        if (typeof resourcePath !== 'string' || typeof content !== 'object') {
            throw Error('invalid input parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios.put(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, content, {
                headers: {
                    [cookieName]: tokenId,
                    host: self.am.amClient.hostname,
                    'Content-Type': 'application/json',
                    'Accept-API-Version': 'protocol=2.0,resource=1.0',
                    'If-Match': '*'
                },
                params: {
                    realm: realm || self.am.options.realm || '/'
                }
            }).then(res => res.data);
        }, 2, 'crestUpdateRequest')
    }

    RemoteServerNode.prototype.crestDeleteRequest = async function(resourcePath, realm) {
        if (typeof resourcePath !== 'string') {
            throw Error('invalid delete parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios.delete(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, {
                headers: {
                    [cookieName]: tokenId,
                    host: self.am.amClient.hostname,
                    'Content-Type': 'application/json',
                    'Accept-API-Version': 'protocol=2.0,resource=1.0',
                    'If-Match': '*'
                },
                params: {
                    realm: realm || self.am.options.realm || '/'
                }
            }).then(res => res.data);
        }, 2, 'crestDeleteRequest')
    }

    RemoteServerNode.prototype.crestPatchRequest = async function(resourcePath, content, realm) {
        if (typeof resourcePath !== 'string' || typeof content !== 'object') {
            throw Error('invalid patch parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios
                .patch(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, content, {
                    headers: {
                        [cookieName]: tokenId,
                        host: self.am.amClient.hostname,
                        'Content-Type': 'application/json',
                        'Accept-API-Version': 'protocol=2.0,resource=1.0',
                        'If-Match': '*'
                    },
                    params: {
                        realm: realm || self.am.options.realm || '/'
                    }
                }).then(res => res.data);
        }, 2, 'crestPatchRequest')
    }

    RemoteServerNode.prototype.crestActionRequest = async function(resourcePath, action, content, realm) {
        if (typeof resourcePath !== 'string' || typeof action !== 'string' || typeof content !== 'object') {
            throw Error('invalid action parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios.post(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, content, {
                headers: {
                    [cookieName]: tokenId,
                    host: self.am.amClient.hostname,
                    'Content-Type': 'application/json',
                    'Accept-API-Version': 'protocol=2.0,resource=1.0'
                },
                params: {
                    _action: action,
                    realm: realm || self.am.options.realm || '/'
                }
            }).then(res => res.data);
        }, 2, 'crestActionRequest')
    }

    RemoteServerNode.prototype.crestQueryRequest = async function(resourcePath, content, realm) {
        if (typeof resourcePath !== 'string' || typeof content !== 'object' || (typeof content['_queryFilter'] !== 'string' && typeof content['_queryId'] !== 'string')) {
            throw Error('invalid query parameters')
        }
        const self = this
        return this.am.reRequest(async () => {
            const {
                cookieName
            } = await self.am.getServerInfo();
            const {
                tokenId
            } = await self.am.getAgentSession();
            return Axios.get(`${self.am.amClient.serverAddress}/json${resourcePath.startsWith('/') ? resourcePath : '/' + resourcePath}`, {
                headers: {
                    [cookieName]: tokenId,
                    host: self.am.amClient.hostname,
                    'Content-Type': 'application/json',
                    'Accept-API-Version': 'protocol=2.0,resource=1.0'
                },
                params: {
                    ...content,
                    realm: realm || self.am.options.realm || '/'
                }
            }).then(res => res.data);
        }, 2, 'crestQueryRequest')
    }
}
