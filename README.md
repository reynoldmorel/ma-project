# ma-project
This project is a user CRUD with the following features:
1. User Authentication.
2. API secured with OAuth 2.0 (AWS Cognito) and built-in Role Management.
3. No-SQL Data Management with DynamoDB.
4. AWS Serverless Application.
5. User Creation, Modification and Deletion.
6. User search with pagination support.
## Project Setup Steps
### Cloning the Repo
1. Go to **$HOME/Documents/projects/nodejs**.
2. Open your terminal and run the following command: 
```
git clone https://github.com/reynoldmorel/ma-project.git
```
3. After this action finished, you should see the project downloaded.
### Setting up NodeJS and NPM on UBUNTU
If you haven't installed NodeJS in your pc just [click here and follow the instructions](https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/)
### Setting up NodeJS and NPM on Windows
If you haven't installed NodeJS in your pc just [click here and follow the instructions](https://www.guru99.com/download-install-node-js.html)
### Setting up NodeJS and NPM on MAC
If you haven't installed NodeJS in your pc just [click here and follow the instructions](https://treehouse.github.io/installation-guides/mac/node-mac.html)
### Setting up the project
1. In the terminal, go to **ma-project** folder.
2. Let's install all project dependencies first. Run the following command: 
```
npm install
```
3. After this finishes, you will be able to run all tests locally, but wait! not yet, you still need to deploy the serverless aplication. 
### Technologies used in the project
1. [Mocha](https://mochajs.org/) for automated testing.
2. [Chai](https://www.chaijs.com/) is BDD/TDD assertion library, that makes TDD coding more readble.
### Setting up AWS
If you don have an account of AWS you join for free [here](https://aws.amazon.com/free/). After your account is created you will need to check:
1. AWS VPC.
2. AWS IAM.
3. AWS Cognito.
4. AWS DynamoDB.
5. AWS Lambda Functions.
6. AWS API Gateway.

**This setup will be under the region us-east-1, specifically N. Virginia**

Get familiar with AWS concepts in their [documentation page](https://docs.aws.amazon.com/). Amazon has a bunch of good really helpful information. 

A good tutorial that helps a lot understanding the setup from scratch was [this one](https://medium.com/@awskarthik82/part-1-securing-aws-api-gateway-using-aws-cognito-oauth2-scopes-410e7fb4a4c0). Follow the same steps considering:

1. The DynamoDB table name for this project is **user**.
2. Insert the following item manually, (**Please DO NOT change the _'login'_ field of this item, or unit tests won't work properly.**):
```
{
  userId: "529322be-28cc-460d-972c-071a174080e3",
  name: "Administrator",
  login: "admin",
  password: "e10adc3949ba59abbe56e057f20f883e",
  roles: ["ADMIN"],
  status: "ACTIVE",
}
```
2. Go to [IAM](https://console.aws.amazon.com/iam/home?region=us-east-1#/home) and create the role **ma-role** with the following policies:
    * AmazonAPIGatewayInvokeFullAccess
    * AmazonAPIGatewayPushToCloudWatchLogs
    * AmazonDynamoDBFullAccess
    * AmazonCognitoDeveloperAuthenticatedIdentities
    * CloudWatchLogsFullAccess
    * AmazonAPIGatewayAdministrator
    * AmazonVPCFullAccess
3. Your user pool name will be **ma-users-${currentDateTimeInMillis}**.
4. Your app client name will be **ma-trusted-user-${currentDateTimeInMillis}**.
5. Your resources will be:
    * ma-resources/delete_user
    * ma-resources/write_user
    * ma-resources/read_user
6. Your domain name will be **ma-user-${currentDateTimeInMillis}**.
7. All lambda functions you need to create are in the project, under **$PROJECT_DIR/lambda**. Each folder within **lambda folder** represents the name of the lambda function and its content. So when you create a lambda function make sure to write the correct name as per the folders. *Example: you should create a lambda function with the name ma_login*
8. Remember to copy the index.js content their respective lambda function. You should create a total of 6 lambda functions.
9. Use the existing **ma-role** for all lambda function.
10. The API name you will create within API Gateway will be **ma-user-${currentDateTimeInMillis}**.
11. Create and setup the following API resources:
    * **Name:** create, **Method:** PUT, **Lambda function:** ma_create_user, **scope:** ma-resources/write_user
    * **Name:** delete, **Method:** DELETE - **Lambda function:** ma_delete_user, **scope:** ma-resources/delete_user
    * **Name:** list, **Method:** GET, **Lambda function:** ma_list_users, **scope:** ma-resources/read_user
    * **Name:** login, **Method:** POST, **Lambda function:** ma_login
    * **Name:** update, **Method:** POST, **Lambda function:** ma_update_user, **scope:** ma-resources/write_user
    * **Name:** update-password, **Method:** POST, **Lambda function:** ma_update_password, **scope:** ma-resources/write_user
12. Remember deploying the API.
13. After the API is deployed, go to the project and open the file **$PROJECT_DIR/test/test.js**. Here you will find all the unit tests. Replace api URLs and parameters as follows:
```
const api = {
    oauth: {
        host: "https://ma-user-${currentDateTimeInMillis}.auth.us-east-1.amazoncognito.com",
        tokenService: "/oauth2/token?grant_type=client_credentials",
        headers: {
            authorizationBasic: "Basic PASTE_YOUR_GENERATED_TOKEN", // Authorization Basic Online Generator: https://www.blitter.se/utils/basic-authentication-header-generator/ - Username is your ClientID from Cognito and Password is your Secret from Cognito.
            contentType: "application/x-www-form-urlencoded"
        }
    },
    ma: {
        host: "${apiHostFromApiGateway}/${deployName}",
        user: {
            loginService: "/login",
            listService: "/list",
            createService: "/create",
            updateService: "/update",
            updatePasswordService: "/update-password",
            deleteService: "/delete"
        }
    }
};
```
14. After this is all setup you run the command:
```
npm run test
```
## Future Enhancements
1. Project should never delete items. It should deactivate them using **status** column.
2. Improve better search with pagination, since data is not sorted.
3. Project should be allocated in an EC2 instance and lambda function should be executing pieces of code, so maintainability and scalability would be better.
4. Project should use Authorization Code in OAuth 2.0 flow combined with Grant Type password, so JWT token could include user roles too, and we wouldn't need to filter user per each call to the API. Also it would be safer for the UI to use Authorization Code flow.
