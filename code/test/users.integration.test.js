import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User, Group} from '../models/User';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { response } from 'express';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
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


describe("getUsers", () => {
  
  beforeEach(async () => {
    await User.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";



  test('Should return an error if it is not authorized', async ()=>{
    
    const response = await request(app)
                     .get("/api/users")
                     
    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('Should return an error if it is not admin authorized', async ()=>{
    
    const response = await request(app)
                     .get("/api/users")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
    
    expect(response.body).toEqual({error: "The user must be an Admin"});
    expect(response.status).toBe(401);

  });

  test("should return empty list if there are no users", async () => {
    
    const response = await request(app)
                     .get("/api/users")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
    
  
    expect(response.status).toBe(200)
  
    expect(response.body).toEqual({ data : []})

    
  });

  test("should retrieve list of all users", async () => {

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test2 = {
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(test1);
    await User.create(test2);


    const response = await request(app)
                    .get("/api/users")
                    .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])


    expect(response.status).toBe(200)

    expect(response.body).toEqual({data : [{
      username : "test1",
      email : "test1@gmail.com",
      role : "Regular"
    },{
      username : "test2",
      email : "test2@gmail.com",
      role : "Regular"
    }]});

  });

});


describe("getUser", () => {

  beforeEach(async () => {
    await User.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";


  test('Should return an error message if the username is not specified', async () =>{
    
    const response = await request(app)
                     .get("/api/users/:username")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
    
    expect(response.body).toEqual({error: "You have to insert the username"});
    expect(response.status).toBe(400);

  });

  test('Should return an error message if the user (regular or admin) is not authorized', async () =>{
    
    const response = await request(app)
                     .get("/api/users/test1")
                     
    
    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);
  });

  test('Should return an error message if the regular user is not authorized', async () =>{

    const response = await request(app)
                     .get("/api/users/test1")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
    
    expect(response.body).toEqual({error: "The username of the cookie and that one you provide don't match"});
    expect(response.status).toBe(401);

  });

  test('Should return an error message if the username specified (by admin) does not exist', async() => {

    const response = await request(app)
                    .get("/api/users/test1")
                    .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.status).toBe(400);
    expect(response.body).toEqual({error: "User not found"})

      
  });

  test("Should return information of the regular user who called the func", async () => {

    const user = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    };

    await User.create(user);

    const response = await request(app)
                    .get("/api/users/userTest")
                    .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.status).toBe(200);
    expect(response.body).toEqual({"data": {
        username : "userTest",
        email : "userTest@gmail.com",
        role : "Regular"
      }})

  });

  test("Should return information of the admin who called the func", async () => {
    
    const user = {
      username : "adminTest",
      email : "adminTest@gmail.com",
      password : "hashedPassword",
      role : "Admin"
    };

    await User.create(user);

    const response = await request(app)
                    .get("/api/users/adminTest")
                    .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.status).toBe(200);
    expect(response.body).toEqual({"data": {
        username : "adminTest",
        email : "adminTest@gmail.com",
        role : "Admin"
      }})
    
  });

  test("Should return information of the user specified by the admin", async () => {
    
    const user = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    };

    await User.create(user);

    const response = await request(app)
                    .get("/api/users/test1")
                    .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.status).toBe(200);
    expect(response.body).toEqual({"data": {
        username : "test1",
        email : "test1@gmail.com",
        role : "Regular"
      }})

  });

});


describe("createGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";

 
  test('Should return an error if there is not the name of the group', async ()=>{
    
    const response = await request(app)
                     .post("/api/groups")
                     .send({memberEmails : ["test1@gmail.com" , "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: "The request body does not contain all the necessary attributes!"});
    expect(response.status).toBe(400);

  });

  test('Should return an error if there are not the member emails', async ()=>{

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test"})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                                 
    expect(response.body).toEqual({error: "The request body does not contain all the necessary attributes!"});
    expect(response.status).toBe(400);

  });

  test('Should return an error if there is already a group with the specified name', async ()=>{
    
    const group = {
      name : "group_test",
      members : [
        {
          email : "test1@gmail.com",
          id : "1"
        },
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test3@gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `The group group_test already exists`});
    expect(response.status).toBe(400);

  });

  test('Should return an error if the group name is already an empty string ', async ()=>{


    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "", memberEmails : ["test3@gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `The group name can not be an empty string!`});
    expect(response.status).toBe(400);

  });

  test('Should return an error if the user is already in a group ', async ()=>{

    const group = {
      name : "group_",
      members : [
        {
          email : "userTest@gmail.com",
          id : "1"
        },
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test3@gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `You can not crate a new group: you are already in a group!`});
    expect(response.status).toBe(400);

  });

  test('Should return an error if one or more emails are wrong', async ()=>{
    
    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test3.gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `At least one email is not valid!`});
    expect(response.status).toBe(400);

  });

  test('Should return an error if one or more emails are empty string', async ()=>{
   
    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `At least one email is empty!`});
    expect(response.status).toBe(400);

  });

  test('Should return an error if there are not member emails', async ()=>{
    
    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(test1);

    const group = {
      name : "group_",
      members : [
        {
          email : "test1@gmail.com",
          id : "1"
        },
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : []})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.body).toEqual({error: `Member emails are required!`});
    expect(response.status).toBe(400);

  });

  test('A new group is created. All the users are included in the group, who calls the function is not icluded in memerEmails', async ()=>{
    
    const userTest = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(userTest);
    await User.create(test1);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test1@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "userTest@gmail.com"
        }
      ]},
      alreadyInGroup : [],
      membersNotFound : []
    }});
    
  });

  test('A new group is created. One user is not found', async ()=>{
    
    const userTest = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(userTest);
    await User.create(test1);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["userTest@gmail.com", "test1@gmail.com", "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data : {
      group : {name : "group_test", members : [
        {
          email : "userTest@gmail.com"
        },
        {
          email : "test1@gmail.com"
        }
      ]},
      alreadyInGroup : [],
      membersNotFound : [
        "test2@gmail.com"
      ]
    }});

  });

  test('A new group is created. One user is already in a group, who calls the function is not icluded in memerEmails', async ()=>{
   
    const userTest = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test2 = {
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(userTest);
    await User.create(test1);
    await User.create(test2);

    const group = {
      name : "group_",
      members : [
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "userTest@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test2@gmail.com"
      ],
      membersNotFound : []
    }});

  });

  test('A new group is created. One user is already in a group, one does not exist, who calls the function is not icluded in memerEmails', async ()=>{
    
    const userTest = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test2 = {
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(userTest);
    await User.create(test1);
    await User.create(test2);

    const group = {
      name : "group_",
      members : [
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmai.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "userTest@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test2@gmail.com"
      ],
      membersNotFound : [
        "test3@gmai.com"
      ]
    }});

  });

  test('Should return an error if you are not authorized', async ()=>{
    
    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test1@gmail.com" , "test2@gmail.com"]})
    

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('Should return an error if no one can be added in the group. One user is already in a group, one user does not exist', async ()=>{
   
    const userTest = {
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test1 = {
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    const test2 = {
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
      role : "Regular"
    }

    await User.create(userTest);
    await User.create(test1);
    await User.create(test2);

    const group = {
      name : "group_",
      members : [
        {
          email : "test1@gmail.com" ,
          id : "1"
        },
        {
          email : "test2@gmail.com" ,
          id : "2"
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .post("/api/groups")
                     .send({name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmai.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
                     
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'No one can be added to this group' });

    
  });


});


describe("getGroups", () => { 

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";



  test('Should return an error if it is not admin authorized', async ()=>{

    const response = await request(app)
                     .get("/api/groups")
                     
    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('Should return an error if the user is not an admin', async ()=>{

    const response = await request(app)
                     .get("/api/groups")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
    
    expect(response.body).toEqual({error: "The user must be an Admin"});
    expect(response.status).toBe(401);

  });

  test("should return empty list if there are no groups", async () => {

  const response= await request(app)
                     .get("/api/groups")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
    
    expect(response.body).toEqual({"data" : [] });
    expect(response.status).toBe(200);

  });

  test("should retrieve list of all groups", async () => {

   const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword"
    })

    const u4 = await User.create({
      username : "test4",
      email : "test4@gmail.com",
      password : "hashedPassword"
    })


    const g1 = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    const g2 = {
      name : "group_test2",
      members : [
        {
          email : u3.email,
          user : u3._id
        },{
          email : u4.email,
          user : u4._id
        }
      ]
    }

    await Group.create(g1);
    await Group.create(g2);

    const response= await request(app)
                     .get("/api/groups")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
    
    expect(response.body).toEqual({"data" : [{name : "group_test", members : [{
      email : "test1@gmail.com",
      } , {
      email : "test2@gmail.com"
      }]},{name : "group_test2", members : [{
        email : "test3@gmail.com",
        } , {
        email : "test4@gmail.com"
        }]}]});
    expect(response.status).toBe(200);
    
  });

});


describe("getGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";

  test('Should return an error message if the group name in not specified', async () =>{
    
    const response = await request(app)
                     .get("/api/groups/:name")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({error: "You have to insert the group name"});
    expect(response.status).toBe(400);

  });

  test('Should return an error message if the user (regular or admin) is not authorized', async () =>{
    
    const response = await request(app)
                     .get("/api/groups/group_test")
                     //.set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('Should return an error message if the regular user is not authorized', async () =>{

    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    await User.create(u1);
    await User.create(u2);

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }


    const response = await request(app)
                     .get("/api/groups/group_test")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({error: "The email of the token doesn't match"});
    expect(response.status).toBe(401);    

  });

  test('Should return an error message if the group specified (by admin) does not exist', async() => {

    const response = await request(app)
                     .get("/api/groups/group_test")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.body).toEqual({error: "The group does not exist"});
    expect(response.status).toBe(400); 
  });

  test("Should return information of the group where regular user (who called the func) is", async () => {

    const userTest = await User.create({
      username : "userTest",
      email : "userTest@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : userTest.email,
          user : userTest._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .get("/api/groups/group_test")
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({"data" : { group : {
      name : "group_test", 
      members : [
        {
          email : "userTest@gmail.com",
          } , {
          email : "test2@gmail.com"
        }
      ]
      }}});

    expect(response.status).toBe(200);  

  });

  test("Should return information of the group where admin (who called the func) is", async () => {
    
    const adminTest = await User.create({
      username : "adminTest",
      email : "adminTest@gmail.com",
      password : "hashedPassword",
      role : "Admin"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : adminTest.email,
          user : adminTest._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .get("/api/groups/group_test")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.body).toEqual({"data" : { group : {
      name : "group_test", 
      members : [
        {
          email : "adminTest@gmail.com",
          } , {
          email : "test2@gmail.com"
        }
      ]
      }}});

    expect(response.status).toBe(200);    

  });

  test("Should return information of the group specified by the admin", async () => {
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .get("/api/groups/group_test")
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

    expect(response.body).toEqual({"data" : { group : {
      name : "group_test", 
      members : [
        {
          email : "test1@gmail.com",
          } , {
          email : "test2@gmail.com"
        }
      ]
      }}});

    expect(response.status).toBe(200);

  });

});


describe("addToGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";

  
  test('should return an error if it is unauthorized (user)', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/add")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})
                     //.set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('should return an error if it is unauthorized (admin)', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/insert")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('should return an error if the request body is empty', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/insert")
                     .send({emails : []})

    expect(response.body).toEqual({error: "emails are required"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if the request body is empty', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/insert")
                     .send({})

    expect(response.body).toEqual({error: "emails are required"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if the params are empty', async ()=>{

    const response = await request(app)
                     .patch("/api/groups/:name/insert")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})

    expect(response.body).toEqual({error: "You have to insert the group name"});
    expect(response.status).toBe(400);

  });

  test('should return an error if the user is unauthorized', async ()=>{

    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .patch("/api//groups/group_test/add")
                     .send({emails : ["test3@gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    
    expect(response.body).toEqual({error: "The email of the token doesn't match"});
    expect(response.status).toBe(401);
    

  });

  test('should return an error if the user is not an Admin', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);

    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["test1@gmail.com" , "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    
    expect(response.body).toEqual({error: "The user must be an Admin"});
    expect(response.status).toBe(401);
    
  });

  test('should return an error if the group does not exist (the user is an Admin)', async ()=>{
    
    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["test1@gmail.com" , "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({error: "The group does not exist"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if al least one email has the worng format', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);


    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["test3.gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({error: "at least one email is not valid!"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if al least one email is empty', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);


    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({error: "at least one email is empty!"});
    expect(response.status).toBe(400);
    
  });

  test('The group is updated', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword"
    })

    const u4 = await User.create({
      username : "test4",
      email : "test4@gmail.com",
      password : "hashedPassword"
    })

    const u5 = await User.create({
      username : "test5",
      email : "test5@gmail.com",
      password : "hashedPassword"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    const group2 = {
      name : "group_test2",
      members : [
        {
          email : u3.email,
          user : u3._id
        },{
          email : u4.email,
          user : u4._id
        }
      ]
    }

    await Group.create(group);
    await Group.create(group2);

    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["test3@gmail.com" , "test4@gmail.com", "test5@gmail.com", "test6@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        },
        {
          email : "test5@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test3@gmail.com",
        "test4@gmail.com"
      ],
      membersNotFound : [
        "test6@gmail.com"
      ]
    }});
    expect(response.status).toBe(200);
    
  });

  test('should return an error because no one can be added into the group', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword"
    })

    const u4 = await User.create({
      username : "test4",
      email : "test4@gmail.com",
      password : "hashedPassword"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    const group2 = {
      name : "group_test2",
      members : [
        {
          email : u3.email,
          user : u3._id
        },{
          email : u4.email,
          user : u4._id
        }
      ]
    }

    await Group.create(group);
    await Group.create(group2);

    const response = await request(app)
                     .patch("/api//groups/group_test/insert")
                     .send({emails : ["test3@gmail.com" , "test4@gmail.com", "test5@gmail.com", "test6@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({ error: 'No one can be added to this group' });
    expect(response.status).toBe(400);

  });

});


describe("removeFromGroup", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Group.deleteMany({})
  })

  const accessTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const refreshTokenRegular = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJUZXN0QGdtYWlsLmNvbSIsImlkIjoiNjQ3YzkxM2RkMDAwYTFjMjQ3MmY5Mzk1IiwidXNlcm5hbWUiOiJ1c2VyVGVzdCIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODg1NDYxLCJleHAiOjE3MTc0MjE0NjF9.J4XNfKJ9wc8rw74TVgU5YMd39j9zfaol6Gy3kcb4euw";
  const accessTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  const refreshTokenAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluVGVzdEBnbWFpbC5jb20iLCJpZCI6IjY0N2M5MTU2ZDAwMGExYzI0NzJmOTM5OCIsInVzZXJuYW1lIjoiYWRtaW5UZXN0Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1ODg1NDE3LCJleHAiOjE3MTc0MjE0MTd9.J2-G2bDYYfnd3MPS5u5IippQ6qsenTBNmrCZoDZtnBQ";
  test('should return an error if it is unauthorized (user)', async ()=>{
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api/groups/group_test/remove")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})
                     //.set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('should return an error if it is unauthorized (admin)', async ()=>{
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api/groups/group_test/pull")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})

    expect(response.body).toEqual({error: "Unauthorized"});
    expect(response.status).toBe(401);

  });

  test('should return an error if the memberEmails body is empty', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/remove")
                     .send({emails : []})

    expect(response.body).toEqual({error: "emails are required"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if the request body is empty', async ()=>{
    
    const response = await request(app)
                     .patch("/api/groups/group_test/pull")
                     .send({})

    expect(response.body).toEqual({error: "emails are required"});
    expect(response.status).toBe(400);
    
  });

  test('should return an error if the params are empty', async ()=>{

    const response = await request(app)
                     .patch("/api/groups/:name/pull")
                     .send({emails : ["test1@gmail.com" , "test1@gmail.com"]})

    expect(response.body).toEqual({error: "You have to insert the group name"});
    expect(response.status).toBe(400);

  });

  test('should return an error if the user is not an Admin', async ()=>{
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })
    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }

    await Group.create(group);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com" , "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenRegular}`,`refreshToken=${refreshTokenRegular}`])
    expect(response.body).toEqual({error: "The user must be an Admin"});
    expect(response.status).toBe(401);
    
  });

  test('should return an error if the group does not exist (Admin route)', async ()=>{
    
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com" , "test2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])

  
    expect(response.body).toEqual({error: "The group does not exist"});
    expect(response.status).toBe(400);
    
  });


  test('should return an error if the group contains only one member', (done) => {
    User.create([{username: "test1", email: "test1@gmail.com", password: "Password", role: "Regular"}, 
    {username: "test2", email: "test2@gmail.com", password: "Password", role: "Regular"}, 
    {username: "test3", email: "test3@gmail.com", password: "Password", role: "Regular"},
    {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"},
    {username: "RealAdminUser2", email: "rAdminUser2@gmail.com", password: "Password", role: "Admin"}
  ]).then((createdUsers) => {
   const user1Id = createdUsers[0]._id;
   const user2Id = createdUsers[1]._id;
   const user3Id = createdUsers[2]._id;
   const user5Id = createdUsers[4]._id;
          Group.create({name: "group_test", members: [{email: "test1@gmail.com", user: user1Id}]}).then(() => {
              //done();
              request(app)
              .patch("/api/groups/group_test/pull/")
              //.set('authType', 'Admin')
              .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
              .send({emails:["test1@gmail.com","test2@gmail.com","rAdminUser2@gmail.com","notuser@qq.com"]})
              .then(async (response) => {
                expect(response.body.error).toEqual("The group only exists one member");
                expect(response.status).toBe(400);
                  done();
                  
              }).catch((err) => done(err));
          })
        })
  });

  test('should return an error if at least one email has the wrong format', async ()=>{
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test3gmail.com" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
  
    expect(response.body).toEqual({error: "at least one email is not valid!"});
    expect(response.status).toBe(400);
  });

  test('should return an error if at least one email is empty', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword"
    })


    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["" , "test4@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
    expect(response.body).toEqual({error: "at least one email is empty!"});
    expect(response.status).toBe(400);
    
  });

  test('Should return the successful message with all the required users are removed from the group', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com","test2@gmail.com","rAdminUser2@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                expect(response.body.data.group.members).toEqual([{email:"test3@gmail.com"}]);
                expect(response.body.data.notInGroup).toEqual([]);
                expect(response.body.data.membersNotFound).toEqual([]);
                expect(response.status).toBe(200);
  });

  test('Should return the successful message with One user does not exist', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }
    await Group.create(group);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com","test2@gmail.com","rAdminUser2@gmail.com","notuser@qq.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                expect(response.body.data.group.members).toEqual([{email:"test3@gmail.com"}]);
                expect(response.body.data.notInGroup).toEqual([]);
                expect(response.body.data.membersNotFound).toEqual(["notuser@qq.com"]);
                expect(response.status).toBe(200);
  });

  test('Should return the successful message with One user in another group', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const u6 = await User.create({
      username : "test6",
      email : "test6@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u7 = await User.create({
      username : "test7",
      email : "test7@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }

    const group2 = {
      name : "group_test2",
      members : [
        {
          email : u6.email,
          user : u6._id
        },{
          email : u7.email,
          user : u7._id
        }
      ]
    }
    await Group.create(group);
    await Group.create(group2);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com","test2@gmail.com","rAdminUser2@gmail.com","test6@gmail.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                expect(response.body.data.group.members).toEqual([{email:"test3@gmail.com"}]);
                expect(response.body.data.notInGroup).toEqual(["test6@gmail.com"]);
                expect(response.body.data.membersNotFound).toEqual([]);
                expect(response.status).toBe(200);
  });

  test('Should return the successful message with One user does not exist and one is in another group', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const u6 = await User.create({
      username : "test6",
      email : "test6@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u7 = await User.create({
      username : "test7",
      email : "test7@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }

    const group2 = {
      name : "group_test2",
      members : [
        {
          email : u6.email,
          user : u6._id
        },{
          email : u7.email,
          user : u7._id
        }
      ]
    }
    await Group.create(group);
    await Group.create(group2);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test1@gmail.com","test2@gmail.com","rAdminUser2@gmail.com","test6@gmail.com","nouser@qq.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                expect(response.body.data.group.members).toEqual([{email:"test3@gmail.com"}]);
                expect(response.body.data.notInGroup).toEqual(["test6@gmail.com"]);
                expect(response.body.data.membersNotFound).toEqual(["nouser@qq.com"]);
                expect(response.status).toBe(200);
  });

  test('should return an error. One user does not exist and one is already in another group : no one can be removed from the group', async ()=>{
    
    const u1 = await User.create({
      username : "test1",
      email : "test1@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u2 = await User.create({
      username : "test2",
      email : "test2@gmail.com",
      password : "hashedPassword",
          role:"Regular"
    })

    const u3 = await User.create({
      username : "test3",
      email : "test3@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u4 = await User.create({
      username : "RealAdminUser",
      email : "rAdminUser@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

const u5 = await User.create({
      username : "RealAdminUser2",
      email : "rAdminUser2@gmail.com",
      password : "hashedPassword",
role:"Admin"
    })

    const u6 = await User.create({
      username : "test6",
      email : "test6@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const u7 = await User.create({
      username : "test7",
      email : "test7@gmail.com",
      password : "hashedPassword",
role:"Regular"
    })

    const group = {
      name : "group_test",
      members : [
        {
          email : u1.email,
          user : u1._id
        },{
          email : u2.email,
          user : u2._id
        },{
          email : u3.email,
          user : u3._id
        },{
          email : u5.email,
          user : u5._id
        }
      ]
    }

    const group2 = {
      name : "group_test2",
      members : [
        {
          email : u6.email,
          user : u6._id
        },{
          email : u7.email,
          user : u7._id
        }
      ]
    }
    await Group.create(group);
    await Group.create(group2);
    const response = await request(app)
                     .patch("/api//groups/group_test/pull")
                     .send({emails : ["test4@gmail.com","nouser@qq.com"]})
                     .set("Cookie", [`accessToken=${accessTokenAdmin}`,`refreshToken=${refreshTokenAdmin}`])
                     expect(response.body.error).toEqual("No one can be removed from this group");
                     expect(response.status).toBe(400);
  });

 });


describe("deleteUser", () => {

  test('Should return the successful message with the change, user not in a group', (done) => {
      User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
     const user1Id = createdUsers[0]._id;
     const user2Id = createdUsers[1]._id;
     //done();
     transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
            Group.create({name: "group_test", members: [{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
                //done();
                request(app)
                .delete("/api/users/")
                .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                .send({email:"123@gmail.com"})
                .then(async (response) => {
                  expect(response.body.data.message).toEqual("User has been deleted.");
                  expect(response.body.data.deletedTransactions).toEqual(2);
                  expect(response.body.data.deletedFromGroup).toEqual(false);
                  expect(response.status).toBe(200);
                    done();
                    
                }).catch((err) => done(err));
            })
          })
    })
});

test('Should return the successful message with the change, user in a group', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 //done();
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            //done();
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"123@gmail.com"})
            .then(async (response) => {
              expect(response.body.data.message).toEqual("User has been deleted.");
              expect(response.body.data.deletedTransactions).toEqual(2);
              expect(response.body.data.deletedFromGroup).toEqual(true);
              expect(response.body.data.groupDelete).toEqual(false);
              expect(response.status).toBe(200);
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return the successful message with the change, user is the only member in the group', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "123", type: "OtherCategory2", amount: 35}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"123@gmail.com"})
            .then(async (response) => {
              expect(response.body.data.message).toEqual("User has been deleted.");
              expect(response.body.data.deletedTransactions).toEqual(3);
              expect(response.body.data.deletedFromGroup).toEqual(true);
              expect(response.body.data.groupDelete).toEqual(true);
              expect(response.status).toBe(200);
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if not contain all the necessary attributes', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
  const user1Id = createdUsers[0]._id;
  const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("you have to insert email!");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if it is an empty string', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:""})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("you have to insert email!");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if invalid email format with no "@" symbol', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"123qq.com"})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("invalid email format!");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if invalid email format with one more "@" symbol', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"1@2@3@qq.com"})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("invalid email format!");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if the user does not exist', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}, {username: "RealAdminUser2", email: "rAdminUser2@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"987@qq.com"})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("The user does not exist");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

test('Should return an error if the deleted user is an admin', (done) => {
  User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}, {username: "RealAdminUser2", email: "rAdminUser2@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
 const user1Id = createdUsers[0]._id;
 const user2Id = createdUsers[1]._id;
 transactions.create([{username: "123", type: "RealCategory", amount: 15}, {username: "123", type: "OtherCategory", amount: 25}, {username: "DifferentUser", type: "RealCategory", amount: 5} ]).then((createdTransaction) => {
        Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id},{email: "DifferentUser@gmail.com", user: user2Id}]}).then(() => {
            request(app)
            .delete("/api/users/")
            .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
            .send({email:"rAdminUser2@gmail.com"})
            .then(async (response) => {
              expect(response.status).toBe(400);
              expect(response.body.error).toEqual("The user is an admin");
                done();
                
            }).catch((err) => done(err));
        })
      })
})
});

  test('Should return an error if it is not admin authorized', (done) => {
    request(app)
    .delete("/api/users/")
    .then(async (response) => {
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Unauthorized");
        done()
    }).catch((err) => done(err));
});

 });

describe("deleteGroup", () => {

  test('Should return the successful message with the change', (done) => {
    //done();
    //User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "Xiong", email: "admin@gmail.com", password: "password", role: "Admin"}]).then((createdUsers) => {
      User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
     const user1Id = createdUsers[0]._id;
     //done();
            Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id}]}).then(() => {
                //done();
                request(app)
                .delete("/api/groups/")
                .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
                .send({name:"group_test"})
                .then(async (response) => {
                    expect(response.status).toBe(200);
                    done();
                    
                }).catch((err) => done(err));
            })
    })
});

test('Should return an error if the group not exists', (done) => {
  //done();
    User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
   const user1Id = createdUsers[0]._id;
   //done();
          Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id}]}).then(() => {
              //done();
              request(app)
              .delete("/api/groups/")
              .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
              .send({name:"group_test2"})
              .then(async (response) => {
                  expect(response.body.error).toEqual("The group does not exist");
                  expect(response.status).toBe(400);
                  done();
                  
              }).catch((err) => done(err));
          })
  })
});

test('Should return an error if it is an empty string', (done) => {
  //done();
    User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
   const user1Id = createdUsers[0]._id;
   //done();
          Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id}]}).then(() => {
              //done();
              request(app)
              .delete("/api/groups/")
              .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
              .send({name:""})
              .then(async (response) => {
                  expect(response.body.error).toEqual("you have to insert group name!");
                  expect(response.status).toBe(400);
                  done();
                  
              }).catch((err) => done(err));
          })
  })
});

test('Should return an error if not contain all the necessary attributes', (done) => {
  //done();
    User.create([{username: "123", email: "123@gmail.com", password: "Password", role: "Regular"}, {username: "DifferentUser", email: "DifferentUser@gmail.com", password: "Password", role: "Regular"}, {username: "RealAdminUser", email: "rAdminUser@gmail.com", password: "Password", role: "Admin"}]).then((createdUsers) => {
   const user1Id = createdUsers[0]._id;
   //done();
          Group.create({name: "group_test", members: [{email: "123@gmail.com", user: user1Id}]}).then(() => {
              //done();
              request(app)
              .delete("/api/groups/")
              .set('Cookie',['accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE','refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIiLCJpYXQiOjE2ODU2MTUxNDAsImV4cCI6MTcxNzE1MTE0MCwiYXVkIjoiIiwic3ViIjoiIiwidXNlcm5hbWUiOiJSZWFsQWRtaW5Vc2VyIiwiZW1haWwiOiJyQWRtaW5Vc2VyQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.Mb-NsIeQTODze3TMCo7CK81MAO-NEjeIU3rZtR8qSBE'])
              .send({nam:"group_test"})
              .then(async (response) => {
                expect(response.body).not.toHaveProperty("name");
                expect(response.body.error).toEqual("you have to insert group name!");
                  expect(response.status).toBe(400);
                  done();
                  
              }).catch((err) => done(err));
          })
  })
});


  test('Should return an error if it is not admin authorized', (done) => {
    request(app)
    .delete("/api/groups/")
    .then(async (response) => {
        expect(response.status).toBe(401);
        expect(response.body.error).toEqual("Unauthorized");
        done()
    }).catch((err) => done(err));
});
 });
