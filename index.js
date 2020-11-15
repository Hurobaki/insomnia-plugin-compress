const iconv = require('iconv-lite')
const { findKeyValue } = require('./parsers/object.parser')
const { findObjectByValue } = require('./parsers/object.parser')
const { deflateToBase64 } = require('./algortihms/deflate')
const { encodeBase64 } = require('./algortihms/base64')
const { xmlToJson } = require('./parsers/xml.parser')

const OPTIONS = {
    rawValue: 'rawValue',
    rawBody: 'rawBody',
}

const ALGORITHM_OPTIONS = {
    deflateBase64: 'deflateBase64',
    base64: 'base64',
    xmlToJson: 'xmlToJson',
    none: '',
}

module.exports.templateTags = [
    {
        name: 'format',
        displayName: 'Format',
        description: 'Format value with chosen method',
        args: [
            {
                displayName: 'Value to format',
                type: 'enum',
                options: [
                    {
                        displayName: 'Raw Value - custom given value',
                        description: 'Whatever given value',
                        value: OPTIONS.rawValue,
                    },
                    {
                        displayName: 'Raw Body - entire response body',
                        description: 'Use request response body',
                        value: OPTIONS.rawBody,
                    },
                ],
            },
            {
                type: 'string',
                encoding: 'base64',
                hide: (args) => args[0].value === OPTIONS.rawBody,
                displayName: 'Value',
            },
            {
                displayName: 'Request',
                type: 'model',
                model: 'Request',
                help: 'Only if you selected Raw Body',
                hide: (args) => args[0].value === OPTIONS.rawValue,
            },
            {
                displayName: 'Algorithm / Hash / Encode / Format',
                type: 'enum',
                options: [
                    {
                        displayName: 'None',
                        value: ALGORITHM_OPTIONS.none,
                    },
                    {
                        displayName: 'Deflate and base64 encode',
                        value: ALGORITHM_OPTIONS.deflateBase64,
                        description: 'Deflate and encode to base64 given value',
                    },
                    {
                        displayName: 'Base64 encode',
                        value: ALGORITHM_OPTIONS.base64,
                        description: 'Encode to base64 given value',
                    },
                    {
                        displayName: 'Base64 decode',
                        value: 'none',
                        description: 'Decode base64 given value',
                    },
                    {
                        displayName: 'Convert XML/Soap to JSON',
                        value: ALGORITHM_OPTIONS.xmlToJson,
                        description: 'Convert XML/Soap to JSON object',
                    },
                ],
            },

            {
                displayName: 'Filter',
                type: 'string',
                placeholder: "JSON key's value to extract",
                hide: (args) => args[3].value !== ALGORITHM_OPTIONS.xmlToJson,
            },
        ],
        async run(context, input, value, requestId, algorithm, filter) {
            console.log('### algorithm', algorithm)
            let valueToFormat

            if (![...Object.values(OPTIONS)].includes(input)) {
                throw new Error(`Invalid value field ${input}`)
            }

            if (input === OPTIONS.rawBody) {
                if (!requestId) {
                    throw new Error('No request specified')
                }

                const request = await context.util.models.request.getById(
                    requestId
                )
                if (!request) {
                    throw new Error(`Could not find request ${requestId}`)
                }

                const environmentId = context.context.getEnvironmentId()
                let response = await context.util.models.response.getLatestForRequestId(
                    requestId,
                    environmentId
                )

                let shouldResend = true

                // Make sure we only send the request once per render so we don't have infinite recursion
                const fromResponseTag = context.context.getExtraInfo(
                    'fromResponseTag'
                )
                if (fromResponseTag) {
                    console.log('[response tag] Preventing recursive render')
                    shouldResend = false
                }

                if (shouldResend && context.renderPurpose === 'send') {
                    console.log('[response tag] Resending dependency')
                    response = await context.network.sendRequest(request, [
                        { name: 'fromResponseTag', value: true },
                    ])
                }

                if (!response) {
                    console.log('[response tag] No response found')
                    throw new Error('No responses for request')
                }

                const bodyBuffer = context.util.models.response.getBodyBuffer(
                    response,
                    ''
                )

                const match = response.contentType.match(/charset=([\w-]+)/)
                const charset = match && match.length >= 2 ? match[1] : 'utf-8'

                let body

                try {
                    body = iconv.decode(bodyBuffer, charset)
                } catch (e) {
                    console.warn('[response] Failed to decode body', e)
                    body = bodyBuffer.toString()
                }

                if (!algorithm) {
                    return body
                }

                valueToFormat = body
            } else if (input === OPTIONS.rawValue) {
                const emptyString = 'b64::::46b'

                if (!value || value === emptyString) {
                    throw new Error('Please enter a value')
                }

                valueToFormat = value
            }

            if (algorithm === ALGORITHM_OPTIONS.deflateBase64) {
                try {
                    return deflateToBase64(valueToFormat.trim())
                } catch (e) {
                    throw new Error(
                        `[compress] Failed to compress using ${ALGORITHM_OPTIONS.deflateBase64} algorithm. Reason: ${e}`
                    )
                }
            } else if (algorithm === ALGORITHM_OPTIONS.base64) {
                return encodeBase64(valueToFormat)
            } else if (algorithm === ALGORITHM_OPTIONS.xmlToJson) {
                try {
                    let json = await xmlToJson(valueToFormat, {})

                    if (filter) {
                        json = findKeyValue(
                            findObjectByValue(json, filter),
                            '_'
                        )
                    }

                    return json
                } catch (e) {
                    throw new Error(
                        `[parse xml] Failed to parse XML to JSON ${e}`
                    )
                }
            }
        },
    },
]
