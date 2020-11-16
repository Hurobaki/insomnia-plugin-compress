module.exports = exports

exports.encodeBase64 = (input) => {
    return Buffer.from(input).toString('base64')
}

exports.decodeBase64 = (base64, encoding = 'utf-8') => {
    return Buffer.from(base64, 'base64').toString(encoding)
}
