const AWS = require('aws-sdk'),
	documentClient = new AWS.DynamoDB.DocumentClient();
	
exports.handler = (event, context, callback) => {
    
    if(event.body) event.body = JSON.parse(event.body)
    
    if(!event.body || !event.body.currentUserId || !event.body.userId || !event.body.login) {
        let message = "";
        
        if(!event.body || !event.body.currentUserId) message += "Missing 'currentUserId' property on request body. Please check. ";
        if(!event.body || !event.body.userId) message += "Missing 'userId' property on parameters. Please check. ";
        if(!event.body || !event.body.login) message += "Missing 'login' property on request body. Please check. ";
        
        callback(
            null, 
            {
                statusCode: 500,
                body: JSON.stringify(message)
            }
        );
        return;
    }
    
    getUserById(event.body.currentUserId).then((currentUserResult) => {
        const currentUser = currentUserResult.Item;
        if(currentUser && (currentUser.roles.indexOf("ADMIN") > -1 || currentUser.roles.indexOf("USER") > -1)) {
    
            if(!event.body.roles) event.body.roles = ["DEFAULT"];
            
            getUserByLogin(event.body.login).then((data) => {
                if(data.Items.length > 0 && data.Items[0].userId !== event.body.userId) {
                    callback(
                        null, 
                        {
                            statusCode: 500,
                            body: JSON.stringify("Duplicated login property value. Please check.")
                        }
                    );            
                    return;
                }
                
                const user = {
                    "userId" : event.body.userId,
                    "name": event.body.name ? event.body.name : event.body.login,
                    "login": event.body.login,
                    "roles": event.body.roles,
                    "modifiedBy": currentUser.userId
                };
                
                updateUser(user).then((data) => {
                    callback(
                        null, 
                        {
                            statusCode: 200,
                            body: JSON.stringify({data: data, message: "User updated successfully."})
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

function updateUser(user) {
    return documentClient.update({
        TableName: 'user',
        Key:{
            "userId": user.userId
        },
        UpdateExpression: "set #name = :name, #login = :login, #roles = :roles, #modifiedBy = :modifiedBy",
        ExpressionAttributeNames:{
            "#name": "name",
            "#login": "login",
            "#roles": "roles",
            "#modifiedBy": "modifiedBy"
        },
        ExpressionAttributeValues:{
            ":name": user.name,
            ":login": user.login,
            ":roles": user.roles,
            ":modifiedBy": user.modifiedBy
        }
    }).promise();
}

function getUserByLogin(login) {
    return documentClient.query({
        TableName : "user",
        IndexName: "login-index",
        KeyConditionExpression: "#login = :login",
        ExpressionAttributeNames:{
            "#login": "login"
        },
        ExpressionAttributeValues: {
            ":login": login
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