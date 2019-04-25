const AWS = require('aws-sdk'),
    crypto = require('crypto'),
    documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    if (event.body) event.body = JSON.parse(event.body)

    if (!event.body || !event.body.login || !event.body.password) {
        let message = "";

        if (!event.body || !event.body.login) message += "Missing 'login' property on request body. Please check. ";
        if (!event.body || !event.body.password) message += "Missing 'password' property on request body. Please check. ";

        callback(
            null, {
                statusCode: 500,
                body: JSON.stringify(message)
            }
        );
        return;
    }

    getUserByLogin(event.body.login).then((data) => {
        const encryptedPassword = crypto.createHash('md5').update(event.body.password).digest("hex");

        if (data.Items.length !== 1 || data.Items[0].password !== encryptedPassword) {

            const response = {
                message: "",
                statusCode: 500
            };

            if (data.Items.length !== 1) response.message += "User does not exist. Please check. ";
            else if (data.Items[0].password !== encryptedPassword) {
                response.message += "Bad credentials. Please check. ";
                response.statusCode = 403;
            }

            response.message = JSON.stringify(response.message);

            callback(
                null,
                response
            );
            return;
        }

        data.Items[0].password = undefined

        callback(
            null, {
                statusCode: 200,
                body: JSON.stringify({
                    data: data.Items[0]
                })
            }
        );
    }).catch((err) => {
        console.error(err);
        callback(
            null, {
                statusCode: 500,
                body: JSON.stringify(err)
            }
        );
    });
};

function getUserByLogin(login) {
    return documentClient.query({
        TableName: "user",
        IndexName: "login-index",
        KeyConditionExpression: "#login = :login",
        ExpressionAttributeNames: {
            "#login": "login"
        },
        ExpressionAttributeValues: {
            ":login": login
        }
    }).promise();
}