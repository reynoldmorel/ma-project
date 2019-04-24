const AWS = require('aws-sdk'),
	crypto = require('crypto'),
	documentClient = new AWS.DynamoDB.DocumentClient();
	
exports.handler = (event, context, callback) => {
    if(!event.queryStringParameters || !event.queryStringParameters.userId || !event.queryStringParameters.currentUserId) {
        let message = "";
        
        if(!event.queryStringParameters || !event.queryStringParameters.userId) message += "Missing 'userId' property on parameters. Please check. ";
        if(!event.queryStringParameters || !event.queryStringParameters.currentUserId) message += "Missing 'currentUserId' property on request body. Please check. ";
        
        callback(
            null, 
            {
                statusCode: 500,
                body: JSON.stringify(message)
            }
        );
        return;
    }
    
    getUserById(event.queryStringParameters.currentUserId).then((currentUser) => {
        if(currentUser && currentUser.roles.indexOf("ADMIN")) {
        
            deleteUser(event.queryStringParameters.userId).then((data) => {
                callback(
                    null, 
                    {
                        statusCode: 200,
                        body: JSON.stringify({data: data, message: "User deleted successfully."})
                    }
                );
            }).catch((err) => {
                console.error(err);
                callback(
                    null, 
                    {
                        statusCode: 500,
                        body: JSON.stringify(err)
                    }
                );
            });
        } else {
            callback(
                null, 
                {
                    statusCode: 401,
                    body: JSON.stringify("User not allowed to execute this action.")
                }
            );            
        }
    }).catch((err) => {
        console.error(err);
        callback(
            null, 
            {
                statusCode: 500,
                body: JSON.stringify(err)
            }
        );
    });
};

function deleteUser(userId) {
    return documentClient.delete({
        TableName: 'user',
        Key:{
            "userId": userId
        }
    }).promise();
}

function getUserById(userId) {
    return documentClient.query({
        TableName : "user",
        IndexName: "userId-index",
        KeyConditionExpression: "#userId = :userId",
        ExpressionAttributeNames:{
            "#userId": "userId"
        },
        ExpressionAttributeValues: {
            ":userId": userId
        }
    }).promise();
}