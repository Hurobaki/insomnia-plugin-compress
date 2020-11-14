module.exports = exports

exports.encodeBase64 = (input) => {
    return Buffer.from(input).toString('base64')
}

exports.decodeBase64 = () => {}
