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

startTest();

function startTest() {
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
                        logInMAApi(token);
                    });
            });
        });
    });
}

function logInMAApi(token) {
    const loginCredentials = {
        login: "admin",
        password: "123456"
    };

    describe("ma-user API tests", () => {
        describe("Login", () => {
            it("Should retrieve the user", (done) => {
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
            it("Should retrieve all existing users", (done) => {
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
            it("Should retrieve paginated list of users with total count", (done) => {
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
                        res.body.data.Items.length.should.be.eq(1);
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        done();
                    });
            });
            it("Should retrieve paginated list of users with total count = 0 for searText = 'There_is_no_user_with_this_name'", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&pageSize=1&searchText=There_is_no_user_with_this_name")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.be.eq(0);
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(0);
                        done();
                    });
            });
        });

        describe("Get User List to be deleted to clean the database.", () => {
            it("Should retrieve all existing users and delete them.", (done) => {
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
            it("Should retrieve list of users with total count = 1 for searText = 'juan'", (done) => {
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
                        res.body.data.Items.length.should.be.eq(1);
                        res.body.data.Items[0].login.should.be.eq("juan");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(1);
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
                        res.body.data.Items.length.should.be.eq(1);
                        res.body.data.Items[0].login.should.be.eq("pedro");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(1);

                        const userParamsToUpdate = res.body.data.Items[0];

                        userParamsToUpdate.name = "Pedrito";
                        userParamsToUpdate.login = "pedrito";
                        userParamsToUpdate.currentUserId = currentUser.userId;

                        describe("Updating user...", () => {

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
                        });
                    });
            });
        });

        describe("Update User Juan Password", () => {
            it("Should update user Juan password to be 123456789", (done) => {
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
                        res.body.data.Items.length.should.be.eq(1);
                        res.body.data.Items[0].login.should.be.eq("juan");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(1);

                        const userParamsToUpdate = res.body.data.Items[0];

                        userParamsToUpdate.login = "juan";
                        userParamsToUpdate.oldPassword = "123456";
                        userParamsToUpdate.password = "123456789";
                        userParamsToUpdate.currentUserId = currentUser.userId;

                        describe("Updating password...", () => {

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
                        });
                    });
            });
        });

        for (let i = 1; i < 30; i++) {
            describe("Create User Jose" + i, () => {
                it("Should create a user Jose" + i, (done) => {
                    chai.request(api.ma.host)
                        .put(api.ma.user.createService)
                        .set("Authorization", "Bearer " + token)
                        .send({
                            name: "Jose" + i,
                            login: "jose" + i,
                            password: "123456",
                            roles: ["USER"],
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
        }

        describe("Get User List searching for jose", () => {
            it("Should retrieve list of 5 users with total count = 29 for searText = 'jose'", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&pageSize=6&searchText=jose")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.not.be.above(5);
                        res.body.data.Items[0].login.should.have.string("jose");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(29);
                        done();
                    });
            });
        });

        describe("Get User List searching for jose. Login, update password and login again", () => {
            it("Should retrieve list of 5 users with total count = 29 for searText = 'jose'. Take the first one and test update password with login.", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&pageSize=6&searchText=jose")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.not.be.above(5);
                        res.body.data.Items[0].login.should.have.string("jose");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(29);

                        let exampleUser = res.body.data.Items[0];
                        exampleUser.password = "123456";

                        describe("Login with user " + exampleUser.name, () => {

                            chai.request(api.ma.host)
                                .post(api.ma.user.loginService)
                                .set("Authorization", "Bearer " + token)
                                .send(exampleUser)
                                .end((err, res) => {
                                    res.should.have.status(200);
                                    res.body.should.be.a("object");
                                    res.body.should.have.property("data");
                                    res.body.data.should.have.property("userId");

                                    let cu = res.body.data

                                    cu.userId.should.be.eq(exampleUser.userId);

                                    cu.password = "123456789";
                                    cu.oldPassword = "123456";
                                    cu.currentUserId = cu.userId;

                                    describe("Updating Password...", () => {

                                        chai.request(api.ma.host)
                                            .post(api.ma.user.updatePasswordService)
                                            .set("Authorization", "Bearer " + token)
                                            .send(cu)
                                            .end((err, res) => {
                                                res.should.have.status(200);
                                                res.body.should.be.a("object");
                                                res.body.should.have.property("message");
                                                res.body.message.should.be.a("string");

                                                exampleUser = cu;

                                                describe("Login Again...", () => {

                                                    chai.request(api.ma.host)
                                                        .post(api.ma.user.loginService)
                                                        .set("Authorization", "Bearer " + token)
                                                        .send(exampleUser)
                                                        .end((err, res) => {
                                                            res.should.have.status(200);
                                                            res.body.should.be.a("object");
                                                            res.body.should.have.property("data");
                                                            res.body.data.should.have.property("userId");

                                                            cu = res.body.data

                                                            cu.userId.should.be.eq(exampleUser.userId);

                                                            done();
                                                        });
                                                });
                                            });
                                    });
                                });
                        });
                    });
            });
        });

        describe("Get User List searching for jose. Login, try creating, updating, deleting and getting users", () => {
            it("Should retrieve list of 5 users with total count = 29 for searText = 'jose'. Take the first one and test accesses.", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + currentUser.userId + "&pageSize=6&searchText=jose")
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("data");
                        res.body.data.should.be.a("object");
                        res.body.data.should.have.property("Items");
                        res.body.data.Items.should.be.a("array");
                        res.body.data.Items.length.should.not.be.above(5);
                        res.body.data.Items[0].login.should.have.string("jose");
                        res.body.should.have.property("count");
                        res.body.count.should.be.a("object");
                        res.body.count.should.have.property("Count");
                        res.body.count.Count.should.be.eq(29);

                        const exampleUser = res.body.data.Items[0];
                        exampleUser.password = "123456789";

                        describe("Login with user " + exampleUser.name, () => {
                            chai.request(api.ma.host)
                                .post(api.ma.user.loginService)
                                .set("Authorization", "Bearer " + token)
                                .send(exampleUser)
                                .end((err, res) => {
                                    res.should.have.status(200);
                                    res.body.should.be.a("object");
                                    res.body.should.have.property("data");
                                    res.body.data.should.have.property("userId");

                                    const cu = res.body.data

                                    cu.userId.should.be.eq(exampleUser.userId);
                                    done();
                                    textMAApiAccessesWithRoleUser(token, cu);
                                });
                        });
                    });
            });
        });
    });
}

function textMAApiAccessesWithRoleUser(token, user) {
    describe("ma-user API tests accesses.", () => {
        describe("Create User", () => {
            it("Should create a user Pablo", (done) => {
                chai.request(api.ma.host)
                    .put(api.ma.user.createService)
                    .set("Authorization", "Bearer " + token)
                    .send({
                        name: "Pablo",
                        login: "pablo",
                        password: "123456",
                        currentUserId: user.userId
                    })
                    .end((err, res) => {
                        res.should.have.status(401);
                        res.body.should.be.a("string");
                        done();
                    });
            });
        });

        describe("Update User", () => {
            it("Should update a user '" + user.name + "' to 'Mario'", (done) => {
                user.currentUserId = user.userId;
                user.name = "Mario";
                chai.request(api.ma.host)
                    .post(api.ma.user.updateService)
                    .set("Authorization", "Bearer " + token)
                    .send(user)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a("object");
                        res.body.should.have.property("message");
                        res.body.message.should.be.a("string");
                        done();
                    });
            });
        });

        describe("Get User List", () => {
            it("Should retrieve all existing users", (done) => {
                chai.request(api.ma.host)
                    .get(api.ma.user.listService + "?currentUserId=" + user.userId)
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(401);
                        res.body.should.be.a("string");
                        done();
                    });
            });
        });

        describe("Delete itself test", () => {
            it("Should not delete itself", (done) => {
                chai.request(api.ma.host)
                    .delete(api.ma.user.deleteService + "?userId=" + user.userId + "&currentUserId=" + user.userId)
                    .set("Authorization", "Bearer " + token)
                    .end((err, res) => {
                        res.should.have.status(401);
                        res.body.should.be.a("string");
                        done();
                    });
            });
        });
    });
}