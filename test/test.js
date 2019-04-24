process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const api = {
    oauth: {
        host: "https://ma-user.auth.us-east-1.amazoncognito.com",
        token: "/oauth2/token",
        authorizationBasic: "Basic N2ZlZWxxcW1rZGtraGx2MHZsZDJvNDNmZWU6c3JnM3I1aW9xaWl0MGdldnZldmE0b29udmVwa3BkcWhwZGFlZWNzODlyMDFnaWgwdmg1"
    }
}; 

chai.use(chaiHttp);

describe('Users', () => {
    let token = null;
    let loginCredentials = {
        login: "admin",
        password: "123456"
    };
    let currentUser = null;

    describe('Authorize', () => {
        it('It should return the token', (done) => {
            chai.request(api.oauth)
                .get(api.oauth.token)
                .set("Authorization", api.oauth.authorizationBasic)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.own.property('access_token');
                    res.body.should.have.own.property('expries_in');
                    res.body.should.have.own.property('token_type');
                    done();
                });
        });
    });

});