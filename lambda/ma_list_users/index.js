const AWS = require('aws-sdk'),
	documentClient = new AWS.DynamoDB.DocumentClient();
	
exports.handler = (event, context, callback) => {
    
    if(!event.queryStringParameters || !event.queryStringParameters.currentUserId) {
        let message = "";
        
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
    
    getUserById(event.queryStringParameters.currentUserId).then((currentUserResult) => {
        const currentUser = currentUserResult.Item;
        if(currentUser && currentUser.roles.indexOf("ADMIN") > -1) {
    
            const page = {
                pageSize: event.queryStringParameters ? event.queryStringParameters.pageSize : undefined,
                lastEvaluatedKey: event.queryStringParameters && event.queryStringParameters.lastEvaluatedUserId ? {userId: event.queryStringParameters.lastEvaluatedUserId} : undefined,
                searchText: event.queryStringParameters ? event.queryStringParameters.searchText : undefined
            };
            
            getUsers(page).then((data) => {
                data.Items.forEach(u => u.password = undefined);
                getUsersCount(page).then((count) => {
                    callback(
                        null, 
                        {
                            statusCode: 200,
                            body: JSON.stringify({data: data, count: count})
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

function getUsers(page) {
    if(page.searchText)
        return documentClient.query({
            TableName : "user",
            IndexName: "status-index",
            ExclusiveStartKey: page.lastEvaluatedKey,
            KeyConditionExpression: "#status = :status",
            FilterExpression: "contains(#name, :searchText) or contains(#login, :searchText)",
            ExpressionAttributeNames:{
                "#status": "status",
                "#name": "name",
                "#login": "login"
            },
            ExpressionAttributeValues: {
                ":status": "ACTIVE",
                ":searchText": page.searchText
            }
        }).promise();
    else
        return documentClient.scan({
            TableName : "user",
            Limit: page.pageSize,
            ExclusiveStartKey: page.lastEvaluatedKey
        }).promise();
}

function getUsersCount(page) {
    if(page.searchText)
        return documentClient.query({
            TableName : "user",
            IndexName: "status-index",
            KeyConditionExpression: "#status = :status",
            FilterExpression: "contains(#name, :searchText) or contains(#login, :searchText)",
            ExpressionAttributeNames:{
                "#status": "status",
                "#name": "name",
                "#login": "login"
            },
            ExpressionAttributeValues: {
                ":status": "ACTIVE",
                ":searchText": page.searchText
            },
            Select: "COUNT"
        }).promise();
    else
        return documentClient.scan({
            TableName : "user",
            Select: "COUNT"
        }).promise();
}

function getUserById(userId) {
    return documentClient.get({
        TableName : "user",
        Key:{
            "userId": userId
        }
    }).promise();
}

function getUserById(userId) {
    return documentClient.get({
        TableName : "user",
        Key:{
            "userId": userId
        }
    }).promise();
}