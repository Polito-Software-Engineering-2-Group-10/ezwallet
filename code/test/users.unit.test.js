import request from 'supertest';
import { app } from '../app';
import { Group, User } from '../models/User.js';
import { categories, transactions } from '../models/model';
import { getUsers, getUser, createGroup, getGroups, getGroup, addToGroup, removeFromGroup, deleteUser, deleteGroup } from '../controllers/users';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
jest.mock('../controllers/utils')
jest.mock('../models/model');

const utils = require("../controllers/utils")
const jwt = require('jsonwebtoken')

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  utils.verifyAuth.mockClear();
  User.find.mockClear();
  User.findOne.mockClear();
  User.deleteOne.mockClear();
  Group.find.mockClear();
  Group.findOne.mockClear();
  Group.deleteOne.mockClear();
  Group.update.mockClear();
  Group.create.mockClear();
  transactions.find.mockClear();
  transactions.findOne.mockClear();
  transactions.deleteOne.mockClear();
  //additional `mockClear()` must be placed here
});

describe("getUsers", () => {

  test('Should return an error if it is not admin authorized', async ()=>{
    const mockReq = {}
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The user must be an Admin"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "The user must be an Admin"});
    await getUsers(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(User, "find").mockResolvedValue([])
    await getUsers(mockReq, mockRes)
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({"data" : [] })
  });

  test("should retrieve list of all users", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    const retrievedUsers = {data : [{ username: 'test1', email: 'test1@gmail.com', role: 'Regular' }, { username: 'test2', email: 'test2@gmail.com', role: 'Regular' }]};
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(User, "find").mockImplementation(() => [{ username : "test1" , email: "test1@gmail.com", role : "Regular"},{ username : "test2" , email: "test2@gmail.com", role : "Regular"}])
    await getUsers(mockReq, mockRes)
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(retrievedUsers);
  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(User, "find").mockRejectedValue(new Error("An error occurred"));
    await getUsers(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    
  });

});


describe("getUser", () => {

  test('Should return an error message if the username is not specified', async () =>{
    const mockReq = {
      params: {username : ""}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "You have to insert the username"
        }
    };

    await getUser(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the user (regular or admin) is not authorized', async () =>{
    const mockReq = {
      params: {username : "test1"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "Unauthorized"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "Unauthorized"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "Unauthorized"});
    await getUser(mockReq, mockRes)
    //expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the regular user is not authorized', async () =>{
    const mockReq = {
      params: {username : "test1"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The username of the cookie and that one you provide don't match"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The username of the cookie and that one you provide don't match"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The user must be an Admin"});
    await getUser(mockReq, mockRes)
    //expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the username specified (by admin) does not exist', async() => {

      const mockReq = {
        params: {username : "NotAUser"}
      };
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: "User not found"
          }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The username of the cookie and that one you provide don't match"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue(null);
      await getUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
      
  });

  test("Should return information of the regular user who called the func", async () => {
      const mockReq = {
      params: { username: "regularUser" },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      },
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The user must be an Admin"});
    jest.spyOn(User, "findOne").mockResolvedValue({username : "regularUser", email : "regularUser@gmail.com", role : "Regular"});
    await getUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data : {
      username : "regularUser",
      email : "regularUser@gmail.com",
      role : "Regular"
  }});
  });

  test("Should return information of the admin who called the func", async () => {
    const mockReq = {
    params: { username: "realAdmin" },
  };
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
      refreshTokenMessage : undefined
    },
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
  jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValue({username : "realAdmin", email : "realAdmin@gmail.com", role : "Admin"});
  await getUser(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith({data : {
    username : "realAdmin",
    email : "realAdmin@gmail.com",
    role : "Admin"
    }});
  });

  test("Should return information of the user specified by the admin", async () => {
    const mockReq = {
      params: { username: "test" },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      },
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The username of the cookie and that one you provide don't match"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    jest.spyOn(User, "findOne").mockResolvedValue({username : "test", email : "test@gmail.com", role : "test"});
    await getUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data : {
      username : "test",
      email : "test@gmail.com",
      role : "test"
      }});

  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {
      params: { username: "realAdmin" },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      },
    };
    
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    
    jest.spyOn(User, "findOne").mockRejectedValue(new Error("An error occurred"));
    await getUser(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    
  });

});


describe("createGroup", () => { 
  
  test('Should return an error if you are not authorized', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com" ]}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "Unauthorized"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});
    await createGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if there are not all the necessary attributes', async ()=>{
    const mockReq = {
      body : { name : "group_test"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The request body does not contain all the necessary attributes!"
        }
    };

    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    await createGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if the group name is an empty string', async ()=>{
    const mockReq = {
      body : { name : "", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com" ]}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The group name can not be an empty string!"
        }
    };

    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    await createGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if there is already a group with the specified name', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com" ]}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: `The group ${mockReq.body.name} already exists`
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValue({name: 'group_test',
    members: [
      {
        email: 'test1@gmail.com',
        user: "test1",
        _id: "6468acc267e026bec0dad868" 
      }
    ]});
  
    await createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if the user is already in a group ', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com" ]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: 'You can not crate a new group: you are already in a group!'
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)
    .mockResolvedValue({
      name: 'group_test2',
    members: {
      email : 'test1@gmail.com',
      user: "test1",
      _id: "6468acc267e026bec0dad868"
    }});
    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})
    //jest.spyOn(User, "findOne").mockResolvedValue({ username : "test1" , email: "test1@gmail.com", role : "Regular"});
   
    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if one or more emails are wrong', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test1.gmail.com", "test2@gmail.com", "test3@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: 'At least one email is not valid!'
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)
    .mockResolvedValue(null);
    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"});

    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if one or more emails are empty string', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["", "test2@gmail.com", "test3@gmail.com" ]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: 'At least one email is empty!'
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null)
    .mockResolvedValue(null);
    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error if there are not member emails', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : []},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: 'Member emails are required!'
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    await createGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('A new group is created. All the users are included in the group, who calls the function is not icluded in memerEmails', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test2@gmail.com", "test3@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test2" , email : "test2@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test1" , email : "test1@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(Group, "create").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test1ID"
    },
    {
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test2ID"
    },
    {
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test3ID"
    }
  ]}));


    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test2@gmail.com"
        },
        {
          email : "test3@gmail.com"
        },
        {
          email : "test1@gmail.com"
        }
      ]},
      alreadyInGroup : [],
      membersNotFound : []
    }});
  });

  test('A new group is created. One user is not found, who calls the function is not icluded in memerEmails', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test2@gmail.com", "test3@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test1" , email : "test1@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(Group, "create").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    },
    {
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    }
  ]}));


    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test3@gmail.com"
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
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test2@gmail.com", "test3@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test2" , email : "test2@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name: 'group_test2',
    members: {
      email : 'test2@gmail.com',
      user: "test2",
      _id: "6468acc267e026bec0dad868"
    }});

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test1" , email : "test1@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(Group, "create").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    },
    {
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    }
  ]}));


    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test3@gmail.com"
        },
        {
          email : "test1@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test2@gmail.com"
      ],
      membersNotFound : []
    }});
  });

  test('A new group is created. One user is already in a group, one does not exist, who calls the function is not icluded in memerEmails', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test2@gmail.com", "test3@gmail.com", "test4@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test2" , email : "test2@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name: 'group_test2',
    members: {
      email : 'test2@gmail.com',
      user: "test2",
      _id: "6468acc267e026bec0dad868"
    }});

    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test1" , email : "test1@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(Group, "create").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test4@gmail.com",
      User : "Test4",
      _id : "Test4ID"
    },
    {
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    }
  ]}));


    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test4@gmail.com"
        },
        {
          email : "test1@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test2@gmail.com"
      ],
      membersNotFound : [
        "test3@gmail.com"
      ]
    }});
  });

  test('Should return an error if no one can be added in the group. One user is already in a group, one user does not exist', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test1@gmail.com", "test2@gmail.com", "test3@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message : 'No one can be added to this group'
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(jwt, "verify").mockReturnValue({email : "test1@gmail.com"})

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test1" , email : "test1@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test2" , email : "test2@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name: 'group_test2',
    members: {
      email : 'test2@gmail.com',
      user: "test2",
      _id: "6468acc267e026bec0dad868"
    }});

    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);



    await createGroup(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled()
    expect(Group.findOne).toHaveBeenCalled()
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {
      body : { name : "group_test", memberEmails : ["test2@gmail.com", "test3@gmail.com", "test4@gmail.com"]},
      cookies: {refreshToken : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxldHRvQGdtYWlsLmNvbSIsImlkIjoiNjQ3NjA0NDI4ZmViZmQzMmM5YTcxMDlkIiwidXNlcm5hbWUiOiJsZXR0byIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1NTM4MTEzLCJleHAiOjE2ODU1MzgxNzN9.B6Ucq-E8W-KhD8MZSFIx1BOqXnbPaoiB0xleb7iEhyg"},
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    jest.spyOn(Group, "findOne").mockRejectedValue(new Error("An error occurred"));
    await createGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    
  });

});


describe("getGroups", () => { 

  test('Should return an error if it is not admin authorized', async ()=>{
    const mockReq = {}
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The user must be an Admin"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "The user must be an Admin"});
    await getGroups(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test("should return empty list if there are no groups", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(Group, "find").mockResolvedValue([]);
    await getGroups(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({"data" : [] });

  });

  test("should retrieve list of all groups", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(Group, "find").mockResolvedValue([{
        name : "group_test", members : [{
          email : "test1@gmail.com",
          } , {
          email : "test2@gmail.com"
          }]
        },{
          name : "group_test2", members : [{
            email : "test3@gmail.com",
            } , {
            email : "test4@gmail.com"
            }]
        }]);
    await getGroups(mockReq, mockRes)
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({"data" : [{name : "group_test", members : [{
      email : "test1@gmail.com",
      } , {
      email : "test2@gmail.com"
      }]},{name : "group_test2", members : [{
        email : "test3@gmail.com",
        } , {
        email : "test4@gmail.com"
        }]}]} );
    
  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

    jest.spyOn(Group, "find").mockRejectedValue(new Error("An error occurred"));
    await getGroups(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    
  });
  
});


describe("getGroup", () => { 

  test('Should return an error message if the group name in not specified', async () =>{
    const mockReq = {
      params: {name : ""}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "You have to insert the group name"
        }
    };

    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the user (regular or admin) is not authorized', async () =>{
    const mockReq = {
      params: {name : "group_test"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "Unauthorized"
        }
    };

    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "Unauthorized"});
    jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "Unauthorized"});
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the regular user is not authorized', async () =>{
    const mockReq = {
      params: {name : "group_test"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: "The email of the token doesn't match"
        }
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The email of the token doesn't match"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The user must be an Admin"});
    
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('Should return an error message if the group specified (by admin) does not exist', async() => {

      const mockReq = {
        params: {name : "NotaGroup"}
      };
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: "The group does not exist"
          }
      };

      jest.spyOn(Group, "findOne").mockResolvedValue(null);

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The email of the token doesn't match"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
      
      await getGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'The group does not exist' });
      
  });

  test("Should return information of the group where regular user (who called the func) is", async () => {
    const mockReq = {
      params: {name : "group_test"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshTokenMessage: undefined
        }
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The user must be an Admin"});
    
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({"data" : { group : {name : "group_test", members : [{
      email : "test1@gmail.com",
      } , {
      email : "test2@gmail.com"
      }]}}});

  });

  test("Should return information of the group where admin (who called the func) is", async () => {
    
    const mockReq = {
      params: {name : "group_admin"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshTokenMessage: undefined
        }
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_admin", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({"data" : { group : {name : "group_admin", members : [{
      email : "test1@gmail.com",
      } , {
      email : "test2@gmail.com"
      }]}}});
      

  });

  test("Should return information of the group specified by the admin", async () => {
    
    const mockReq = {
      params: {name : "group_"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshTokenMessage: undefined
        }
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: false, cause: "The email of the token doesn't match"});
      jest.spyOn(utils, "verifyAuth").mockReturnValueOnce({flag: true, cause: "Authorized"});
    
    await getGroup(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({"data" : { group : {name : "group_", members : [{
      email : "test1@gmail.com",
      } , {
      email : "test2@gmail.com"
      }]}}});

  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {
      params: {name : "group_admin"}
    }
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshTokenMessage: undefined
        }
    };
    
    jest.spyOn(Group, "findOne").mockRejectedValue(new Error("An error occurred"));

    await getGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    
  });

});


describe("addToGroup", () => {

  test('should return an error if it is unauthorized', async ()=>{
    const mockReq = {
      params : { name : ""},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/:name/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "You have to insert the group name"
      }
    }
    
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the user is unauthorized', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "Unauthorized"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "Unauthorized"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the admin is unauthorized', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/group_test/insert`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "Unauthorized"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "Unauthorized"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the user is not an Admin', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/group_test/insert`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The user must be an Admin"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "The user must be an Admin"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the user is not in the group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The email of the token doesn't match"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "The email of the token doesn't match"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the group does not exist (the user is an Admin)', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/group_test/insert`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The group does not exist"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if there are not members email (the user is an Admin and the group exists)', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : []},
      url: `/groups/group_test/insert`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "emails are required"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the request body is empty (the user is an Admin and the group exists)', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : {},
      url: `/groups/group_test/insert`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "emails are required"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    
    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if al least one email has the worng format', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3.gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "at least one email is not valid!"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});

  });

  test('should return an error if al least one email is empty', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "at least one email is empty!"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    await addToGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});

  });
  
  test('The group is updated. All the users are included in the group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(Group, "update").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    },
    {
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test2ID"
    },
    {
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    },
    {
      email : "test4@gmail.com",
      User : "Test4",
      _id : "Test4ID"
    }
  ]}));

    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        },
        {
          email : "test3@gmail.com"
        },
        {
          email : "test4@gmail.com"
        }
      ]},
      alreadyInGroup : [],
      membersNotFound : []
    }});
  });

  test('The group is updated. One user does not exist', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);


    jest.spyOn(Group, "update").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    },
    {
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test2ID"
    },
    {
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    }
  ]}));

    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        },
        {
          email : "test3@gmail.com"
        }
      ]},
      alreadyInGroup : [],
      membersNotFound : [
        "test4@gmail.com"
      ]
    }});
  });

  test('The group is updated. One user is already in a group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test2", members : [{
        email : "test4@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test5@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });


    jest.spyOn(Group, "update").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    },
    {
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test2ID"
    },
    {
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    }
  ]}));

    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        },
        {
          email : "test3@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test4@gmail.com"
      ],
      membersNotFound : []
    }});
  });

  test('The group is updated. One user does not exist and one is already in a group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" , "test5@gmail.com"]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test2", members : [{
        email : "test4@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test5@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

      jest.spyOn(User, "findOne").mockResolvedValueOnce(null);


    jest.spyOn(Group, "update").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    },
    {
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test2ID"
    },
    {
      email : "test3@gmail.com",
      User : "Test3",
      _id : "Test3ID"
    }
  ]}));

    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        },
        {
          email : "test3@gmail.com"
        }
      ]},
      alreadyInGroup : [
        "test4@gmail.com"
      ],
      membersNotFound : [
        "test5@gmail.com"
      ]
    }});
  });

  test('should return an error. One user does not exist and one is already in a group : no one can be added into the group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com"]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "No one can be added to this group"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});

    
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });

    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test2", members : [{
        email : "test4@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test5@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }]
      });


    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  });

  test('should return 400 if there is an error', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/add`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockRejectedValue(new Error("An error occurred"));

    await addToGroup(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

});


describe("removeFromGroup", () => { 
  test('should return an error if not contain all the necessary attributes', async ()=>{
    const mockReq = {
      params : { name : ""},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/:name/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "You have to insert the group name"
      }
    }
    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });
  
  test('should return an error if the user is unauthorized', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/test1/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "Unauthorized"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "test1", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "Unauthorized"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the admin is unauthorized', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/test1/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "Unauthorized"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "test1", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "Unauthorized"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the user is not an Admin', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/test1/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The user must be an Admin"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "test1", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "The user must be an Admin"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the user is not in the group', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/test1/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The email of the token doesn't match"
      }
    }
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "test1", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : false , cause : "The email of the token doesn't match"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if group only exists one member)', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : ["test1@gmail.com"]},
      url: `/groups/test1/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The group only exists one member"
      }
    }
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "test1", members : [{
        email : "test1@gmail.com",
        }]
      });
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    await removeFromGroup(mockReq, mockRes);
   // expect(mockReq.body.memberEmails.length).toEqual(0);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the group does not exist (Admin route)', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test1@gmail.com" , "test2@gmail.com" ]},
      url: `/groups/test1/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "The group does not exist"
      }
    }
    jest.spyOn(Group, "findOne").mockResolvedValue(null);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(Group.findOne).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if there are not members email', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : []},
      url: `/groups/group_test/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "emails are required"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(mockReq.body.emails.length).toEqual(0);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if the request body is empty', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : {},
      url: `/groups/group_test/pull`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "emails are required"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });
    
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true , cause : "Authorized"});
    
    await removeFromGroup(mockReq, mockRes);
    expect(mockReq.body).toEqual({});
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    
  });

  test('should return an error if at least one email has the wrong format', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test3.gmail.com" , "test4@gmail.com" ]},
      url: `/groups/test1/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "at least one email is not valid!"
      }
    }
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "test1", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});

  });

  test('should return an error if al least one email is empty', async ()=>{
    const mockReq = {
      params : { name : "test1"},
      body : { emails : [ "test4@gmail.com" , "" , "test5@gmail.com" ]},
      url: `/groups/test1/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message : "at least one email is empty!"
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValue({
      name : "test1", members : [{
        email : "test1@gmail.com",
        } , {
        email : "test2@gmail.com"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});

  });

  test('The group is updated. All the users are removed from the group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test2@gmail.com" , "test3@gmail.com" ]},
      url: `/groups/group_test/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test2" , email : "test2@gmail.com" , role : "Regular" });
   // jest.spyOn(Group, "findOne").mockResolvedValueOnce({ name : "group_test" });
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
    name : "group_test", members : [{
      email : "test1@gmail.com",
      user : "Test1",
      _id : "Test1ID"
      } , {
      email : "test2@gmail.com",
      user : "Test2",
      _id : "Test2ID"
      },{
        email : "test3@gmail.com",
        user : "Test3",
        _id : "Test3ID"
      }]
    });
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });
    //jest.spyOn(Group, "findOne").mockResolvedValueOnce({ name : "group_test" });
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    }
  ]}));

    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        }
      ]},
      notInGroup : [],
      membersNotFound : []
    }, refreshTokenMessage : "undefined"});
  });

  test('The group is updated. One user does not exist', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }, {
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
          }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
    jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: 'group_test', members : [{
      email : "test1@gmail.com",
      User : "Test1",
      _id : "Test1ID"
    },
    {
      email : "test2@gmail.com",
      User : "Test2",
      _id : "Test2ID"
    }
  ]}));
    await removeFromGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      group : {name : "group_test", members : [
        {
          email : "test1@gmail.com"
        },
        {
          email : "test2@gmail.com"
        }
      ]},
      notInGroup : [],
      membersNotFound : ["test4@gmail.com"]
    }, refreshTokenMessage : "undefined"});
  });

  test('The group is updated. One user is in another group', async ()=>{
    const mockReq = {
      params : { name : "group_test"},
      body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
      url: `/groups/group_test/remove`,
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage : undefined
      }
    }
    
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        }, {
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
          }]
      });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test", members : [{
        email : "test1@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "test2@gmail.com",
        user : "Test2",
        _id : "Test2ID"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
    jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "group_test2", members : [{
        email : "test4@gmail.com",
        user : "Test4",
        _id : "Test4ID"
        } , {
        email : "test5@gmail.com",
        user : "Test5",
        _id : "Test5ID"
        }]
      });
      jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: 'group_test', members : [{
        email : "test1@gmail.com",
        User : "Test1",
        _id : "Test1ID"
      },
      {
        email : "test2@gmail.com",
        User : "Test2",
        _id : "Test2ID"
      }
    ]}));
      await removeFromGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data : {
        group : {name : "group_test", members : [
          {
            email : "test1@gmail.com"
          },
          {
            email : "test2@gmail.com"
          }
        ]},
        notInGroup : ["test4@gmail.com"],
        membersNotFound : []
      }, refreshTokenMessage : "undefined"});
    });

    test('The group is updated. One user does not exist and one is in another group', async ()=>{
      const mockReq = {
        params : { name : "group_test"},
        body : { emails : [ "test3@gmail.com" , "test4@gmail.com" , "test5@gmail.com"]},
        url: `/groups/group_test/remove`,
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
      }
      
      jest.spyOn(Group, "findOne").mockResolvedValueOnce({
        name : "group_test", members : [{
          email : "test1@gmail.com",
          user : "Test1",
          _id : "Test1ID"
          } , {
          email : "test2@gmail.com",
          user : "Test2",
          _id : "Test2ID"
          }, {
            email : "test3@gmail.com",
            user : "Test3",
            _id : "Test3ID"
            }]
        });
  
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test3" , email : "test3@gmail.com" , role : "Regular" });
      jest.spyOn(Group, "findOne").mockResolvedValueOnce({
        name : "group_test", members : [{
          email : "test1@gmail.com",
          user : "Test1",
          _id : "Test1ID"
          } , {
          email : "test2@gmail.com",
          user : "Test2",
          _id : "Test2ID"
          },{
            email : "test3@gmail.com",
            user : "Test3",
            _id : "Test3ID"
          }]
        });
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });
      jest.spyOn(Group, "findOne").mockResolvedValueOnce({
        name : "group_test2", members : [{
          email : "test4@gmail.com",
          user : "Test4",
          _id : "Test4ID"
          } , {
          email : "test41@gmail.com",
          user : "Test41",
          _id : "Test41ID"
          }]
        });
        jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
        jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: 'group_test', members : [{
        email : "test1@gmail.com",
        User : "Test1",
        _id : "Test1ID"
      },
      {
        email : "test2@gmail.com",
        User : "Test2",
        _id : "Test2ID"
      }
    ]}));
      await removeFromGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ data : {
        group : {name : "group_test", members : [
          {
            email : "test1@gmail.com"
          },
          {
            email : "test2@gmail.com"
          }
        ]},
        notInGroup : ["test4@gmail.com"],
        membersNotFound : ["test5@gmail.com"]
      }, refreshTokenMessage : "undefined"});
    });

    test('should return an error. One user does not exist and one is already in another group : no one can be removed from the group', async ()=>{
      const mockReq = {
        params : { name : "group_test"},
        body : { emails : [ "test3@gmail.com" , "test4@gmail.com"]},
        url: `/groups/group_test/remove`,
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message : "No one can be removed from this group"
        }
      }
      
      jest.spyOn(Group, "findOne").mockResolvedValueOnce({
        name : "group_test", members : [{
          email : "test1@gmail.com",
          user : "Test1",
          _id : "Test1ID"
          } , {
          email : "test2@gmail.com",
          user : "Test2",
          _id : "Test2ID"
          }]
        });
  
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, cause : "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValueOnce(null);
      jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "test4" , email : "test4@gmail.com" , role : "Regular" });
      jest.spyOn(Group, "findOne").mockResolvedValueOnce({
        name : "group_test2", members : [{
          email : "test4@gmail.com",
          user : "Test41",
          _id : "Test41ID"
          }]
        });
      await removeFromGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
    });

    test('should return 400 if there is an error', async ()=>{
      const mockReq = {
        params : { name : "group_test"},
        body : { emails : [ "test3@gmail.com" , "test4@gmail.com" ]},
        url: `/groups/group_test/pull`,
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage : undefined
        }
      }
      jest.spyOn(Group, "findOne").mockRejectedValue(new Error("An error occurred"));
      await removeFromGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

});


describe("deleteUser", () => { 
  test('Should return an error if it is not admin authorized', async ()=>{
    const mockReq = {body: {email: "123@qq.com"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "Unauthorized"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({authorized: false, error: "Unauthorized"});
    await deleteUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

test('Should return an error if not contain all the necessary attributes', async () => {
  const mockReq = { body: {mail: "1234@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "you have to insert email!"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  await deleteUser(mockReq, mockRes);
  expect(mockReq.body).not.toHaveProperty("email");
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

test('Should return an error if it is an empty string', async () => {
  const mockReq = { body: {email: ""}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "you have to insert email!"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  await deleteUser(mockReq, mockRes);
  expect(mockReq.body.email.length).toEqual(0);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

test('Should return an error if invalid email format with no "@" symbol', async () => {
  const mockReq = {body: {email:"123qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          error: "invalid email format!"
      }
  };
  await deleteUser(mockReq, mockRes);
  expect(mockReq.body.email).not.toContain("@");
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  
});

test('Should return an error if invalid email format with one more "@" symbol', async () => {
  const mockReq = {body: {email:"12@345@6q@q.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          error: "invalid email format!"
      }
  };
  await deleteUser(mockReq, mockRes);
  expect(mockReq.body.email).toContain("@",3);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  
});

test('Should return an error if the user does not exist', async () => {
  const mockReq = { body: {email: "987@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          error: "The user does not exist"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValue();
  //jest.spyOn(User, "find").mockResolvedValue([]);
  await deleteUser(mockReq, mockRes);
  expect(User.findOne).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});

});

test('Should return an error if the deleted user is an admin', async () => {
  const mockReq = { body: {email: "admin@test.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          error: "The user is an admin"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValue([]);
  //jest.spyOn(User, "find").mockResolvedValue([]);
  await deleteUser(mockReq, mockRes);
  expect(User.findOne).toHaveBeenCalledWith({"email":"admin@test.com"});
  //expect(User.findOne).toHaveBeenCalledWith({"email":"123@qq.com"});
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});

});


test('Should return the successful message with the change, user not in a group', async () => {
  const mockReq = {body: {email: "123@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          message: "User has been deleted.",
          
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
  //jest.spyOn(User, "findOne").mockReturnValue(true);
 // jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
  jest.spyOn(User, "findOne").mockReturnValue(false);
  //jest.spyOn(User, "findOne").mockReturnValueOnce(false)
  jest.spyOn(transactions, "find").mockResolvedValue(
    [{_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0},
     {_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0}
  ]
    );
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0});
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0});
    //jest.spyOn(Group, "findOne").mockResolvedValueOnce(null);
    jest.spyOn(Group, "findOne").mockReturnValue(null);
    jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
    await deleteUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      message: "User has been deleted.", deletedTransactions: 2, deletedFromGroup: false
    }, refreshTokenMessage : "undefined"});
});

test('Should return the successful message with the change, user in a group', async () => {
  const mockReq = {body: {email: "123@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          message: "User has been deleted.",
          
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
  jest.spyOn(User, "findOne").mockReturnValueOnce(false);
  jest.spyOn(transactions, "find").mockResolvedValue(
    [{_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0},
     {_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0}
  ]
    );
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0});
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "testgroup", members : [{
        email : "987@gmail.com",
        user : "Test1",
        _id : "Test1ID"
        } , {
        email : "123@qq.com",
        user : "123",
        _id : "member1"
        },{
          email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
        }]
      });
      jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: "testgroup", members : [{
        email : "987@gmail.com",
        User : "Test1",
        _id : "Test1ID"
      },{
        email : "test3@gmail.com",
          user : "Test3",
          _id : "Test3ID"
      }
    ]}));
    jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
    await deleteUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      message: "User has been deleted.", deletedTransactions: 2, deletedFromGroup: true, groupDelete: false
    }, refreshTokenMessage : "undefined"});
});

test('Should return the successful message with the change, user is the only member in the group', async () => {
  const mockReq = {body: {email: "123@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          message: "User has been deleted.",
          
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
  jest.spyOn(User, "findOne").mockReturnValueOnce(false);
  jest.spyOn(transactions, "find").mockResolvedValue(
    [{_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0},
     {_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0}
  ]
    );
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test1", username: "123", type: "Category", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0});
    jest.spyOn(transactions, "deleteOne").mockResolvedValueOnce({_id: "test2", username: "123", type: "Category", amount: 10,date: "2023-05-20T21:59:15.635Z", __v: 0});
    jest.spyOn(Group, "findOne").mockResolvedValueOnce({
      name : "testgroup", members : [{
        email : "123@qq.com",
        user : "123",
        _id : "member1"
        }]
      });
      jest.spyOn(Group, "updateOne").mockImplementation(() => ({ name: "testgroup", members : []}));
      jest.spyOn(Group,"deleteOne").mockResolvedValueOnce({ name: "testgroup", members : []});
    jest.spyOn(User, "deleteOne").mockResolvedValueOnce({ username : "123" , email : "123@qq.com" , role : "Regular" });
    await deleteUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data : {
      message: "User has been deleted.", deletedTransactions: 2, deletedFromGroup: true, groupDelete: true
    }, refreshTokenMessage : "undefined"});
});

test('should return 400 if there is an error', async ()=>{
  const mockReq = {body: {email: "123@qq.com"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          message: "undefined",
          
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(User, "findOne").mockRejectedValue(new Error("An error occurred"));
  await deleteUser(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith("An error occurred");
});

});

describe("deleteGroup", () => { 
  test('Should return an error if it is not admin authorized', async ()=>{
    const mockReq = {body: {name: "family"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "Unauthorized"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, error: "Unauthorized"});
    await deleteGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

  test('Should return an error if not contain all the necessary attributes', async () => {
  const mockReq = { body: {nam: "family"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "you have to insert group name!"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  await deleteGroup(mockReq, mockRes);
  expect(mockReq.body).not.toHaveProperty("name");
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

test('Should return an error if it is an empty string', async () => {
  const mockReq = { body: {name: ""}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "you have to insert group name!"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  await deleteGroup(mockReq, mockRes);
  expect(mockReq.body.name.length).toEqual(0);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
});

test('Should return an error if the group does not exist', async () => {
  const mockReq = { body: {name: "camping"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "The group does not exist"
      }
  };

  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(Group, "findOne").mockResolvedValue();
  await deleteGroup(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});

});

test('Should return the successful message with the change', async () => {
  const mockReq = {body: {name: "family"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        message: "Group deleted successfully",
        refreshedTokenMessage: "undefined"
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, error: "Authorized"});
  jest.spyOn(Group, "findOne").mockResolvedValue([]);
  jest.spyOn(Group, "deleteOne").mockResolvedValue();
  await deleteGroup(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith({data:{message: mockRes.locals.message, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}});
});

test('should return 400 if there is an error', async ()=>{
  const mockReq = { body: {name: "camping"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(Group, "findOne").mockRejectedValue(new Error("An error occurred"));
  await deleteGroup(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith("An error occurred");
});

});