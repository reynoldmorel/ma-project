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
3. [Serverless](https://serverless.com/framework/docs/)  is a CLI tool that allows users to build & deploy auto-scaling, pay-per-execution, event-driven functions.
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

### Setting up Serverless
1. To install Serverless, go here: https://serverless.com/framework/docs/providers/aws/guide/installation/
2. Create a user in AWS IAM and download the .csv with the credentials.
3. To setup your AWS credentials in the cmd so that serverless could take it, go here: https://serverless.com/framework/docs/providers/aws/guide/credentials/

### Folder Structure
1. All lambda functions are within **lambda** folder.
2. All serverless resources are within **recources** folder. Here we will see the configuration of: *Coginto, DynamoDB and the Endpoints*
3. All tests are within the **test** folder.
4. *Serverless.yml* contains the serverless script to be deployed in your AWS account.

First step is mandatory. After that the other stpes helps to secure each endpoint with Oauth 2.0

1. Insert this following item manually, (**Please DO NOT change _'login and passwod'_ fields of this item, or unit tests won't work properly.**):
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
2. Go to cognito and configure your User Pool Client to have App Integration:
    * Create and app domain for oauth 2.0 authentication.
    * In resource, Create these following resources:
      * ma-resources/delete_user
      * ma-resources/write_user
      * ma-resources/read_user
    * In app client settings:
      * Enable Identity Providers by checking Cognito User Pool.
      * Check on client_credentials
      * Check on all resource added above.
      * Save changes.
3. Within API Gateway:
    * Create a cognito authorizer:
      * Select the created user pool client
      * In token source write authorization
      * Save changes
    * Secure the following API resources:
      * **Name:** create, **Method:** PUT, **Lambda function:** ma_create_user, **scope:** ma-resources/write_user
      * **Name:** delete, **Method:** DELETE - **Lambda function:** ma_delete_user, **scope:** ma-resources/delete_user
      * **Name:** list, **Method:** GET, **Lambda function:** ma_list_users, **scope:** ma-resources/read_user
      * **Name:** login, **Method:** POST, **Lambda function:** ma_login
      * **Name:** update, **Method:** POST, **Lambda function:** ma_update_user, **scope:** ma-resources/write_user
      * **Name:** update-password, **Method:** POST, **Lambda function:** ma_update_password, **scope:** ma-resources/write_user
4. Remember deploying the API.
5. After the API is deployed, go to the project and open the file **$PROJECT_DIR/test/test.js**. Here you will find all the unit tests. Replace api URLs and parameters as follows:
```
const api = {
    oauth: {
        host: "https://${OAUTH2.0_DOAMAIN_NAME}.auth.us-east-1.amazoncognito.com",
        tokenService: "/oauth2/token?grant_type=client_credentials",
        headers: {
            authorizationBasic: "Basic PASTE_YOUR_GENERATED_TOKEN", // Authorization Basic Online Generator: https://www.blitter.se/utils/basic-authentication-header-generator/ - Username is your ClientID from Cognito and Password is your Secret from Cognito.
            contentType: "application/x-www-form-urlencoded"
        }
    },
    ma: {
        host: "${API_SERVICE_ENDPOINT}/${STAGE}",
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
6. After this is all setup you run the command:
```
npm run test
```
## Future Enhancements
1. Project should never delete items. It should deactivate them using **status** column.
2. Improve better search with pagination, since data is not sorted.
3. Automate Authorizer creation and User Pool Client Configuration.
4. Project should use Authorization Code in OAuth 2.0 flow and generate JWT token, so JWT token could include user roles too, and we wouldn't need to filter user per each call to the API. Also it would be safer for any UI to use Authorization Code flow.
5. Include ECMAScript 6 and TypeScript to increase productivity and maintainability.
6. More detailed documentation and description on each API logic and project setup.
