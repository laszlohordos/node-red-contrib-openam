const rp = require('request-promise')

module.exports = function (RED) {
  function OpenAMOAuth2 (config) {
    RED.nodes.createNode(this, config)
    var node = this

    node.server = RED.nodes.getNode(config.server)

    var node = this

    this.on('input', msg => {
      try {
        node.status({ fill: 'blue', shape: 'dot', text: ' ' })

        // Do the job here, use "rp" for fetching data
        console.log(msg)
      } catch (err) {
        node.status({ fill: 'red', shape: 'dot', text: err.message })
        node.error(err)
        return
      }
    })

    this.on('close', () => {
      node.status({})
    })
  }
  RED.nodes.registerType('openam-oauth2', OpenAMOAuth2)
}
