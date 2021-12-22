module.exports = {
    openapi: "3.0.3",
    info: {
        title: 'Facebook Backend Clone',
        description: 'An api study like Facebook requirements',
        version: '1.0.0',
        contact: {
            name: 'AEA',
            mail: 'testaea@gmail.com'
        },
    },
    servers: [
        { url: 'http://localhost:5000/api/v1', description: 'Local server' }
    ],
    tags: [
        { name: 'Users' }
    ],
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: "String",
                        description: 'Mongo Document Id',
                        example: '61bb0fa2b09a92374cfcf2f6'
                    },
                }
            },
            Post: {},
            Comment: {}
        }
    },

}