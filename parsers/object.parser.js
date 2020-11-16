module.exports = exports

exports.findKeyValue = (obj, keyToFind) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (acc !== 0) return acc

        if (key === keyToFind) {
            return value
        }

        if (typeof value === 'object' && value) {
            return exports.findKeyValue(value, keyToFind)
        }

        return acc
    }, 0)
}

exports.objectHasValue = (obj, valueToFind) => {
    return Object.values(obj).reduce((acc, value) => {
        if (value === valueToFind) {
            return true
        }

        if (typeof value === 'object' && value) {
            return exports.objectHasValue(value, valueToFind)
        }

        return acc
    }, false)
}

exports.findObjectByValue = (obj, valueToFind) => {
    return Object.values(obj).reduce((acc, value) => {
        if (Object.keys(acc).length) {
            return acc
        }

        if (typeof value === 'object' && value) {
            if (exports.objectHasValue(value, valueToFind)) {
                return obj
            }
            return exports.findObjectByValue(value, valueToFind)
        }

        return acc
    }, {})
}
