const zlib = require('zlib')
const { encodeBase64 } = require('./base64')

module.exports = exports

exports.deflate = () => {}

exports.deflateToBase64 = (input) =>
    new Promise((resolve, reject) => {
        zlib.deflate(input, (err, buffer) => {
            if (err) {
                reject(`Cannot deflate ${err}`)
            }

            resolve(encodeBase64(buffer))
        })
    })
