import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import { logout, registerAdmin,login , register} from '../controllers/auth';

jest.mock("bcryptjs")
jest.mock('../models/User.js');

const utils = require("../controllers/utils")

beforeEach(() => {
    User.find.mockClear();
    User.findOne.mockClear();
    User.create.mockClear();
    //additional `mockClear()` must be placed here
  });

describe('register', () => { 
    
    test('should return an error if not all fields are entered', async () => {

        const mockReq = {
          body : { username : "username" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'You have to insert username, email and password!'
          }
        };
  
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  
      });
  
      test('should return an error if at least one field is empty', async () => {
  
        const mockReq = {
          body : { username : "username" , email : "" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'Username, email and password can not be empy!'
          }
        };
  
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
  
      });
  
      test('should return an error if the email has a wrong format', async () => {
        const mockReq = {
          body : { username : "username" , email : "user.gmail.com" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'The email is not valid!'
          }
        };
  
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
      });
  
      test('should return an error if the username already exists', async () => {
        
        const mockReq = {
          body : { username : "username" , email : "user@gmail.com" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'Username and/or email are already in our database!'
          }
        };
  
        jest.spyOn(User, "findOne").mockResolvedValue({username : "username"});
  
      await register(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
        
      });
  
      test('should return an error if the email already exists', async () => {
  
        const mockReq = {
          body : { username : "username" , email : "user@gmail.com" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'Username and/or email are already in our database!'
          }
        };
  
        jest.spyOn(User, "findOne").mockResolvedValue({username : "user@gmail.com"});
  
      await register(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error : mockRes.locals.message});
      
      });
    
      test('should create a new user and return 200', async () => {
        
        const mockReq = {
          body : { username : "username" , email : "user@gmail.com" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'Username and/or email are already in our database!'
          }
        };
  
        jest.spyOn(User, "findOne").mockResolvedValue(null);
  
        jest.spyOn(bcrypt, "hash").mockResolvedValue(mockReq.body.password);
  
        jest.spyOn(User, "create").mockResolvedValue({ username : "username" , email : "user@gmail.com" , password : "hashedPassword"})
  
      await register(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
  
      });
    
      test('should return 400 if there is an error', async () => {
        
        const mockReq = {
          body : { username : "username" , email : "user@gmail.com" , password : "password"}
        }
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: 'Username and/or email are already in our database!'
          }
        };
  
        jest.spyOn(User, "findOne").mockRejectedValue(new Error("An error occurred"));
  
      await register(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(400);
        
      });
    
});

describe("registerAdmin", () => { 
  test('Should return an error if at least one empty string', async () => {
      const mockReq = {body: {username: "XYL", password:"", email:"123@qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "you have to insert username, email and password!"
          }
      };
      await registerAdmin(mockReq, mockRes);
      expect(mockReq.body.password.length).toEqual(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
      
    });

    test('Should return an error if not contain all the necessary attributes', async () => {
      const mockReq = {body: {name: "XYL", password:"136", email:"123@qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "you have to insert username, email and password!"
          }
      };
      await registerAdmin(mockReq, mockRes);
      expect(mockReq.body).not.toHaveProperty("username");
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
      
    });

    test('Should return an error if invalid email format with no "@" symbol', async () => {
      const mockReq = {body: {username: "XYL", password:"123", email:"123qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "invalid email format!"
          }
      };
      await registerAdmin(mockReq, mockRes);
      expect(mockReq.body.email).not.toContain("@");
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
      
    });

    test('Should return an error if invalid email format with one more "@" symbol', async () => {
      const mockReq = {body: {username: "XYL", password:"123", email:"12@345@6q@q.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "invalid email format!"
          }
      };
      await registerAdmin(mockReq, mockRes);
      expect(mockReq.body.email).toContain("@",3);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
      
    });

    test('Should return an error if the email exists', async () => {
      const mockReq = {body: {username: "XYL", password:"123", email:"123@qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "you are already registered"
          }
      };
      jest.spyOn(User, "findOne").mockResolvedValue([]);
      await registerAdmin(mockReq, mockRes);
      expect(User.findOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    });

    test('Should return an error if the username exists', async () => {
      const mockReq = {body: {username: "Xiong", password:"123", email:"abca@qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "you are already registered"
          }
      };
      jest.spyOn(User, "findOne").mockResolvedValue([]);
      await registerAdmin(mockReq, mockRes);
      expect(User.findOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    });

    test('Should return the successful message with register', async () => {
      const mockReq = {body: {username: "XYL", password:"123", email:"12345678@qq.com"}};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              message: "admin added succesfully"
          }
      };
      jest.spyOn(bcrypt, "hash").mockResolvedValue(mockReq.body.password);
      jest.spyOn(User, "findOne").mockResolvedValue();
      jest.spyOn(User, "create").mockResolvedValue();
      await registerAdmin(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({data:{message: mockRes.locals.message}});
     // expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message});
    });

    test('should return 400 if there is an error', async () => {
      
      const mockReq = {
        body : { username : "username" , email : "user@gmail.com" , password : "password"}
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            message: 'Username and/or email are already in our database!'
        }
      };
      jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("An error occurred"));
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    });

});

describe('login', () => { 
  test('Should return an error if not contain all the necessary attributes', async () => {
    const mockReq = {body: {email:"123@qq.com", pass:""}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "you have to insert email and password!"
        }
    };
    await login(mockReq, mockRes);
    expect(mockReq.body).not.toHaveProperty("password");
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    
  });

test('Should return an error if at least one empty string', async () => {
    const mockReq = {body: {email:"123@qq.com", password:""}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
           error: "you have to insert email and password!"
        }
    };
    await login(mockReq, mockRes);
    expect(mockReq.body.password.length).toEqual(0);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    
  });

  test('Should return an error if invalid email format with no "@" symbol', async () => {
    const mockReq = {body: {email:"123qq.com", password:"abc"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "invalid email format!"
        }
    };
    await login(mockReq, mockRes);
    expect(mockReq.body.email).not.toContain("@");
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    
  });

  test('Should return an error if invalid email format with one more "@" symbol', async () => {
    const mockReq = {body: {email:"12@3@69@2@8qq.com", password:"abc"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "invalid email format!"
        }
    };
    await login(mockReq, mockRes);
    expect(mockReq.body.email).toContain("@",4);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
    
  });

  test('Should return an error if the email not exists', async () => {
    const mockReq = {body: {email:"testnot@qq.com", password:"abcde"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "please you need to register"
        }
    };
    jest.spyOn(User, "findOne").mockResolvedValue();
    await login(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  });

  test('Should return an error if the supplied password does not match', async () => {
    const mockReq = {body: {email:"457370806@qq.com", password:"password"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "wrong credentials"
        }
    };
    jest.spyOn(User, "findOne").mockResolvedValue([]);
    jest.spyOn(bcrypt, "compare").mockResolvedValue();
    await login(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  });

  test('Should return successful message', async () => {
    const mockReq = {body: {email:"457370806@qq.com", password:"password"}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockImplementation(),
        locals: {
        }
    };
    jest.spyOn(User, "findOne").mockResolvedValue({save: jest.fn().mockImplementation()});
    jest.spyOn(bcrypt, "compare").mockReturnValue(true);
    jest.spyOn(jwt, "sign").mockReturnValue({accessToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3Q1QHFxLmNvbSIsImlkIjoiNjQ3OWFmN2IyODJjYzg2ZmU3YzRjODQ0IiwidXNlcm5hbWUiOiJ0ZXN0NSIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODIyNTk2LCJleHAiOjE2ODU4MjYxOTZ9.gjmbtlzvLZcwa3W4QToiKVuyCfUoMezc-to4XDouIGM"});
    jest.spyOn(jwt, "sign").mockReturnValue({refreshToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3Q1QHFxLmNvbSIsImlkIjoiNjQ3OWFmN2IyODJjYzg2ZmU3YzRjODQ0IiwidXNlcm5hbWUiOiJ0ZXN0NSIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1ODIyNTk2LCJleHAiOjE2ODY0MjczOTZ9.D4s79xsXaJ_MeV9b9HG35oXRGllpX16OydHYZLsG2_A"});
    await login(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  
  });

  test('should return 400 if there is an error', async () => {
        
    const mockReq = {
      body : { username : "username" , email : "user@gmail.com" , password : "password"}
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockImplementation(),
      locals: {
      }
    };
    jest.spyOn(User, "findOne").mockResolvedValue({ username : "test1" , email : "test1@gmail.com" , role : "Regular", refreshToken : "", save: jest.fn().mockRejectedValue("An error occurred")});
  await login(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith("An error occurred");
  });

});

describe('logout', () => { 
  test('Should return an error if it has logged out', async ()=>{
      const mockReq = {
          cookies: {
              refreshToken: null
            }
      };
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "user has logged out"
          }
      };
  
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      await logout(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  });

  test('Should return successful message', async ()=>{
    const mockReq = {
        cookies: {
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjEyM0BxcS5jb20iLCJpZCI6IjY0NmM3Y2NhOWNjMjQzOGExZjBhNjFjYiIsInVzZXJuYW1lIjoiYWJjIiwicm9sZSI6IlJlZ3VsYXIiLCJpYXQiOjE2ODU2MzM0MTksImV4cCI6MTY4NjIzODIxOX0.ijdVQhBGAFxbpCGuNYO89yrR3Iifv6BKsFUN9z9nj61'
          }
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn().mockImplementation(()=> null),
        locals: {
            message: "User logged out"
        }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
    jest.spyOn(User, "findOne").mockResolvedValue({ username : "test1" , email : "test1@gmail.com" , role : "Regular", refreshToken : "", save: jest.fn().mockReturnValue()});
    await logout(mockReq, mockRes);
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({data:{message: mockRes.locals.message}});
});

  test('Should return an error if refresh token does not match', async ()=>{
      const mockReq = {
          cookies: {
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjEyM0BxcS5jb20iLCJpZCI6IjY0NmM3Y2NhOWNjMjQzOGExZjBhNjFjYiIsInVzZXJuYW1lIjoiYWJjIiwicm9sZSI6IlJlZ3VsYXIiLCJpYXQiOjE2ODU2MzM0MTksImV4cCI6MTY4NjIzODIxOX0.ijdVQhBGAFxbpCGuNYO89yrR3Iifv6BKsFUN9z9nj61'
            }
      };
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              error: "user not found",
          }
      };
  
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue();
      await logout(mockReq, mockRes);
      expect(User.findOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  });
  
  test('should return 400 if there is an error', async ()=>{
    const mockReq = {
      cookies: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjEyM0BxcS5jb20iLCJpZCI6IjY0NmM3Y2NhOWNjMjQzOGExZjBhNjFjYiIsInVzZXJuYW1lIjoiYWJjIiwicm9sZSI6IlJlZ3VsYXIiLCJpYXQiOjE2ODU2MzM0MTksImV4cCI6MTY4NjIzODIxOX0.ijdVQhBGAFxbpCGuNYO89yrR3Iifv6BKsFUN9z9nj61'
        }
  };
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockImplementation(()=> null),
      locals: {
      }
  };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
   jest.spyOn(User, "findOne").mockResolvedValue({ username : "test1" , email : "test1@gmail.com" , role : "Regular", refreshToken : "", save: jest.fn().mockRejectedValue("An error occurred")});
    await logout(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith("An error occurred");
  });

});
