const AWS = require('aws-sdk'),
	crypto = require('crypto'),
	documentClient = new AWS.DynamoDB.DocumentClient();
	
exports.handler = (event, context, callback) => {
    
    if(event.body) event.body = JSON.parse(event.body)
    
    if(!event.body || !event.body.currentUserId || !event.body.login || !event.body.password || !event.body.oldPassword) {
        let message = "";
        
        if(!event.body || !event.body.currentUserId) message += "Missing 'currentUserId' property on request body. Please check. ";
        if(!event.body || !event.body.login) message += "Missing 'login' property on request body. Please check. ";
        if(!event.body || !event.body.password) message += "Missing 'password' property on request body. Please check. ";
        if(!event.body || !event.body.oldPassword) message += "Missing 'oldPassword' property on request body. Please check. ";
        
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

            getUserByLogin(event.body.login).then((data) => {
                
                const encryptedOldPassword = crypto.createHash('md5').update(event.body.oldPassword).digest("hex");
                
                if(data.Items.length === 0 || data.Items[0].password !== encryptedOldPassword) {
        
                    let message = "";
                    
                    if(data.Items.length === 0) message += "User does not exist. Please check. ";
                    else if(data.Items[0].password !== encryptedOldPassword) message += "Old password does not match current password. Please check. ";
                    
                    callback(
                        null, 
                        {
                            statusCode: 500,
                            body: message
                        }
                    );            
                    return;
                }
                
                const user = {
                    "userId" : data.Items[0].userId,
                    "password": crypto.createHash('md5').update(event.body.password).digest("hex"),
                    "modifiedBy": currentUser.userId
                };
                
                updatePassword(user).then((data) => {
                    callback(
                        null, 
                        {
                            statusCode: 200,
                            body: JSON.stringify({data: data, message: "Password updated successfully."})
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

function updatePassword(user) {
    return documentClient.update({
        TableName: 'user',
        Key:{
            "userId": user.userId
        },
        UpdateExpression: "set #password = :password, #modifiedBy = :modifiedBy",
        ExpressionAttributeNames:{
            "#password": "password",
            "#modifiedBy": "modifiedBy"
        },
        ExpressionAttributeValues:{
            ":password": user.password,
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