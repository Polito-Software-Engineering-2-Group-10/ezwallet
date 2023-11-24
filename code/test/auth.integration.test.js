import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import { categories, transactions } from '../models/model';
import { User, Group} from '../models/User.js';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { response } from 'express';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
 // const dbName = "test";
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

describe('register', () => {

  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('should return an error if not all fields are entered', async () => {

    const response = await request(app)
                     .post("/api/register")
                     .send({username : "userTest", email : "userTest@gmail.com"})
    
    expect(response.body).toEqual({error: "You have to insert username, email and password!"});
    expect(response.status).toBe(400);

  });

  test('should return an error if at least one field is empty', async () => {

    const response = await request(app)
                     .post("/api/register")
                     .send({username : "", email : "userTest@gmail.com", password : "hashedPassword"})
    
    expect(response.body).toEqual({error: "Username, email and password can not be empy!"});
    expect(response.status).toBe(400);

  });

  test('should return an error if the email has a wrong format', async () => {
    
    const response = await request(app)
                     .post("/api/register")
                     .send({username : "userTest", email : "userTest.gmail.com", password : "hashedPassword"})
    
    expect(response.body).toEqual({error: "The email is not valid!"});
    expect(response.status).toBe(400);

  });

  test('should return an error if the username already exists', async () => {
    
    const user = {
      username : "userTest",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    };

    await User.create(user);

    const response = await request(app)
                     .post("/api/register")
                     .send({username : "userTest", email : "userTest@gmail.com", password : "hashedPassword"})
    
    expect(response.body).toEqual({error: "Username and/or email are already in our database!"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if the email already exists', async () => {

    const user = {
      username : "test1",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    };

    await User.create(user);

    const response = await request(app)
                     .post("/api/register")
                     .send({username : "userTest", email : "userTest@gmail.com", password : "hashedPassword"})
    
    expect(response.body).toEqual({error: "Username and/or email are already in our database!"});
    expect(response.status).toBe(400)

  });

  test('should create a new user and return 200', async () => {
    
    const response = await request(app)
                     .post("/api/register")
                     .send({username : "userTest", email : "userTest@gmail.com", password : "hashedPassword"})
    
    expect(response.body).toEqual({data : {message : 'User added succesfully'}});
    expect(response.status).toBe(200)

  });

});

describe("registerAdmin", () => { 
  test('Should return the successful message with the change', (done) => {
                request(app)
                .post("/api/admin/")
                .send({username:"Admintest", email:"admintestEmail@qq.com", password:"password"})
                .then(async (response) => {
                  expect(response.body.data.message).toEqual("admin added succesfully");
                    expect(response.status).toBe(200);
                    done();
                    
                }).catch((err) => done(err));
});

test('Should return an error if at least one empty string', (done) => {
  request(app)
  .post("/api/admin/")
  .send({username:"Admintest", email:"", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("you have to insert username, email and password!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if not contain all the necessary attributes', (done) => {
  request(app)
  .post("/api/admin/")
  .send({user:"Admintest", email:"admintestEmail@qq.com", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("you have to insert username, email and password!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if invalid email format with no "@" symbol', (done) => {
  request(app)
  .post("/api/admin/")
  .send({username:"Admintest", email:"admintestEmailqq.com", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("invalid email format!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if invalid email format with one more "@" symbol', (done) => {
  request(app)
  .post("/api/admin/")
  .send({username:"Admintest", email:"admin@test@Email@qq.com", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("invalid email format!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if the email exists', (done) => {
    User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
              request(app)
              .post("/api/admin/")
              .send({username:"RealAdminUser2", email:"rAdminUser@gmail.com", password:"password"})
              .then(async (response) => {
                expect(response.body.error).toEqual("you are already registered");
                  expect(response.status).toBe(400);
                  done();
              }).catch((err) => done(err));
  })
});

test('Should return an error if the username exists ', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then(() => {
            request(app)
            .post("/api/admin/")
            .send({username:"RealAdminUser", email:"rAdminUser666@gmail.com", password:"password"})
            .then(async (response) => {
              expect(response.body.error).toEqual("you are already registered");
                expect(response.status).toBe(400);
                done();
            }).catch((err) => done(err));
})
});

});

describe('login', () => { 
  beforeEach (async() =>{
    await User.deleteMany();
  });
test('Should return successful message', async () =>{
  const userinfo={
    username : "Xiong",
    email : "457370806@qq.com",
    password:"xiong47525631"
  }
   await User.create({username:userinfo.username, email:userinfo.email, password: await bcrypt.hash(userinfo.password,12)});
  const response = await request(app)
 .post("/api/login")
 .send({ email: userinfo.email, password: userinfo.password });
 expect(response.status).toBe(200);
});

test('Should return an error if not contain all the necessary attributes', (done) => {
  request(app)
  .post("/api/login/")
  .send({password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("you have to insert email and password!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if at least one empty string', (done) => {
  request(app)
  .post("/api/login/")
  .send({email:"123@qq.com", password:""})
  .then(async (response) => {
    expect(response.body.error).toEqual("you have to insert email and password!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if invalid email format with no "@" symbol', (done) => {
  request(app)
  .post("/api/login/")
  .send({email:"admintestEmailqq.com", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("invalid email format!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if invalid email format with one more "@" symbol', (done) => {
  request(app)
  .post("/api/login/")
  .send({email:"admin@test@Email@qq.com", password:"password"})
  .then(async (response) => {
    expect(response.body.error).toEqual("invalid email format!");
      expect(response.status).toBe(400);
      done();
      
  }).catch((err) => done(err));
});

test('Should return an error if the email not exists', (done) => {
  const passString="password";
  User.create([{username: "RealAdminUser", email: "rAdminUser@gmail.com", password: passString, role: "Admin", refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE"}]).then((createdUsers) => {
    //const user1Id = createdUsers[0]._id;
               request(app)
               .post("/api/login/")
               //.set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
               .send({email: "rAdminUser2@gmail.com", password: passString})
               .then(async (response) => {
                   expect(response.body.error).toEqual("please you need to register");
                   expect(response.status).toBe(400);
                   done();
                   
               }).catch((err) => done(err));
   })
});

test('Should return an error if the supplied password does not match', (done) => {
  //const passString="password";
  User.create([{username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "password", role: "Admin", refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE"}]).then((createdUsers) => {
    //const user1Id = createdUsers[0]._id;
               request(app)
               .post("/api/login/")
               //.set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
               .send({email: "rAdminUser@gmail.com", password: "wrongpassword"})
               .then(async (response) => {
                   expect(response.body.error).toEqual("wrong credentials");
                   expect(response.status).toBe(400);
                   done();
                   
               }).catch((err) => done(err));
   })
});

});

describe('logout', () => { 
  test('Should return successful message', (done) => {
      User.create([{username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin", refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE"}]).then((createdUsers) => {
     const user1Id = createdUsers[0]._id;
                request(app)
                .get("/api/logout/")
                .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                .send()
                .then(async (response) => {
                    expect(response.body.data.message).toEqual("User logged out");
                    expect(response.status).toBe(200);
                    done();
                    
                }).catch((err) => done(err));
    })
});

test('Should return an error if it has logged out', (done) => {
  User.create([{username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin", refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
            request(app)
            .get("/api/logout/")
            .set('Cookie',[])
            .send()
            .then(async (response) => {
                expect(response.body.error).toEqual("user has logged out");
                expect(response.status).toBe(400);
                done();
                
            }).catch((err) => done(err));
})
});

test('Should return an error if refresh token does not match', (done) => {
  User.create([{username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin", refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
            request(app)
            .get("/api/logout/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=WrongfreshToken'])
            .send()
            .then(async (response) => {
                expect(response.body.error).toEqual("user not found");
                expect(response.status).toBe(400);
                done();
                
            }).catch((err) => done(err));
})
});

});
