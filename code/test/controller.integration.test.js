import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User, Group} from '../models/User';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { response } from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async ()=>{
    await categories.deleteMany({});
    await transactions.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
})

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const adminAccessTokenValid = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' });

const testerAccessTokenValid = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' });

//These tokens can be used in order to test the specific authentication error scenarios inside verifyAuth (no need to have multiple authentication error tests for the same route)
const testerAccessTokenExpired = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })
const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

describe("createCategory", () => {

    test('Should give an error because it it not authorized', (done) => {
        request(app)
        .post('/api/categories')
        .send({type: "market", color: "#0000ff"})
        .then((response)=>{
            expect(response.status).toBe(401);
            expect(response.body.message).toEqual("Unauthorized");
            done();
        })
        .catch((err)=>done(err))
    });

    test('Should give an error because the category already exists', (done) => {
        categories.create({type: "market", color: "#0000ff"})
        .then(()=>{
            request(app)
            .post('/api/categories')
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
            .send({type: "market", color: "#0000ff"})
            .then(async (response)=>{
            expect(response.status).toBe(400);
            expect(response.body.message).toEqual("The category already exists");
            done();
            })
           .catch((err)=>done(err))
        })
    });

    test('Should return an error because one element is missing', (done) => {
        const new_category = { type: "market" }

        request(app)
        .post('/api/categories')
        .send(new_category)
        .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
        .then((response)=>{
            expect(response.status).toBe(400);
            expect(response.body.message).toEqual("You must insert both type and color");
            done();
        })
        .catch((err)=>done(err))

    });

    test('Should return an error because one element is an empty string', (done) => {
        const new_category = { type: "market", color: "" }

        request(app)
        .post('/api/categories')
        .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
        .send(new_category)
        .then((response)=>{
            expect(response.status).toBe(400);
            expect(response.body.message).toEqual("Type and color must not be empty strings");
            done();
        })
        .catch((err)=>done(err))
    });

    test('Should return the object with the message', (done) => {
        const new_category = {type: "market", color: "#0000ff"};
        request(app)
        .post('/api/categories')
        .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
        .send(new_category)
        .then(async (response)=>{
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toEqual(new_category);
            expect(await categories.find({type: new_category.type})).toHaveLength(1);
            done();
        }).catch((err)=>done(err))
    });


})

describe("updateCategory", () => { 
    test('Should give an error because it is not authorized', (done)=> {
        request(app)
        .patch('/api/categories/investment')
        .send({type: "market", color: "#0000ff"})
        .then((response) => {
            expect(response.status).toBe(401);
            expect(response.body).toEqual({message: "Unauthorized"});
            done();
        }).catch((err)=>done(err));
    });

    test('Should give an error because the category does not exist', (done) => {
        request(app)
        .patch('/api/categories/investment')
        .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
        .send({type: "market", color: "#0000ff"})
        .then((response) => {
            expect(response.status).toBe(400);
            expect(response.body).toEqual({message: "This category does not exist"});
            done();
        }).catch((err)=>done(err));
    });

    test('Should give an error because one parameter is not present', (done) => {
        const new_category = { type : "market" };

        categories.create({
            type: "investment",
            color: "#ff0000"
        }).then(()=>{
            request(app)
            .patch('/api/categories/investment')
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send(new_category)
            .then((response)=>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("You must insert both type and color");
                done();
            })
            .catch((err)=>done(err))
        })
    })

    test('Should give an error because one parameter is a empty string', (done) => {
        const new_category = {type : "", color : "#0000ff"}
        categories.create({
            type : "investment",
            color: "#ff0000"
        }).then(()=>{
            request(app)
            .patch('/api/categories/investment')
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send(new_category)
            .then((response)=>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("Type and color must not be empty strings");
                done()
            })
            .catch((err)=>done(err))
        });

    })

    test('Should give an error because the category passed as parameter is already present in the database', (done) => {
        categories.create([
            {
                type: "investment",
                color: "#ff0000"
            },
            {
                type: "market",
                color: "#0000ff"
            }
        ]).then(()=>{
            request(app)
            .patch('/api/categories/investment')
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send({type: "market", color:"#0000ff"})
            .then((response) =>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("The category in which you want to update is already present!!!");
                done();
            }).catch((err)=>done(err))
        })
    })

    test('Should give back the object with the updated changes', (done) => {
        categories.create({
            type: "investment",
            color: "#ff0000"
        }).then(()=>{
            transactions.create([{
                username: "Er Sium",
                type: "investment",
                amount: 200
            },{
                username: "Er Sium",
                type: "investment",
                amount: 1000
            }
            ]).then(()=>{
                request(app)
                .patch('/api/categories/investment')
                .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])        
                .send({type: "market", color: "#0000ff"})
                .then(async (response) => {
                    expect(response.status).toBe(200);
                    expect(response.body.data).toHaveProperty("message","Category edited successfully");
                    expect(response.body.data).toHaveProperty("count", 2);
                    expect(await categories.find({type : "investment"}).count()).toEqual(0);
                    expect(await transactions.find({type: "market"}).count()).toEqual(2);
                    done();
                }).catch((err)=>done(err));
            })
            
        });

        })
        
})

describe("deleteCategory", () => { 
    test('Should give an error because it is not authorized', (done)=> {
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            }
        ]).then(()=>{
            transactions.create([{
                username: "Er Sium",
                type: "market",
                amount: 200
            }, {
                username: "Er Sium",
                type: "market",
                amount: 200
            },{
                username: "Er Sium",
                type: "work",
                amount: 200
            }]).then(()=>{
                request(app)
                .delete('/api/categories')
                .send({types : ["investment", "work"]})
                .then((response) => {
                    expect(response.status).toBe(401);
                    expect(response.body).toEqual({message: "Unauthorized"});
                    done();
                }).catch((err)=>done(err)); 
            })

        })
        
    });

    test('It must return an error because the request does not have an array', (done) =>{
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            }
        ]).then(()=>{
            request(app)
            .delete("/api/categories")
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send({types: 0})
            .then((response)=>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("The request must contain an array");
                done()
            })
            .catch((err)=>done(err));
        })
    })

    test('It must return an error because there is only one category in the DB', (done) => {

        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
        ]).then(()=>{
            request(app)
            .delete("/api/categories")
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send({types : ["investment", "work"]})
            .then((response)=>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("In the DB there is only one category, you cannot delete it");
                done();
            })
            .catch((err)=>done(err))

        })
    })
    test('It must return an error because one category does not exists', (done) => {
       
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            }
        ]).then(() => {
            request(app)
            .delete("/api/categories")
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send({types : ["investment", "work"]})
            .then((response)=>{
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("This category does not exist");
                done();
            })
            .catch((err)=> done(err))
        })
    });

    test('Should return an error because one category is an empty string', (done) => {
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            }
        ]).then(() => {
            request(app)
            .delete("/api/categories")
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .send({types : ["investment", ""]})
            .then((response) => {
                expect(response.status).toBe(400);
                expect(response.body.message).toEqual("The types inserted must not be empty strings");
                done()
            })
            .catch((err)=>done(err))
        })
    })

    test('It must return the message with the changes', (done)=>{
        
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            },
            {
                type: "work", color: "yellow"
            }
        ]).then(()=>{
            transactions.create([{
                username: "Er Sium",
                type: "market",
                amount: 200
            }, {
                username: "Er Sium",
                type: "market",
                amount: 200
            },{
                username: "Er Sium",
                type: "work",
                amount: 200
            }]).then(()=>{
                request(app)
                .delete('/api/categories')
                .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])        
                .send({types : ["market", "work","investment"]})
                .then(async (response)=>{
                    expect(response.status).toBe(200);
                    expect(response.body.data.message).toEqual("Categories deleted");
                    expect(response.body.data.count).toEqual(3);
                    expect(await categories.find({type : "investment"}).count()).toEqual(1);
                    expect(await transactions.find({type: "market"}).count()).toEqual(0);
                    expect(await transactions.find({type: "investment"}).count()).toEqual(3);
                    expect(await categories.find({type: {$in : ["work", "market"]}}).count()).toEqual(0);
                    expect(await categories.find({type: "investment"}).count()).toEqual(1);
                    done();
                })
                .catch((err)=>done(err))
            })
        })
    })

    test('It must return the message with the changes but in DB remain two categories', (done)=>{
        
        categories.create([
            {
                type: "investment", color: "#0000ff"
            },
            {
                type: "market", color: "#ff0000"
            },
            {
                type: "work", color: "yellow"
            }
        ]).then(()=>{
            transactions.create([{
                username: "Pala",
                type: "market",
                amount: 200
            }, {
                username: "Pala",
                type: "market",
                amount: 200
            },{
                username: "Pala",
                type: "work",
                amount: 200
            }]).then(()=>{
                request(app)
                .delete('/api/categories')
                .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])        
                .send({types : ["market"]})
                .then(async (response)=>{
                    expect(response.status).toBe(200);
                    expect(response.body.data.message).toEqual("Categories deleted");
                    expect(response.body.data.count).toEqual(2);
                    expect(await categories.find({type : "investment"}).count()).toEqual(1);
                    expect(await transactions.find({type: "market"}).count()).toEqual(0);
                    expect(await transactions.find({type: "investment"}).count()).toEqual(2);
                    expect(await transactions.find({type: "work"}).count()).toEqual(1);
                    expect(await categories.find({type: "investment"}).count()).toEqual(1);
                    done();
                })
                .catch((err)=>done(err))
            })
        })
    })
})

describe("getCategories", () => { 
    test('Must retrieve an error because it is not authorized', (done) => {
        request(app)
        .get('/api/categories')
        .then((response)=>{
            expect(response.status).toBe(401);
            expect(response.body).toEqual({message: "Unauthorized"});
            done();
        })
        .catch((err)=>done(err))
    });

    test('Must retrieve an empty array', (done) => {
        request(app)
        .get('/api/categories')
        .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])
        .then((response)=>{
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
            expect(response.body.data).toEqual([]);
            done();
        })
        .catch((err)=>done(err))
    });

    test('Must retrieve the list of all categories', (done) => {
        categories.create([
            {type: "investment", color: "#0000ff"}, 
            {type: "market", color: "#ff0000"}, 
            {type: "family", color: "yellow"}
        ])
        .then(()=>{
            request(app)
            .get('/api/categories')
            .set('Cookie', [`accessToken=${adminAccessTokenValid}`,`refreshToken=${adminAccessTokenValid}`])    
            .then((response)=>{
                expect(response.status).toBe(200);
                expect(response.body.data).toHaveLength(3);
                expect(response.body.data).toEqual([{type: "investment", color: "#0000ff"},{type: "market", color: "#ff0000"},{type: "family", color: "yellow"}]);
                done();
            })
            .catch((err)=>done(err))
        })
    });
})

describe("createTransaction", () => { 
    test('It should return the correct inserted transaction (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(200);
                    expect(response.body.data.username).toEqual("RealRegularUser");
                    expect(response.body.data.amount).toEqual(17);
                    expect(response.body.data.type).toEqual("RealCategory");
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the username (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the amount (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toBe("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the type (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values");
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the username and the amount (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    type: "RealCategory",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the username and the type (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain the amount and the type (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser"
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the request body does not contain any information (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({})
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("You should provide username, amount and type values")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if username in the request body is an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if amount in the request body is an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: "",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if type in the request body is an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if username and amount in the request body are an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "",
                    type: "RealCategory",
                    amount: "",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if username and type in the request body are an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "",
                    type: "",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if amount and type in the request body are an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "",
                    amount: "",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if amount, type and username in the request body are an empty string (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "",
                    type: "",
                    amount: "",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Username, amount and type values cannot be the empty string")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the type of category passed in the request body does not represent a category in the database (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("Category not found")
                    done()
                }).catch((err) => done(err));
        })
    });

    test('It should return a 400 error if the username passed in the request body is not equal to the one passed as a route parameter (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            User.create({username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
                categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                    request(app)
                    .post("/api/users/RealRegularUser/transactions")
                    .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                    .send({
                        username: "DifferentUser",
                        type: "RealCategory",
                        amount: 17,
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Usernames in the URL and in the body don't match")
                        done()
                    }).catch((err) => done(err));
                })
            })
        })
    });

    test('It should return a 400 error if the username passed in the request body does not represent a user in the database (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "FakeUser",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("User of the body not found")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 400 error if the username passed as a route parameter does not represent a user in the database (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/FakeUser/transactions")
                .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJGYWtlVXNlciIsImVtYWlsIjoiZmFrZVVzZXJAZ21haWwuY29tIiwicm9sZSI6IlJlZ3VsYXIifQ.xtOjzIwOjw1pfvmD4zRhNN9HbZ3V1lkGRZFBUvVKN-8','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJGYWtlVXNlciIsImVtYWlsIjoiZmFrZVVzZXJAZ21haWwuY29tIiwicm9sZSI6IlJlZ3VsYXIifQ.xtOjzIwOjw1pfvmD4zRhNN9HbZ3V1lkGRZFBUvVKN-8'])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("User of the URL not found")
                    done()
                }).catch((err) => done(err));
            })      
        })      
    });

    test('1 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: "0045",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("The amount is not a valid float number (negative number are accepted)")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('2 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: "abc",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("The amount is not a valid float number (negative number are accepted)")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('3 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .set('Cookie', [`accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`,`refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU5Njg2MjUsImV4cCI6MTcxNzUwNDY0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJwYXNzd29yZCI6IlBhc3N3b3JkIiwicm9sZSI6IlJlZ3VsYXIifQ.xJvR688V74IkMe1rKQKrAik5mhFzp49J0h-JNdyoIdM`])
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: "4.5.6",
                })
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("The amount is not a valid float number (negative number are accepted)")
                    done()
                }).catch((err) => done(err));
            })
        })
    });

    test('It should return a 401 error if a user is not authorized (called by a regular User)', (done) => {
                request(app)
                .post("/api/users/RealRegularUser/transactions")
                .send({
                    username: "RealRegularUser",
                    type: "RealCategory",
                    amount: 17,
                })
                .then(async (response) => {
                    expect(response.status).toBe(401);
                    expect(response.body.error).toEqual("Unauthorized")
                    done()
                }).catch((err) => done(err));
    });
    
})

describe("getAllTransactions", () => { 
    test('Should return all transactions present in the DB (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(3);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
    
                        expect(response.body.data[1].username).toEqual("RealRegularUser");
                        expect(response.body.data[1].type).toEqual("OtherCategory")
                        expect(response.body.data[1].amount).toEqual(25)
                        expect(response.body.data[1].color).toEqual("#ccbbaa")
    
                        expect(response.body.data[2].username).toEqual("DifferentUser");
                        expect(response.body.data[2].type).toEqual("RealCategory")
                        expect(response.body.data[2].amount).toEqual(5)
                        expect(response.body.data[2].color).toEqual("#aabbcc")
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if the admin who calls the function is not authorized (called by an Admin)', (done) => {
                request(app)
                .get("/api/transactions/")
                .then(async (response) => {
                    expect(response.status).toBe(401);
                    expect(response.body.error).toEqual("Unauthorized");
                    done()
                }).catch((err) => done(err));
    });
})

describe("getTransactionsByUser", () => { 
    test('Should return an error message if the username specified does not exist (called by an admin)', (done) => {
                request(app)
                .get("/api/transactions/users/FakeUser")
                .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                .then(async (response) => {
                    expect(response.status).toBe(400);
                    expect(response.body.error).toEqual("User not found");
                    done()
                }).catch((err) => done(err));
    });

    test('Should return an array of transaction objects (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(2);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
    
                        expect(response.body.data[1].username).toEqual("RealRegularUser");
                        expect(response.body.data[1].type).toEqual("OtherCategory")
                        expect(response.body.data[1].amount).toEqual(25)
                        expect(response.body.data[1].color).toEqual("#ccbbaa")
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an empty array if no transactions are found (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(0)
                        expect(response.body.data).toEqual([])
                        done()
                    }).catch((err) => done(err));                
            })
        })
    });

    test('Should return an array of transaction objects (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(2);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
    
                        expect(response.body.data[1].username).toEqual("RealRegularUser");
                        expect(response.body.data[1].type).toEqual("OtherCategory")
                        expect(response.body.data[1].amount).toEqual(25)
                        expect(response.body.data[1].color).toEqual("#ccbbaa")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an empty array if no transactions are found (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(0);
                        expect(response.body.data).toEqual([]);
                        done()
                    }).catch((err) => done(err));                
            })
        })
    });

    test('Should return an array of transaction objects filtered by date from (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15, date: "2023-05-10"}, {username: "RealRegularUser", type: "OtherCategory", amount: 25, date: "2023-04-20"}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?from=2023-05-03")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        expect(response.body.data[0].date).toEqual("2023-05-10T00:00:00.000Z");
    
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by date to (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15, date: "2023-05-15"}, {username: "RealRegularUser", type: "OtherCategory", amount: 25, date: "2023-06-07"}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?upTo=2023-05-20")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        expect(response.body.data[0].date).toEqual("2023-05-15T00:00:00.000Z")
       
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by date from to (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15, date: "2023-05-12"}, {username: "RealRegularUser", type: "OtherCategory", amount: 25, date: "2023-05-22"}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?from=2023-05-01&upTo=2023-05-31")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(2);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        expect(response.body.data[0].date).toEqual("2023-05-12T00:00:00.000Z")
    
                        expect(response.body.data[1].username).toEqual("RealRegularUser");
                        expect(response.body.data[1].type).toEqual("OtherCategory")
                        expect(response.body.data[1].amount).toEqual(25)
                        expect(response.body.data[1].color).toEqual("#ccbbaa")
                        expect(response.body.data[1].date).toEqual("2023-05-22T00:00:00.000Z")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by date (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15, date: "2023-05-16"}, {username: "RealRegularUser", type: "OtherCategory", amount: 25, date:"2023-03-12"}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?date=2023-05-16")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        expect(response.body.data[0].date).toEqual("2023-05-16T00:00:00.000Z")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by amount min (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?min=20")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
    
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("OtherCategory")
                        expect(response.body.data[0].amount).toEqual(25)
                        expect(response.body.data[0].color).toEqual("#ccbbaa")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by amount max (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?max=20")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")

                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by amount min max (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?min=10&max=20")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
        
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transaction objects filtered by amount min and date (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15, date: "2023-05-10"}, {username: "RealRegularUser", type: "OtherCategory", amount: 25, date: "2023-05-20"}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?min=10&date=2023-05-10")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by date and from params (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?date=2023-05-10&from=2023-05-01")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("It includes only one parameter of from and upTo with date")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by date and upTo params (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?date=2023-05-10&upTo=2023-05-27")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("It includes only one parameter of from and upTo with date")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by date, from and upTo params (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?date=2023-05-23&from=2023-01-04&upTo=2023-09-12")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("It includes only one parameter of from and upTo with date")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by date, where date is not in a correct format (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?date=pippo-pluto")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Invalid format for date")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by from, where date is not in a correct format (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?from=pippo-pluto")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Invalid format for from")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by upTo, where date is not in a correct format (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?upTo=pippo-pluto")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Invalid format for upTo")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by  min amount, where amount is not a float number (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?min=pippo")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Min must be an integer")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if objects filtered by max amount, where amount is not a float number (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions?max=pippo")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Max must be an integer")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error the Regular user is not authorized (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions")
                    .then(async (response) => {
                    expect(response.status).toBe(401);
                    expect(response.body.error).toEqual("Unauthorized")
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error the Admin user is not authorized (called by an admin user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser")
                    .then(async (response) => {
                        expect(response.status).toBe(401);
                        expect(response.body.error).toEqual("Unauthorized")
                        done()
                    }).catch((err) => done(err));                
            })
        })
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('Should return an array of transactions of a specific user with a specific category (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an array of transactions of a specific user with a specific category (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(1);
                        expect(response.body.data[0].username).toEqual("RealRegularUser");
                        expect(response.body.data[0].type).toEqual("RealCategory")
                        expect(response.body.data[0].amount).toEqual(15)
                        expect(response.body.data[0].color).toEqual("#aabbcc")
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error message if the username specified does not exist (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/users/FakeUser/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("User not found");
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error message if the category specified does not exist (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser/category/FakeCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("Category not found");
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an empty array if no transaction is found with this category and username (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(0);
                        expect(response.body.data).toEqual([]);
                        done()
                    }).catch((err) => done(err));
                })  
            })
    });

    test('Should return an empty array if no transaction is found with this category and username (called by a Regular user)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    request(app)
                    .get("/api/users/RealRegularUser/transactions/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4'])
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.length).toEqual(0);
                        expect(response.body.data).toEqual([]);
                        done()
                    }).catch((err) => done(err));
                })  
            })
    });

    test('Should return an error if the user who is calling the function does not correspond to the username param field (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/users/DifferentUser/transactions/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4'])
                    .then(async (response) => {
                        expect(response.status).toBe(401);
                        expect(response.body.error).toEqual("The username of the cookie and that one you provide don't match");
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('Should return an error if the user who calls the function with the admin route is not authenticated as an admin (called by a fake admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                    request(app)
                    .get("/api/transactions/users/RealRegularUser/category/RealCategory")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3MDQ3MTQsImV4cCI6MTcxNzI0MDcxNCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.Ut29o2QefUs18y9GV5O_HrZcP1D4JcQz856caAVp0C4'])
                    .then(async (response) => {
                        expect(response.status).toBe(401);
                        expect(response.body.error).toEqual("The user must be an Admin");
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });
})

describe("getTransactionsByGroup", () => { 
    test('It should return an array of transactions linked to the group of the user who calls the function (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/groups/RealGroup/transactions")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                        .then(async (response) => {
                            expect(response.status).toBe(200);
                            expect(response.body.data.length).toEqual(3);
                            expect(response.body.data[0].username).toEqual("RealRegularUser");
                            expect(response.body.data[0].type).toEqual("RealCategory")
                            expect(response.body.data[0].amount).toEqual(15)
                            expect(response.body.data[0].color).toEqual("#aabbcc")
        
                            expect(response.body.data[1].username).toEqual("RealRegularUser");
                            expect(response.body.data[1].type).toEqual("OtherCategory")
                            expect(response.body.data[1].amount).toEqual(25)
                            expect(response.body.data[1].color).toEqual("#ccbbaa")

                            expect(response.body.data[2].username).toEqual("DifferentUser");
                            expect(response.body.data[2].type).toEqual("RealCategory")
                            expect(response.body.data[2].amount).toEqual(5)
                            expect(response.body.data[2].color).toEqual("#aabbcc")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an array of transactions linked to a group specified in params (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                        .then(async (response) => {
                            expect(response.status).toBe(200);
                            expect(response.body.data.length).toEqual(3);
                            expect(response.body.data[0].username).toEqual("RealRegularUser");
                            expect(response.body.data[0].type).toEqual("RealCategory")
                            expect(response.body.data[0].amount).toEqual(15)
                            expect(response.body.data[0].color).toEqual("#aabbcc")
        
                            expect(response.body.data[1].username).toEqual("RealRegularUser");
                            expect(response.body.data[1].type).toEqual("OtherCategory")
                            expect(response.body.data[1].amount).toEqual(25)
                            expect(response.body.data[1].color).toEqual("#ccbbaa")

                            expect(response.body.data[2].username).toEqual("DifferentUser");
                            expect(response.body.data[2].type).toEqual("RealCategory")
                            expect(response.body.data[2].amount).toEqual(5)
                            expect(response.body.data[2].color).toEqual("#aabbcc")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an error if the group name specified in the URL does not correspond to any group in the DB (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                        .then(async (response) => {
                            expect(response.status).toBe(400);
                            expect(response.body.error).toEqual("Group not found")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
    });

    test('It should return an error if the function is called by a regular user who is not in the group (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "ThirdUser", email: "thirdUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "thirdUser@gmail.com", user: user3Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/groups/RealGroup/transactions")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                        .then(async (response) => {
                            expect(response.status).toBe(401);
                            expect(response.body.error).toEqual("The email of the token doesn't match")
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an error if the function is called by an admin who is not authorized (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup")
                        .then(async (response) => {
                            expect(response.status).toBe(401);
                            expect(response.body.error).toEqual("Unauthorized")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('It should return an array of transactions of a specified category linked to a group specified in params (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup/category/RealCategory")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                        .then(async (response) => {
                            expect(response.status).toBe(200);
                            expect(response.body.data.length).toEqual(2);
                            expect(response.body.data[0].username).toEqual("RealRegularUser");
                            expect(response.body.data[0].type).toEqual("RealCategory")
                            expect(response.body.data[0].amount).toEqual(15)
                            expect(response.body.data[0].color).toEqual("#aabbcc")

                            expect(response.body.data[1].username).toEqual("DifferentUser");
                            expect(response.body.data[1].type).toEqual("RealCategory")
                            expect(response.body.data[1].amount).toEqual(5)
                            expect(response.body.data[1].color).toEqual("#aabbcc")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an array of transactions of a specified category linked to the group of the user who calls the function (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/groups/RealGroup/transactions/category/RealCategory")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                        .then(async (response) => {
                            expect(response.status).toBe(200);
                            expect(response.body.data.length).toEqual(2);
                            expect(response.body.data[0].username).toEqual("RealRegularUser");
                            expect(response.body.data[0].type).toEqual("RealCategory")
                            expect(response.body.data[0].amount).toEqual(15)
                            expect(response.body.data[0].color).toEqual("#aabbcc")

                            expect(response.body.data[1].username).toEqual("DifferentUser");
                            expect(response.body.data[1].type).toEqual("RealCategory")
                            expect(response.body.data[1].amount).toEqual(5)
                            expect(response.body.data[1].color).toEqual("#aabbcc")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an error if the group name specified in params does not correspond to any group in the DB (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup/category/RealCategory")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                        .then(async (response) => {
                            expect(response.status).toBe(400);
                            expect(response.body.error).toEqual("Group not found")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
        })
    });

    test('It should return an error if the category specified in params does not correspond to any category in the DB (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup/category/RealCategory")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                        .then(async (response) => {
                            expect(response.status).toBe(400);
                            expect(response.body.error).toEqual("Category not found")
        
                            done()
                        }).catch((err) => done(err));
                    })                
            })
    });

    test('It should return an error if the admin who calls the function is not authorized (called by an Admin)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "rRegularUser@gmail.com", user: user1Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/transactions/groups/RealGroup/category/RealCategory")
                        .then(async (response) => {
                            expect(response.status).toBe(401);
                            expect(response.body.error).toEqual("Unauthorized")
        
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });

    test('It should return an error if the function is called by a regular user who is not in the group (called by a Regular User)', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "ThirdUser", email: "thirdUser@gmail.com", password: "Password", role: "Regular"}]).then((createdUsers) => {
            
            
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
            
            categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                Group.create({name: "RealGroup", members: [{email: "thirdUser@gmail.com", user: user3Id}, {email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                    transactions.create([{username: "RealRegularUser", type: "RealCategory", amount: 15}, {username: "RealRegularUser", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then(() => {
                        request(app)
                        .get("/api/groups/RealGroup/transactions/category/RealCategory")
                        .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                        .then(async (response) => {
                            expect(response.status).toBe(401);
                            expect(response.body.error).toEqual("The email of the token doesn't match")
                            done()
                        }).catch((err) => done(err));
                    })
                })                
            })
        })
    });
})

describe("deleteTransaction", () => { 
    test('It should return a correct message', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "RealRegularUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionID = createdTransaction._id;

                    request(app)
                    .delete("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .send({
                        _id: transactionID
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(200);
                        expect(response.body.data.message).toEqual("Transaction deleted");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('It should return a 400 error if the request body does not contain all the necessary attributes', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "RealRegularUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionID = createdTransaction._id;

                    request(app)
                    .delete("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .send({
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("You must specify the id of the transaction to be deleted");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('It should return a 400 error if the username passed as a route parameter does not represent a user in the database', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "RealRegularUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionID = createdTransaction._id;

                    request(app)
                    .delete("/api/users/FakeUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3NDMxNzgsImV4cCI6MTcxNzI3OTE3OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJGYWtlVXNlciIsImVtYWlsIjoiRmFrZVVzZXJAZ21haWwuY29tIiwicm9sZSI6IlJlZ3VsYXIifQ.MIIpdC-kL6lJsb-VOMwfvwBMSvnkwLMQ_BIalQ0Ii4k','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU3NDMxNzgsImV4cCI6MTcxNzI3OTE3OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJGYWtlVXNlciIsImVtYWlsIjoiRmFrZVVzZXJAZ21haWwuY29tIiwicm9sZSI6IlJlZ3VsYXIifQ.MIIpdC-kL6lJsb-VOMwfvwBMSvnkwLMQ_BIalQ0Ii4k'])
                    .send({
                        _id: transactionID
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("User of the URL not found");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('It should return a 400 error if the _id in the request body does not represent a transaction in the database', (done) => {
        User.create({username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "RealRegularUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionIDletters = String(createdTransaction._id).split("");

                    const firstLetterASCIIcode = String.fromCharCode(transactionIDletters[0].charCodeAt(0) + 1);
                    transactionIDletters[0] = firstLetterASCIIcode;
                    const transactionID = transactionIDletters.join("");

                    request(app)
                    .delete("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .send({
                        _id: transactionID
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("The id that you provided does not represent a transaction");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('It should return a 401 error if called by an authenticated user who is not the same user as the one in the route', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "RealRegularUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionID = createdTransaction._id;

                    request(app)
                    .delete("/api/users/FakeUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .send({
                        _id: transactionID
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(401);
                        expect(response.body.error).toEqual("The username of the cookie and that one you provide don't match");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });

    test('It should return a 400 error if the username specified in the transaction to be deleted and the one derived from the refreshToken are different', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "OtherUser", email: "OtherUser@gmail.com", password: "Password", role: "Regular"}]).then(() => {
            categories.create({type: "RealCategory", color: "#aabbcc"}).then(() => {
                transactions.create({username: "OtherUser", type: "RealCategory", amount: 15}).then((createdTransaction) => {

                    const transactionID = createdTransaction._id;

                    request(app)
                    .delete("/api/users/RealRegularUser/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2Mjc3NjgsImV4cCI6MTcxNzE2Mzc2OCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJyb2xlIjoiUmVndWxhciJ9.oVPmvlwGiMRodJNeWMYwjhRNC7vfEJwOfvW9EukOBp4'])
                    .send({
                        _id: transactionID
                    })
                    .then(async (response) => {
                        expect(response.status).toBe(400);
                        expect(response.body.error).toEqual("You are not the owner of the transaction, you cannot delete it");
    
                        done()
                    }).catch((err) => done(err));
                })
                
            })
        })
    });
})

describe("deleteTransactions", () => { 

    test('Should return the successful message with the change', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
          //  categories.create([{type: "RealCategory", color: "#aabbcc"}, {type: "OtherCategory", color: "#ccbbaa"}]).then(() => {
                transactions.create([{username: user1Id, type: "RealCategory", amount: 15}, {username: user2Id, type: "OtherCategory", amount: 25}, {username: user3Id, type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
                    const transaction1ID=createdTransaction[0]._id;
                    const transaction2ID=createdTransaction[1]._id;
                    const transaction3ID=createdTransaction[2]._id;
                    request(app)
                    .delete("/api/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .send({_ids:[transaction1ID,transaction3ID]})
                    .then(async (response) => {
                        expect(response.body.data.message).toEqual("Transactions deleted.");
                        expect(response.body.data.refreshedTokenMessage).toEqual("undefined");
                        expect(response.status).toBe(200);
                        done()
                    }).catch((err) => done(err));
                })
        })
    });

    test('Should return an error if not contain all the necessary attributes', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
                transactions.create([{username: user1Id, type: "RealCategory", amount: 15}, {username: user2Id, type: "OtherCategory", amount: 25}, {username: user3Id, type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
                    const transaction1ID=createdTransaction[0]._id;
                    const transaction2ID=createdTransaction[1]._id;
                    const transaction3ID=createdTransaction[2]._id;
                    request(app)
                    .delete("/api/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .send({_id:[transaction1ID,transaction3ID]})
                    .then(async (response) => {
                        expect(response.body.error).toEqual("You have wrong attribute");
                        expect(response.status).toBe(400);
                        done()
                    }).catch((err) => done(err));
                })
        })
    });

    test('Should return an error if exist empty string', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
                transactions.create([{username: user1Id, type: "RealCategory", amount: 15}, {username: user2Id, type: "OtherCategory", amount: 25}, {username: user3Id, type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
                    const transaction1ID=createdTransaction[0]._id;
                    const transaction2ID=createdTransaction[1]._id;
                    const transaction3ID=createdTransaction[2]._id;
                    request(app)
                    .delete("/api/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .send({_ids:[transaction1ID, "", transaction3ID]})
                    .then(async (response) => {
                        expect(response.body.error).toEqual("Some transactions do not exist or empty string exists.");
                        expect(response.status).toBe(400);
                        done()
                    }).catch((err) => done(err));
                })
        })
    });

    test('Should return an error if Some transactions do not exist', (done) => {
        User.create([{username: "RealRegularUser", email: "rRegularUser@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
            const user1Id = createdUsers[0]._id;
            const user2Id = createdUsers[1]._id;
            const user3Id = createdUsers[2]._id;
                transactions.create([{username: user1Id, type: "RealCategory", amount: 15}, {username: user2Id, type: "OtherCategory", amount: 25}, {username: user3Id, type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
                    const transaction1ID=createdTransaction[0]._id;
                    const transaction2ID=createdTransaction[1]._id;
                    const transaction3ID=createdTransaction[2]._id;
                    const ObjectID4 = require('mongodb').ObjectId;
                    request(app)
                    .delete("/api/transactions")
                    .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                    .send({_ids:[transaction1ID, ObjectID4, transaction3ID]})
                    .then(async (response) => {
                        expect(response.body.error).toEqual("Some transactions do not exist or empty string exists.");
                        expect(response.status).toBe(400);
                        done()
                    }).catch((err) => done(err));
                })
        })
    });

    test('Should return an error if it is not admin authorized', (done) => {
        request(app)
        .delete("/api/transactions/")
        .then(async (response) => {
            expect(response.status).toBe(401);
            expect(response.body.error).toEqual("Unauthorized");
            done()
        }).catch((err) => done(err));
    });
})
