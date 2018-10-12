module.exports = function(RED) {
    function AMCrest(config) {
        RED.nodes.createNode(this, config)
        const server = RED.nodes.getNode(config.server)
        const node = this
        this.on('input', (msg) => {
            if (typeof msg.payload === 'object') {
                const realm = msg.realm || config.realm
                let result = null
                switch (config.op) {
                    case 'create':
                        {
                            const id = msg.payload._id || msg.resourceId
                            const path = msg.resourcePath || msg.resourceType || config.resourcePath
                            result = server.crestCreateRequest(path, id, msg.payload, realm)
                            break
                        }
                    case 'read':
                        {
                            const id = msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath
                            result = server.crestReadRequest(id, realm)
                            break
                        }
                    case 'update':
                        {
                            const id = `${msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath}${typeof msg.payload._id === 'string' ? '/' + msg.payload._id : ''}`
                            result = server.crestUpdateRequest(id, msg.payload, realm)
                            break
                        }
                    case 'delete':
                        {
                            const id = `${msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath}${typeof msg.payload._id === 'string' ? '/' + msg.payload._id : ''}`
                            result = server.crestDeleteRequest(id, realm)
                            break
                        }
                    case 'patch':
                        {
                            const id = msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath
                            result = server.crestUpdateRequest(id, msg.payload, realm)
                            break
                        }
                    case 'action':
                        {
                            const id = msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath
                            result = server.crestActionRequest(id, msg.action, msg.payload, realm)
                            break
                        }
                    case 'query':
                        {
                            const id = msg.resourceId || msg.resourcePath || msg.resourceType || config.resourcePath
                            result = server.crestQueryRequest(id, msg.payload, realm)
                            break
                        }
                }
                if (result) {
                    result.then((data) => {
                        msg.payload = data
                        delete msg.realm
                        delete msg.resourceId
                        delete msg.resourcePath
                        delete msg.resourceType
                        node.send([msg, null])
                        node.status({
                            fill: 'green',
                            shape: 'dot',
                            text: ' '
                        })
                    }).catch((error) => {
                        msg.error = error
                        node.send([null, msg])
                        node.status({
                            fill: 'red',
                            shape: 'dot',
                            text: error.name
                        })
                        node.error(error)
                    })
                }
            }
        })
    }
    RED.nodes.registerType('openam-crest', AMCrest)
}
