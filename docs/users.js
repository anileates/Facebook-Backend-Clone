module.exports = {
    get: {
        tags: ['Get a user'],
        description: 'Get a user',
        operationId: 'getUser',
        parameters: [
            {
                name: 'id', in: 'path', required: true, description: 'A single user id'
            }
        ]
    }
}