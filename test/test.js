process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
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

describe("Oauth 2.0 Authentication", () => {
    describe("Authorize", () => {
        it("It should return the token", (done) => {
            chai.request(api.oauth.host)
                .post(api.oauth.tokenService)
                .set("Authorization", api.oauth.headers.authorizationBasic)
                .set("Content-Type", api.oauth.headers.contentType)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.body.should.have.property("access_token");
                    res.body.should.have.property("expires_in");
                    res.body.should.have.property("token_type");
                    const token = res.body["access_token"];
                    done();
                    testMAapi(token);
                });
        });
    });
});

function testMAapi(token) {
    const loginCredentials = {
        login: "admin",
        password: "123456"
    };

    describe("ma-user API tests", () => {
        describe("Login", () => {
            it("Should retrieved the user", (done) => {
                chai.request(api.ma.host)
                    .post(api.ma.user.loginService)
                    .set("Authorization", "Bearer " + token)
                    .send(loginCredentials)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.have.property("userId");
                        const currentUser = res.body.data
                        done();
                        testMAApiWithLoggedUser(token, currentUser);
                    });
            });
        });
    });
}

function testMAApiWithLoggedUser(token, currentUser) {
    let users = [];

    describe("ma-user API tests", () => {
        describe("Get User List", () => {
            it("Should retrieved all existing users", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId)
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.should.have.property("count");
                        done();
                    });
            });
            it("Should retrieved paginated list of users with total count", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&pageSize=1")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.should.have.property("LastEvaluatedKey");
                        res.body.data.LastEvaluatedKey.should.be.a("object");
                        res.body.data.Items.length.should.eq(1);
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        done();
                    });
            });
            it("Should retrieved paginated list of users with total count = 0 for searText = 'There_is_no_user_with_this_name'", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&searchText=There_is_no_user_with_this_name")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.eq(0);
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.eq(0);
                        done();
                    });
            });
        });

        describe("Get User List to be deleted to clean the database.", () => {
            it("Should retrieved all existing users and delete them.", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId)
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.should.have.property("count");
                        users = res.body.data.Items;

                        for (let i = 0; i < users.length; i++) {
                            const user = users[i];

                            if (user.login === "admin") {
                                if (i === users.length - 1) {
                                    done();
                                    testMAApiWithCleanDB(token, currentUser);
                                }
                                continue;
                            }

                            chai.request(api.ma.host)
                                .delete(api.ma.user.deleteService + "?userId=" + user.userId + "&currentUserId=" + currentUser.userId)
                                .set("Authorization", "Bearer " + token)
                                .end((err, res) => {
                                    res.should.have.status(200);
                                    res.body.should.be.a("object");
                                    res.body.should.have.property("message");
                                    res.body.message.should.be.a("string");

                                    if (i === users.length - 1) {
                                        done();
                                        testMAApiWithCleanDB(token, currentUser);
                                    }
                                });
                        }
                    });
            });
        });
    });
}

function testMAApiWithCleanDB(token, currentUser) {
    describe("ma-user API tests after DB was cleaned", () => {
        describe("Create User", () => {
            it("Should create a user Juan", (done) => {
                chai.request(api.ma.host)
                    .put(api.ma.user.createService)
                    .set("Authorization", "Bearer " + token)
                    .send({
                        name: "Juan",
                        login: "juan",
                        password: "123456",
                        currentUserId: currentUser.userId
                    })
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("message");
                        res.body.message.should.be.a("string");
                        done();
                    });
            });
        });

        describe("Create User Pedro", () => {
            it("Should create a user Pedro", (done) => {
                chai.request(api.ma.host)
                    .put(api.ma.user.createService)
                    .set("Authorization", "Bearer " + token)
                    .send({
                        name: "Pedro",
                        login: "pedro",
                        password: "123456",
                        currentUserId: currentUser.userId
                    })
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("message");
                        res.body.message.should.be.a("string");
                        done();
                    });
            });
        });

        describe("Get User juan from  User List", () => {
            it("Should retrieved paginated list of users with total count = 1 for searText = 'juan'", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&searchText=juan")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.eq(1);
                        res.body.data.Items[0].login.should.eq("juan");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.eq(1);
                        done();
                    });
            });
        });

        describe("Update User Pedro", () => {
            it("Should update user Pedro to be Pedrito", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&searchText=pedro")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.eq(1);
                        res.body.data.Items[0].login.should.eq("pedro");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.eq(1);

                        const userParamsToUpdate = res.body.data.Items[0];

                        userParamsToUpdate.name = "Pedrito";
                        userParamsToUpdate.login = "pedrito";
                        userParamsToUpdate.currentUserId = currentUser.userId;

                        chai.request(api.ma.host)
                        .post(api.ma.user.updateService)
                        .set("Authorization", "Bearer " + token)
                        .send(userParamsToUpdate)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a("object");
                            res.body.should.have.property("message");
                            res.body.message.should.be.a("string");
                            done();
                        });

                        done();
                    });
            });
        });

        describe("Update User Pedrito Password", () => {
            it("Should update user Pedrito password to be 123456789", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&searchText=pedrito")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.eq(1);
                        res.body.data.Items[0].login.should.eq("pedrito");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.eq(1);

                        const userParamsToUpdate = res.body.data.Items[0];

                        userParamsToUpdate.login = "pedrito";
                        userParamsToUpdate.oldPassword = "123456";
                        userParamsToUpdate.password = "123456789";
                        userParamsToUpdate.currentUserId = currentUser.userId;

                        chai.request(api.ma.host)
                        .post(api.ma.user.updatePasswordService)
                        .set("Authorization", "Bearer " + token)
                        .send(userParamsToUpdate)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a("object");
                            res.body.should.have.property("message");
                            res.body.message.should.be.a("string");
                            done();
                        });

                        done();
                    });
            });
        });
    });
}