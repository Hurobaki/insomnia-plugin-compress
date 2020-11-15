const xml2js = require('xml2js')

module.exports = exports

exports.xmlToJson = (xml, options = {}) =>
    new Promise((resolve, reject) => {
        const parser = xml2js.Parser({
            normalizeTags: true,
            explicitChildren: false,
            explicitArray: false,
            preserveChildrenOrder: true,
            ...options,
        })

        parser.parseString(xml, (err, result) => {
            if (err) {
                console.log('### ERROR', err)
                reject(err)
            }
            resolve(result)
        })
    })

exports.jsonToXml = () => {}
