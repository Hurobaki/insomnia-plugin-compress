const parser = require('xml2json')

module.exports = exports

exports.xmlToJson = (xml, options = {}) => {
    return parser.toJson(xml, {
        object: true,
        sanitize: true,
        trim: true,
        ...options,
    })
}

exports.jsonToXml = () => {}
