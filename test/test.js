process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const api = {
    oauth: {
        host: "https://ma-user.auth.us-east-1.amazoncognito.com",
        tokenService: "/oauth2/token?grant_type=client_credentials",
        headers: {
            authorizationBasic: "Basic N2ZlZWxxcW1rZGtraGx2MHZsZDJvNDNmZWU6c3JnM3I1aW9xaWl0MGdldnZldmE0b29udmVwa3BkcWhwZGFlZWNzODlyMDFnaWgwdmg1",
            contentType: "application/x-www-form-urlencoded"
        }
    },
    ma: {
        host: "https://3j6benqmij.execute-api.us-east-1.amazonaws.com/prod",
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

chai.use(chaiHttp);

describe('Oauth 2.0 Authentication', () => {
    describe('Authorize', () => {
        it('It should return the token', (done) => {
            chai.request(api.oauth.host)
                .post(api.oauth.tokenService)
                .set("Authorization", api.oauth.headers.authorizationBasic)
                .set("Content-Type", api.oauth.headers.contentType)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.own.property('access_token');
                    res.body.should.have.own.property('expires_in');
                    res.body.should.have.own.property('token_type');
                    const token = res.body["acess_token"];
                    done();
                    testMAapi(token);
                });
        });
    });
});

function testMAapi(token) {
    let loginCredentials = {
        login: "admin",
        password: "123456"
    };
    let currentUser = null;
   
    describe('ma-user API tests', () => {
        describe('Login', () => {
            it('Should retrieved the user', (done) => {
                chai.request(api.oauth.host)
                    .post(api.oauth.token)
                    .set("Authorization", api.oauth.headers.authorizationBasic)
                    .set("Content-Type", api.oauth.headers.contentType)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.own.property('access_token');
                        res.body.should.have.own.property('expires_in');
                        res.body.should.have.own.property('token_type');
                        const token = res.body["acess_token"];
                        done();
                        testMAapi(token);
                    });
            });
        });
    });
}