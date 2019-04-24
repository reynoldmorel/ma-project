const AWS = require('aws-sdk'),
	uuid = require('uuid'),
	crypto = require('crypto'),
	documentClient = new AWS.DynamoDB.DocumentClient();
	
exports.handler = (event, context, callback) => {
    
    if(event.body) event.body = JSON.parse(event.body)
    
    if(!event.body || !event.body.currentUserId || !event.body.login || !event.body.password) {
        let message = "";
        
        if(!event.body || !event.body.currentUserId) message += "Missing 'currentUserId' property on request body. Please check. ";
        if(!event.body || !event.body.login) message += "Missing 'login' property on request body. Please check. ";
        if(!event.body || !event.body.password) message += "Missing 'password' property on request body. Please check. ";
        
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
        if(currentUser && currentUser.roles.indexOf("ADMIN") > -1) {
    
            if(!event.body.roles) event.body.roles = ["DEFAULT"];
            
            getUserByLogin(event.body.login).then((data) => {
                if(data.Items.length > 0) {
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
                    "userId" : uuid.v1(),
                    "name": event.body.name ? event.body.name : event.body.login,
                    "login": event.body.login,
                    "password": crypto.createHash('md5').update(event.body.password).digest("hex"),
                    "roles": event.body.roles,
                    "modifiedBy": currentUser.userId
                };
                
                putUser(user).then((data) => {
                    callback(
                        null, 
                        {
                            statusCode: 200,
                            body: JSON.stringify({data: data, message: "User created successfully."})
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

function putUser(user) {
    return documentClient.put({
        TableName: 'user',
        Item: user
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