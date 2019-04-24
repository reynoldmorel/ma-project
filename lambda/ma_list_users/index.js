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
    
    getUserById(event.queryStringParameters.currentUserId).then((currentUser) => {
        if(currentUser && currentUser.roles.indexOf("ADMIN")) {
    
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
            IndexName: "name-index",
            Limit: page.pageSize,
            ExclusiveStartKey: page.lastEvaluatedKey,
            KeyConditionExpression: "contains(#login, :login) or contains(#name, :name)",
            ExpressionAttributeNames:{
                "#login": "login",
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":login": page.searchText,
                ":name": page.searchText
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
            IndexName: "name-index",
            KeyConditionExpression: "contains(#login, :login) or contains(#name, :name)",
            ExpressionAttributeNames:{
                "#login": "login",
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":login": page.searchText,
                ":name": page.searchText
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