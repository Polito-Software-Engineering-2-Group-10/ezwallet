import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import {User, Group} from '../models/User';
import { createCategory, deleteCategory, getCategories, updateCategory, createTransaction, getTransactionsByUser, getTransactionsByUserByCategory, getTransactionsByGroup, getTransactionsByGroupByCategory, deleteTransaction,deleteTransactions, getAllTransactions } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';
import mongoose, { Mongoose, mongo } from 'mongoose';

jest.mock('../models/model');
jest.mock('../models/User');
jest.mock('../controllers/utils');

const utils = require("../controllers/utils")
const jwt = require('jsonwebtoken')

beforeEach(() => {
  categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.findOne.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.prototype.save.mockClear();
  utils.verifyAuth.mockClear();
  User.findOne.mockClear();
});

describe("createCategory", () => { 
    test('Should return an error because it is not authorized', () => {
        const mockReq = { body : { type : "investment", color: "#0000ff" } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };
        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, message: "Unauthorized"});
        createCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message})
        

    });

    test('Should return an error because the category already exists', async() => {
        const mockReq = { body: { type : "investment", color: "#0000ff" } }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "The category already exists"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories,"findOne").mockReturnValue(mockReq.body);
        await createCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({message : mockRes.locals.message});
    });

    test('Should return an error because one element is missing', async () => {
      const mockReq = { body : {type : "investment" } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "You must insert both type and color"
        }
      }
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      await createCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockRes.locals.message })
    });

    test('Should return an error because one element is an empty string', async () => {
      const mockReq = { body : {type : "investment", color: "" } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "Type and color must not be empty strings"
        }
      }
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      await createCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockRes.locals.message })
    });

    test('Should return that object that has received', async () => {
        const mockReq = { body: { type : "investment", color: "#0000ff" } }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Category added succesfully"
            }
        };
        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories,"findOne").mockReturnValue()
        jest.spyOn(categories, "find").mockReturnValue({ type : "investment", color: "#0000ff" });
        await createCategory(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith({ data: mockReq.body })

    })

    test('Should retrieve an error in case of error of a DB function', async () => {
      const mockReq = { body: { type : "investment", color: "#0000ff" } }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Category added succesfully"
            }
        };
        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "findOne").mockImplementationOnce(()=>{throw {message: "A typical error"}});
        await createCategory(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({error: "A typical error"})
    })
})

describe("updateCategory", () => { 
    test('Should return an error because it is not authorized', async ()=>{
        const mockReq = { params: {type : "prova"} , 
                          body: {type: "Giuseppe", color: "#0000ff"},
                        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, message: "Unauthorized"});
        await updateCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message})

    });

    test('Should return an error because the category does not exist', async () => {
        const mockReq = { params: {type : "prova"} , 
                          body: {type: "Giuseppe", color: "#0000ff"},
                        };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "This category does not exist"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories,"findOne").mockResolvedValue();
        await updateCategory(mockReq, mockRes);
        expect(categories.findOne).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message});
        
    });

    test('Should return an error because one element is missing', async () => {
      const mockReq = { params: {type : "market"}, body : {type : "investment" } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "You must insert both type and color"
        }
      }
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockRes.locals.message })
    });

    test('Should return an error because one element is an empty string', async () => {
      const mockReq = { params: {type : "market"}, body : {type : "investment", color: "" } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "Type and color must not be empty strings"
        }
      }
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockRes.locals.message })
    });

    test('Should give an error because the category passed as parameter is already present in the database', async () => {
      const mockReq = { params: {type : "market"}, body : { type : "investment", color : "#0000ff" } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "The category in which you want to update is already present!!!"
            }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag : true, message : "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue([]);
      jest.spyOn(categories, "find").mockResolvedValue([mockReq.body]);
      await updateCategory(mockReq,mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({message : mockRes.locals.message})

    })

    test('Should return a message of complete and the number of changes', async () => {
        const mockReq = { params: {type : "market"} , body: {type: "investment", color: "#0000ff"}}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Category edited successfully"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories,"findOne").mockResolvedValue([]);
        jest.spyOn(categories,"find").mockResolvedValue([]);
        jest.spyOn(categories,"findOneAndReplace").mockResolvedValue([]);
        jest.spyOn(transactions,"updateMany").mockResolvedValue({modifiedCount: 2});
        await updateCategory(mockReq, mockRes);
        expect(categories.findOne).toHaveBeenCalled();
        expect(categories.findOneAndReplace).toHaveBeenCalled();
        expect(transactions.updateMany).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data : { message: mockRes.locals.message, count : 2 } });

    })

    test('Should retrieve an error in case of error of a DB function', async () => {
      const mockReq = { params: {type : "market"} , body: {type: "investment", color: "#0000ff"}}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Category edited successfully"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories,"findOne").mockResolvedValue([]);
        jest.spyOn(categories,"find").mockResolvedValue([]);
        jest.spyOn(categories,"findOneAndReplace").mockResolvedValue([]);
        jest.spyOn(transactions,"updateMany").mockImplementationOnce(() => {throw {message: "A typical error"}});
        await updateCategory(mockReq, mockRes);
        expect(categories.findOne).toHaveBeenCalled();
        expect(categories.findOneAndReplace).toHaveBeenCalled();
        expect(transactions.updateMany).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "A typical error" });
    })

})

describe("deleteCategory", () => { 
    test('Should return an error because it is not authorized', async ()=>{
        const mockReq = { };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, message: "Unauthorized"});
        await deleteCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message});

    });

    test('Should return an error because there is no array in the request', async () => {
      const mockReq = { body: {} };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "The request must contain an array"
            }
        };
        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        await deleteCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message});
    })

    test('Should return an error because in the DB there is only one category', async () => {
      const mockReq = { body: {types: ["investment", "market", "holydays"] } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "In the DB there is only one category, you cannot delete it"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "count").mockResolvedValue(1);
        await deleteCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message})

    })

    test('Should return an error because the category does not exist', async () => {
        const mockReq = { body: {types: ["investment", "market", "holydays"] } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "This category does not exist"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "find").mockResolvedValue([]);
        jest.spyOn(categories, "count").mockReturnValue(2);
        await deleteCategory(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message})

    });

    test('Should return an error because one type is an empty string', async () => {
      const mockReq = { body : { types: ["investment", "market", ""] } }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          message: "The types inserted must not be empty strings"
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
      jest.spyOn(categories, "find").mockResolvedValue([{type: "investment", color: "#0000ff"}]);
      jest.spyOn(categories,"count").mockResolvedValue(2);
      await deleteCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({message : mockRes.locals.message })

    })

    test('Should return the message with the changes', async () => {
        const mockReq = { body: {types: ["investment", "market", "holydays"] } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Categories deleted"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "count").mockResolvedValue(2);
        jest.spyOn(categories, "find").mockResolvedValue([{type: "investment", color: "#0000ff"}]);
        jest.spyOn(categories, "findOne").mockResolvedValue({
            _id: "6464d0dc8c93a97f7b4a8f7c",
            username: 'Pala',
            type: 'investment',
            amount: 200,
            date: "2023-05-17T13:04:28.162Z",
            __v: 0
        });
        jest.spyOn(transactions,"updateMany").mockResolvedValue({modifiedCount: 2});
        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith( { data : { message: mockRes.locals.message, count: 4 }  });
    })

    test('Should retrieve an error in case of error of a DB function', async () => {
      const mockReq = { body: {types: ["investment", "market", "holydays"] } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Categories deleted"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "count").mockResolvedValue(2);
        jest.spyOn(categories, "find").mockResolvedValue([{type: "investment", color: "#0000ff"}]);
        jest.spyOn(categories, "findOne").mockResolvedValue({
            _id: "6464d0dc8c93a97f7b4a8f7c",
            username: 'Pala',
            type: 'investment',
            amount: 200,
            date: "2023-05-17T13:04:28.162Z",
            __v: 0
        });
        jest.spyOn(transactions,"updateMany").mockImplementationOnce(() => { throw {message: "A typical error" }});
        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith( { error : "A typical error" });
    })

    test('Should return with all changes but there is more categories in the DB', async() => {
      const mockReq = { body: {types: ["investment"] } };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Categories deleted"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
        jest.spyOn(categories, "count").mockResolvedValueOnce(2).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
        jest.spyOn(categories, "find").mockResolvedValue([{type: "investment", color: "#0000ff"}]);
        jest.spyOn(categories, "findOne").mockResolvedValue({
            _id: "6464d0dc8c93a97f7b4a8f7c",
            username: 'Pala',
            type: 'investment',
            amount: 200,
            date: "2023-05-17T13:04:28.162Z",
            __v: 0
        });
        jest.spyOn(transactions,"updateMany").mockResolvedValue({modifiedCount: 2});
        await deleteCategory(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith( { data : { message: mockRes.locals.message, count: 2 }  });
    })
})

describe("getCategories", () => { 
    test('Should retrieve an error because it is not authorized', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };

        jest.spyOn(utils, "verifyAuth").mockResolvedValue({ flag: false, message: "Unauthorized" })
        await getCategories(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({message: mockRes.locals.message})
    });

    test('Should retrieve an empty array because there are no categories', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };

        jest.spyOn(utils,"verifyAuth").mockReturnValue({ flag: true, message: "Authorized" });
        jest.spyOn(categories, "find").mockReturnValue([]);
        await getCategories(mockReq,mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data: []});
    });

    test('Should retrieve the list of all categories', async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };
        const retrievedCategories = [{type: "investment", color: "#0000ff"}, {type: "market", color: "#ff0000"}, {type: "family", color: "yellow"}];
        jest.spyOn(utils,"verifyAuth").mockReturnValue({ flag: true, message: "Authorized" });
        jest.spyOn(categories, "find").mockReturnValue([{type: "investment", color: "#0000ff"}, {type: "market", color: "#ff0000"}, {type: "family", color: "yellow"}]);
        await getCategories(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({data: retrievedCategories});
    })

    test('Should retrieve an error in case of error of save', async () => {
      const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                message: "Unauthorized"
            }
        };
        
        jest.spyOn(utils,"verifyAuth").mockReturnValue({ flag: true, message: "Authorized" });
        jest.spyOn(categories, "find").mockImplementationOnce(()=>{ throw {message : "A typical error "}});
        await getCategories(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({error: "A typical error "})
    })
});

describe("createTransaction", () => { 
    test('It should return the correct inserted transaction (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}])
      jest.spyOn(transactions.prototype, "save").mockResolvedValue({
        username: 'RealRegularUser',
        type: 'RealCategory',
        amount: 17,
        _id: "6477abd4c30857bfc642369f",
        date: "2023-05-31T20:19:32.625Z",
        __v: 0
      })

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory",
          date: "2023-05-31T20:19:32.625Z"
        }
      });
      

    });

    test('It should return a 400 error if the request body does not contain the username (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain the amount (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain the type (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain the username and the amount (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain the username and the type (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          amount: 17
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain the amount and the type (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if the request body does not contain any information (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You should provide username, amount and type values"});
    
    });

    test('It should return a 400 error if username in the request body is an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if amount in the request body is an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: "",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if type in the request body is an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: ""
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if username and amount in the request body are an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "",
          amount: "",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if username and type in the request body are an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "",
          amount: 17,
          type: ""
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if amount and type in the request body are an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: "",
          type: ""
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if amount, type and username in the request body are an empty string (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "",
          amount: "",
          type: ""
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Username, amount and type values cannot be the empty string"});
    
    });

    test('It should return a 400 error if the type of category passed in the request body does not represent a category in the database (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "FakeCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue(null);

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Category not found"});
      

    });

    test('It should return a 400 error if the username passed in the request body is not equal to the one passed as a route parameter (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "DifferentUser"},
        url: "/users/DifferentUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}])

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Usernames in the URL and in the body don't match"});
      

    });

    test('It should return a 400 error if the username passed in the request body does not represent a user in the database (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "FakeUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue(null)

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "User of the body not found"});
      
    });

    test('It should return a 400 error if the username passed as a route parameter does not represent a user in the database (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "FakeUser"},
        url: "/users/FakeUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValueOnce([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}]).mockResolvedValueOnce(null);

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "User of the URL not found"});
      

    });

    test('1 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: "0045",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}])

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The amount is not a valid float number (negative number are accepted)"});
      

    });

    test('2 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: "abc",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}])

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The amount is not a valid float number (negative number are accepted)"});
      

    });

    test('3 - It should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted) (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: "4.5.6",
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockResolvedValue({type: "RealCategory", color: "#aabbcc"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Njg5YWVhMTEzODQ5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.QtXh_ses4H7dkNvTTtVCTHFBch1_gvsXSEgdRsdzHgg", Role: "Regular"}])

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The amount is not a valid float number (negative number are accepted)"});
      

    });

    test('It should return a 401 error if a user is not authorized (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(0);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});
    });

    test('It should return an error if one of the functions line findOne throws an error (called by a regular User)', async() => {
      const mockReq = {
        params: {username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          username: "RealRegularUser",
          amount: 17,
          type: "RealCategory"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(categories, "findOne").mockImplementation(() => {throw new Error("Generic error in DB")});

      await createTransaction(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledTimes(0);
      expect(categories.findOne).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});
    
    });

})

describe("getAllTransactions", () => { 
  test("Should return an error if the admin who calls the function is not authorized (called by an Admin)", async () => {
    const mockReq = {
      url: "/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: undefined
      }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: false, cause: "Unauthorized" });
    

    await getAllTransactions(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});
  });

  test("Should return all transactions present in the DB (called by an Admin)", async () => {
    const mockReq = {
      url: "/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: undefined
      }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
    jest.spyOn(transactions, "aggregate").mockResolvedValue([
      {
        _id: "6465d3eb14c15b9727257f27",
        username: 'User1',
        type: 'category1',
        amount: 50,
        date: "2023-05-18T07:29:47.495Z",
        __v: 0,
        categories_info: {
          _id: "6465cfb8a71b4885ca381f6e",
          type: 'category1',
          color: '#aabbcc',
          __v: 0
        }
      },
      {
        _id: "6465d3f014c15b9727257f29",
        username: 'User1',
        type: 'category2',
        amount: 10,
        date: "2023-05-18T07:29:52.819Z",
        __v: 0,
        categories_info: {
          _id: "6465cfb8a71b4885ca381f6e",
          type: 'category2',
          color: '#ccbbaa',
          __v: 0
        }
      },
      {
        _id: "6475b2f15df42d143e61b144",
        username: 'User2',
        type: 'category3',
        amount: 48,
        date: "2023-05-30T08:25:21.949Z",
        __v: 0,
        categories_info: {
          _id: "6465cfb8a71b4885ca381f6e",
          type: 'category3',
          color: '#bbccaa',
          __v: 0
        }
      }
    ]);
    

    await getAllTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: [
          {
              username: "User1",
              amount: 50,
              type: "category1",
              color: "#aabbcc",
              date: "2023-05-18T07:29:47.495Z"
          },
          {
              username: "User1",
              amount: 10,
              type: "category2",
              color: "#ccbbaa",
              date: "2023-05-18T07:29:52.819Z"
          },
          {
              username: "User2",
              amount: 48,
              type: "category3",
              color: "#bbccaa",
              date: "2023-05-30T08:25:21.949Z"
          }
      ]
  });
  });

  test("Should return an error if some function like aggregate throws an error (called by an Admin)", async () => {
    const mockReq = {
      url: "/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: undefined
      }
    };

    jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
    jest.spyOn(transactions, "aggregate").mockImplementation(() => {throw new Error("Generic error in DB")});
    

    await getAllTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});
  });
})

describe("getTransactionsByUser", () => { 
    test('Should return an error if handleDateFilterParams and handleAmountFilterParams throw an error', async() => {
      const mockReq = {params: {username : "FakeUser"}};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
              refreshTokenMessage: undefined
            }
        };

        jest.spyOn(utils, "handleDateFilterParams").mockImplementation(()=>{throw Error()})
        jest.spyOn(utils, "handleAmountFilterParams").mockImplementation(()=>{throw Error()})
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    })
    test('Should return an error message if the username specified does not exist', async() => {

        const mockReq = {params: {username : "FakeUser"}};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
              refreshTokenMessage: undefined
            }
        };

        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
        jest.spyOn(User, "findOne").mockResolvedValue(null);
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
        
    });

    test("Should return an array of transaction objects (called by an Admin)", async () => {
      const mockReq = {
        params: { username: "RealAdminUser" },
        url: "/api/transactions/users/RealAdminUser",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshTokenMessage: undefined
        }
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealAdminUser",
            type: "cinema",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealAdminUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealAdminUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealAdminUser",
              amount: 4.99,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealAdminUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealAdminUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an empty array if no transactions are found (called by an Admin)", async () => {
        const mockReq = {
          params: { username: "RealAdminUser" },
          url: "/api/transactions/users/RealAdminUser",
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
        };
  
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({});
        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({});
        jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
        jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
  
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
  
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: []
        });
    });

    test("Should return an array of transaction objects (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser" },
        url: "/api/users/RealRegularUser/transactions",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 4.99,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an empty array if no transactions are found (called by a Regular User)", async () => {
        const mockReq = {
          params: { username: "RealRegularUser" },
          url: "/api/users/RealRegularUser/transactions",
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
        };
  
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
        jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
        jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
  
        jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
  
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: []
        });
    });

    test("Should return an array of transaction objects filtered by date from (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", from: "2023-05-15" },
        url: "/api/users/RealRegularUser/transactions?from=2023-05-15",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({ date: { $gte: new Date(mockReq.params.from)} })
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 4.99,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an array of transaction objects filtered by date to (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", upTo: "2023-05-20" },
        url: "/api/users/RealRegularUser/transactions?upTo=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({ date: { $lte: new Date(mockReq.params.upTo)} })
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 4.99,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an array of transaction objects filtered by date from to (called by a Regular user)", async () => {
        const mockReq = {
          params: { username: "RealRegularUser", from: "2023-05-15", upTo: "2023-05-20" },
          url: "/api/users/RealRegularUser/transactions?from=2023-05-15&upTo=2023-05-20",
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined
          },
        };
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({ date: { $gte: new Date(mockReq.params.from), $lte: new Date(mockReq.params.upTo)} })
        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
        jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
        jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
  
        jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
          const result = [
            {
              _id: "1234567890",
              username: "RealRegularUser",
              type: "cinema",
              amount: 4.99,
              date: "2023-05-18T07:29:16.434Z",
              __v: 0,
              transactions_info: {
                _id: "2345678901",
                type: "cinema",
                color: "#554433",
                __v: 0,
              },
            },
            {
              _id: "3456789012",
              username: "RealRegularUser",
              type: "gym",
              amount: 20,
              date: "2023-05-18T07:29:29.635Z",
              __v: 0,
              transactions_info: {
                _id: "4567890123",
                type: "gym",
                color: "#ed228a",
                __v: 0,
              },
            },
            {
              _id: "5678901234",
              username: "RealRegularUser",
              type: "gym",
              amount: 20,
              date: "2023-05-18T07:29:32.909Z",
              __v: 0,
              transactions_info: {
                _id: "6789012345",
                type: "gym",
                color: "#ed228a",
                __v: 0,
              },
            },
          ];
          return Promise.resolve(result);
        });
  
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: [
              {
                username: "RealRegularUser",
                amount: 4.99,
                type: "cinema",
                color: "#554433",
                date: "2023-05-18T07:29:16.434Z",
              },
              {
                username: "RealRegularUser",
                amount: 20,
                type: "gym",
                color: "#ed228a",
                date: "2023-05-18T07:29:29.635Z",
              },
              {
                username: "RealRegularUser",
                amount: 20,
                type: "gym",
                color: "#ed228a",
                date: "2023-05-18T07:29:32.909Z",
              },
            ]
        });
    });

    test("Should return an array of transaction objects filtered by date (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({ date: { $gte: new Date(mockReq.params.date), $lte: new Date(mockReq.params.date + "T23:59:59.999Z")} })
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 4.99,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an array of transaction objects filtered by amount min (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", amountMin: 10 },
        url: "/api/users/RealRegularUser/transactions?amountMin=10",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({amount:{$gte: parseInt(mockReq.params.amountMin)}})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 10,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 40,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 10,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 40,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an array of transaction objects filtered by amount max (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", amountMax: 50 },
        url: "/api/users/RealRegularUser/transactions?amountMax=50",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({amount:{$lte: parseInt(mockReq.params.amountMax)}})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 10,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 40,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 10,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 40,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an array of transaction objects filtered by amount min max (called by a Regular user)", async () => {
        const mockReq = {
          params: { username: "RealRegularUser", amountMin: 10, amountMax: 50 },
          url: "/api/users/RealRegularUser/transactions?amountMin=10&amountMax=50",
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: undefined,
          },
        };
  
        jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
        jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({amount:{$gte: parseInt(mockReq.params.amountMin), $lte: parseInt(mockReq.params.amountMax)}})
        jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
        jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
  
        jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
          const result = [
            {
              _id: "1234567890",
              username: "RealRegularUser",
              type: "cinema",
              amount: 10,
              date: "2023-05-18T07:29:16.434Z",
              __v: 0,
              transactions_info: {
                _id: "2345678901",
                type: "cinema",
                color: "#554433",
                __v: 0,
              },
            },
            {
              _id: "3456789012",
              username: "RealRegularUser",
              type: "gym",
              amount: 20,
              date: "2023-05-18T07:29:29.635Z",
              __v: 0,
              transactions_info: {
                _id: "4567890123",
                type: "gym",
                color: "#ed228a",
                __v: 0,
              },
            },
            {
              _id: "5678901234",
              username: "RealRegularUser",
              type: "gym",
              amount: 40,
              date: "2023-05-18T07:29:32.909Z",
              __v: 0,
              transactions_info: {
                _id: "6789012345",
                type: "gym",
                color: "#ed228a",
                __v: 0,
              },
            },
          ];
          return Promise.resolve(result);
        });
  
        await getTransactionsByUser(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: [
              {
                username: "RealRegularUser",
                amount: 10,
                type: "cinema",
                color: "#554433",
                date: "2023-05-18T07:29:16.434Z",
              },
              {
                username: "RealRegularUser",
                amount: 20,
                type: "gym",
                color: "#ed228a",
                date: "2023-05-18T07:29:29.635Z",
              },
              {
                username: "RealRegularUser",
                amount: 40,
                type: "gym",
                color: "#ed228a",
                date: "2023-05-18T07:29:32.909Z",
              },
            ]
        });
    });

    test("Should return an array of transaction objects filtered by amount min and date (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", amountMin: 10, date: "2023-05-18" },
        url: "/api/users/RealRegularUser/transactions?amountMin=10&date=2023-05-18",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({ date: { $gte: new Date(mockReq.params.date), $lte: new Date(mockReq.params.date + "T23:59:59.999Z")} })
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({amount:{$gte: parseInt(mockReq.params.amountMin)}})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "cinema",
            amount: 10,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "cinema",
              color: "#554433",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "gym",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "gym",
            amount: 40,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "gym",
              color: "#ed228a",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 10,
              type: "cinema",
              color: "#554433",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 40,
              type: "gym",
              color: "#ed228a",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });
    
    test("Should return an error if objects filtered by date and from params (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18", from:"2023-05-15" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20&from=2023-05-15",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(utils, "handleDateFilterParams").mockImplementation((req) => { throw new Error("It includes only one parameter of from and upTo with date")});
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "It includes only one parameter of from and upTo with date"
      });
    });

    test("Should return an error if objects filtered by date and upTo params (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18", upTo:"2023-05-20" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20&upTo=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(utils, "handleDateFilterParams").mockImplementation((req) => { throw new Error("It includes only one parameter of from and upTo with date")});
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "It includes only one parameter of from and upTo with date"
      });
    });

    test("Should return an error if objects filtered by date, from and upTo params (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18", from:"2023-05-15", upTo:"2023-05-20" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20&from=2023-05-15&upTo=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(utils, "handleDateFilterParams").mockImplementation((req) => { throw new Error("It includes only one parameter of from and upTo with date")});
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "It includes only one parameter of from and upTo with date"
      });
    });

    test("Should return an error if objects filtered by date, where date is not in a correct format (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "not-correct-format"},
        url: "/api/users/RealRegularUser/transactions?date=not-correct-format",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(utils, "handleDateFilterParams").mockImplementation((req) => { throw new Error("The date parameter is not in a correct format")});
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "The date parameter is not in a correct format"
      });
    });

    test("Should return an error if objects filtered by amount, where amount is not a float number (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", amountMin: "not-correct-format"},
        url: "/api/users/RealRegularUser/transactions?date=not-correct-format",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockImplementation((req) => { throw new Error("The amount parameter is not float number")});

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "The amount parameter is not float number"
      });
    });

    test("Should return an error if the aggregate function throws an error of transaction objects filtered by date (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        throw new Error("Generic error in DB")
      });

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Generic error in DB"
      });
    });

    test("Should return an error the Regular user is not authorized (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", date: "2023-05-18" },
        url: "/api/users/RealRegularUser/transactions?date=2023-05-20",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: false, cause: "Unauthorized" });

      jest.spyOn(transactions, "aggregate").mockResolvedValue({});

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized"
      });
    });

    test("Should return an error the Admin user is not authorized (called by a admin user)", async () => {
      const mockReq = {
        params: { username: "RealAdminUser" },
        url: "/api/transactions/users/RealRegularUser",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(utils, "handleDateFilterParams").mockReturnValue({})
      jest.spyOn(utils, "handleAmountFilterParams").mockReturnValue({})
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: false, cause: "Unauthorized" });

      jest.spyOn(transactions, "aggregate").mockResolvedValue({});

      await getTransactionsByUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Unauthorized"
      });
    });
    
})

describe("getTransactionsByUserByCategory", () => {
  
    test('Should return an error message if the username specified does not exist', async() => {

    const mockReq = {params: {username : "FakeUser", category: "RealCategory"}, url: "/transactions/users/FakeUser/category/RealCategory"};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshedTokenMessage: undefined
        }
    };

    jest.spyOn(User, "findOne").mockResolvedValue(null);
    jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
    await getTransactionsByUserByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
    
    });

    test('Should return an error message if the category specified does not exist', async() => {

      const mockReq = {params: {username : "RealAdminUser", category: "FakeCategory"}, url: "/transactions/users/RealAdminUser/category/FakeCategory"};
      const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshedTokenMessage: undefined
          }
      };
  
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
      jest.spyOn(categories, "findOne").mockReturnValue(null);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"})
      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Category not found' });
      
    });

    test("Should return an empty array if no transaction is found with this category and username (called by an Admin)", async () => {
      const mockReq = {
        params: { username: "RealAdminUser", category: "RealCategory" },
        url: "/transactions/users/RealAdminUser/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
      jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
      jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({data: []});
    });

    test("Should return an empty array if no transaction is found with this category and username (called by a Regular user)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", category: "RealCategory" },
        url: "/users/RealRegularUser/transactions/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
      jest.spyOn(transactions, "aggregate").mockResolvedValue([]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({data: []});
    });

    test("Should return an array of transactions of a specific user with a specific category (called by an Admin)", async () => {
      const mockReq = {
        params: { username: "RealAdminUser", category: "RealCategory" },
        url: "/transactions/users/RealRegularUser/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest
        .spyOn(categories, "findOne")
        .mockResolvedValue([{ type: "RealCategory", color: "#aabbcc" }]);
      jest
        .spyOn(utils, "verifyAuth")
        .mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
          {
            username: "RealRegularUser",
            amount: 4.99,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:16.434Z",
          },
          {
            username: "RealRegularUser",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:29.635Z",
          },
          {
            username: "RealRegularUser",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:32.909Z",
          },
        ],
      });
    });

    test("Should return an array of transactions of a specific user with a specific category (called by a Regular User)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", category: "RealCategory" },
        url: "/users/RealRegularUser/transactions/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(categories, "findOne").mockResolvedValue([{ type: "RealCategory", color: "#aabbcc" }]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "RealRegularUser",
            type: "RealCategory",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "RealCategory",
              color: "#aabbcc",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      
      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "RealRegularUser",
              amount: 4.99,
              type: "RealCategory",
              color: "#aabbcc",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "RealCategory",
              color: "#aabbcc",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "RealRegularUser",
              amount: 20,
              type: "RealCategory",
              color: "#aabbcc",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });
    });

    test("Should return an error if the user who is calling the function does not correspond to the username param field (called by a Regular User)", async () => {
      const mockReq = {
        params: { username: "RealRegularUser", category: "RealCategory" },
        url: "/users/RealRegularUser/transactions/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.gSDZLEuASr0CXUuZAfCZ86Ow6JgXOEbu1Os7AsrD6Ug", Role: "Regular"}]);
      jest.spyOn(categories, "findOne").mockResolvedValue([{ type: "RealCategory", color: "#aabbcc" }]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "The username of the cookie and that one you provide don't match"});
      
      
      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The username of the cookie and that one you provide don't match"});
    });

    test("Should return an error if the user who calls the function with the admin route is not authenticated as an admin", async () => {
      const mockReq = {
        params: { username: "RealAdminUser", category: "RealCategory" },
        url: "/transactions/users/RealAdminUser/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
      jest
        .spyOn(categories, "findOne")
        .mockResolvedValue([{ type: "RealCategory", color: "#aabbcc" }]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: false, cause: "The user must be an Admin" });

      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The user must be an Admin"});
    });

    test("Should return an error if the aggregate function throws an error", async () => {
      const mockReq = {
        params: { username: "RealAdminUser", category: "RealCategory" },
        url: "/transactions/users/RealAdminUser/category/RealCategory",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealAdminUser", emails: "rAdminUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJBZG1pblVzZXJAZ21haWwuY29tIiwiaWQiOiI2NDY4OWFlYTEzMzg4OTAxNWZmZjQ2YyIsInVzZXJuYW1lIjoiUmVhbEFkbWluVXNlciIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNjg1MTgxODUwfQ.pZg44jQUhiLIScxuAStDQvFVjseFkoG3iHdVAzwHweY", Role: "Admin"}]);
      jest.spyOn(categories, "findOne").mockResolvedValue([{ type: "RealCategory", color: "#aabbcc" }]);
      jest.spyOn(utils, "verifyAuth").mockReturnValue({ flag: true, cause: "Authorized" });
      jest.spyOn(transactions, "aggregate").mockImplementation(() => {throw new Error("Generic error in DB")})

      await getTransactionsByUserByCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});
    });
});

describe("getTransactionsByGroup", () => { 
    test("It should return an array of transactions linked to the group of the user who calls the function (called by a Regular User)", async() => {
      const mockReq = {
        params: { name: "RealGroupName"},
        url: "/groups/RealGroupName/transactions",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue({
        _id: "64751ef80e662465a88c4cc7",
        name: 'RealGroupName',
        members: [
          {
            emails: 'firstExampleEmail@gmail.com',
            user: "6465d37f14c15b9727257f1d",
            _id: "64751ef80e662465a88c4cc8"
          },
          {
            emails: 'secondExampleEmail@gmail.com',
            user: "6465cc2080f0256e254c4bad",
            _id: "64751ef80e662465a88c4cc9"
          }
        ],
        __v: 0
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "firstUsernameExample",
            type: "category1",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "category1",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "firstUsernameExample",
            type: "category2",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "category2",
              color: "#a9bb4c",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "secondUsernameExample",
            type: "category2",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "category2",
              color: "#a9bb4c",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "firstUsernameExample",
              amount: 4.99,
              type: "category1",
              color: "#aabbcc",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "firstUsernameExample",
              amount: 20,
              type: "category2",
              color: "#a9bb4c",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "secondUsernameExample",
              amount: 20,
              type: "category2",
              color: "#a9bb4c",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });

    });

    test("It should return an array of transactions linked to a group specified in params (called by an Admin)", async() => {
      const mockReq = {
        params: { name: "RealGroupName"},
        url: "/transactions/groups/RealGroupName",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue({
        _id: "64751ef80e662465a88c4cc7",
        name: 'RealGroupName',
        members: [
          {
            emails: 'firstExampleEmail@gmail.com',
            user: "6465d37f14c15b9727257f1d",
            _id: "64751ef80e662465a88c4cc8"
          },
          {
            emails: 'secondExampleEmail@gmail.com',
            user: "6465cc2080f0256e254c4bad",
            _id: "64751ef80e662465a88c4cc9"
          }
        ],
        __v: 0
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

      jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
        const result = [
          {
            _id: "1234567890",
            username: "firstUsernameExample",
            type: "category1",
            amount: 4.99,
            date: "2023-05-18T07:29:16.434Z",
            __v: 0,
            transactions_info: {
              _id: "2345678901",
              type: "category1",
              color: "#aabbcc",
              __v: 0,
            },
          },
          {
            _id: "3456789012",
            username: "firstUsernameExample",
            type: "category2",
            amount: 20,
            date: "2023-05-18T07:29:29.635Z",
            __v: 0,
            transactions_info: {
              _id: "4567890123",
              type: "category2",
              color: "#a9bb4c",
              __v: 0,
            },
          },
          {
            _id: "5678901234",
            username: "secondUsernameExample",
            type: "category2",
            amount: 20,
            date: "2023-05-18T07:29:32.909Z",
            __v: 0,
            transactions_info: {
              _id: "6789012345",
              type: "category2",
              color: "#a9bb4c",
              __v: 0,
            },
          },
        ];
        return Promise.resolve(result);
      });

      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [
            {
              username: "firstUsernameExample",
              amount: 4.99,
              type: "category1",
              color: "#aabbcc",
              date: "2023-05-18T07:29:16.434Z",
            },
            {
              username: "firstUsernameExample",
              amount: 20,
              type: "category2",
              color: "#a9bb4c",
              date: "2023-05-18T07:29:29.635Z",
            },
            {
              username: "secondUsernameExample",
              amount: 20,
              type: "category2",
              color: "#a9bb4c",
              date: "2023-05-18T07:29:32.909Z",
            },
          ]
      });

    });

    test("It should return an error if the group name specified in the URL does not correspond to any group in the DB (called by an Admin)", async() => {
      const mockReq = {
        params: { name: "FakeGroupName"},
        url: "/transactions/groups/FakeGroupName",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue(null);

      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Group not found"});

    });

    test("It should return an error if the function is called by a regular user who is not in the group (called by a Regular User)", async() => {
      const mockReq = {
        params: { name: "RealGroupName"},
        url: "/groups/RealGroupName/transactions",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue({
        _id: "64751ef80e662465a88c4cc7",
        name: 'RealGroupName',
        members: [
          {
            emails: 'firstExampleEmail@gmail.com',
            user: "6465d37f14c15b9727257f1d",
            _id: "64751ef80e662465a88c4cc8"
          },
          {
            emails: 'secondExampleEmail@gmail.com',
            user: "6465cc2080f0256e254c4bad",
            _id: "64751ef80e662465a88c4cc9"
          }
        ],
        __v: 0
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "The emails of the token doesn't match"});
    
      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The emails of the token doesn't match"});

    });

    test("It should return an error if the function is called by an admin who is not authorized (called by an Admin)", async() => {
      const mockReq = {
        params: { name: "RealGroupName"},
        url: "/transactions/groups/RealGroupName",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue({
        _id: "64751ef80e662465a88c4cc7",
        name: 'RealGroupName',
        members: [
          {
            emails: 'firstExampleEmail@gmail.com',
            user: "6465d37f14c15b9727257f1d",
            _id: "64751ef80e662465a88c4cc8"
          },
          {
            emails: 'secondExampleEmail@gmail.com',
            user: "6465cc2080f0256e254c4bad",
            _id: "64751ef80e662465a88c4cc9"
          }
        ],
        __v: 0
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});
      
      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});

    });

    test("It should return an error if aggregate function throws an error (called by an Admin)", async() => {
      const mockReq = {
        params: { name: "RealGroupName"},
        url: "/transactions/groups/RealGroupName",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(Group, "findOne").mockResolvedValue({
        _id: "64751ef80e662465a88c4cc7",
        name: 'RealGroupName',
        members: [
          {
            emails: 'firstExampleEmail@gmail.com',
            user: "6465d37f14c15b9727257f1d",
            _id: "64751ef80e662465a88c4cc8"
          },
          {
            emails: 'secondExampleEmail@gmail.com',
            user: "6465cc2080f0256e254c4bad",
            _id: "64751ef80e662465a88c4cc9"
          }
        ],
        __v: 0
      });

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

      jest.spyOn(transactions, "aggregate").mockImplementation(() => {throw new Error("Generic error in DB")});

      await getTransactionsByGroup(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});

    });
})

describe("getTransactionsByGroupByCategory", () => { 
  test("It should return an array of transactions of a specified category linked to a group specified in params (called by an Admin)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "RealCategory"},
      url: "/transactions/groups/RealGroupName/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

    jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
      const result = [
        {
          _id: "1234567890",
          username: "firstUsernameExample",
          type: "RealCategory",
          amount: 4.99,
          date: "2023-05-18T07:29:16.434Z",
          __v: 0,
          transactions_info: {
            _id: "2345678901",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
        {
          _id: "3456789012",
          username: "firstUsernameExample",
          type: "RealCategory",
          amount: 20,
          date: "2023-05-18T07:29:29.635Z",
          __v: 0,
          transactions_info: {
            _id: "4567890123",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
        {
          _id: "5678901234",
          username: "secondUsernameExample",
          type: "RealCategory",
          amount: 20,
          date: "2023-05-18T07:29:32.909Z",
          __v: 0,
          transactions_info: {
            _id: "6789012345",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
      ];
      return Promise.resolve(result);
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: [
          {
            username: "firstUsernameExample",
            amount: 4.99,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:16.434Z",
          },
          {
            username: "firstUsernameExample",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:29.635Z",
          },
          {
            username: "secondUsernameExample",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:32.909Z",
          },
        ]
    });

  });

  test("It should return an array of transactions linked to the group of the user who calls the function (called by a Regular User)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "RealCategory"},
      url: "/groups/ReakGroupName/transactions/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

    jest.spyOn(transactions, "aggregate").mockImplementation((pipeline) => {
      const result = [
        {
          _id: "1234567890",
          username: "firstUsernameExample",
          type: "RealCategory",
          amount: 4.99,
          date: "2023-05-18T07:29:16.434Z",
          __v: 0,
          transactions_info: {
            _id: "2345678901",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
        {
          _id: "3456789012",
          username: "firstUsernameExample",
          type: "RealCategory",
          amount: 20,
          date: "2023-05-18T07:29:29.635Z",
          __v: 0,
          transactions_info: {
            _id: "4567890123",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
        {
          _id: "5678901234",
          username: "secondUsernameExample",
          type: "RealCategory",
          amount: 20,
          date: "2023-05-18T07:29:32.909Z",
          __v: 0,
          transactions_info: {
            _id: "6789012345",
            type: "RealCategory",
            color: "#aabbcc",
            __v: 0,
          },
        },
      ];
      return Promise.resolve(result);
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: [
          {
            username: "firstUsernameExample",
            amount: 4.99,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:16.434Z",
          },
          {
            username: "firstUsernameExample",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:29.635Z",
          },
          {
            username: "secondUsernameExample",
            amount: 20,
            type: "RealCategory",
            color: "#aabbcc",
            date: "2023-05-18T07:29:32.909Z",
          },
        ]
    });

  });

  test("It should return an error if the group name specified in params does not correspond to any group in the DB (called by an Admin)", async() => {
    const mockReq = {
      params: { name: "FakeGroupName", category: "RealCategory"},
      url: "/transactions/groups/FakeGroupName/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue(null);

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Group not found"});

  });

  test("It should return an error if the category specified in params does not correspond to any category in the DB (called by an Admin)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "FakeCategory"},
      url: "/transactions/groups/RealGroupName/category/FakeCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(categories, "findOne").mockResolvedValue(null);
    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Category not found"});

  });

  test("It should return an error if the admin who calls the function is not authorized (called by an Admin)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "RealCategory"},
      url: "/transactions/groups/RealGroupName/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});

  });

  test("It should return an error if the regular user who calls the functions is not in the group specified in params (called by a Regular User)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "RealCategory"},
      url: "/groups/ReakGroupName/transactions/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});

  });

  test("It should return an error if the aggregate function throws an error (called by an Admin)", async() => {
    const mockReq = {
      params: { name: "RealGroupName", category: "RealCategory"},
      url: "/transactions/groups/RealGroupName/category/RealCategory",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: undefined,
      },
    };

    jest.spyOn(Group, "findOne").mockResolvedValue({
      _id: "64751ef80e662465a88c4cc7",
      name: 'RealGroupName',
      members: [
        {
          emails: 'firstExampleEmail@gmail.com',
          user: "6465d37f14c15b9727257f1d",
          _id: "64751ef80e662465a88c4cc8"
        },
        {
          emails: 'secondExampleEmail@gmail.com',
          user: "6465cc2080f0256e254c4bad",
          _id: "64751ef80e662465a88c4cc9"
        }
      ],
      __v: 0
    });

    jest.spyOn(categories, "findOne").mockResolvedValue([{type: "RealCategory", color: "#aabbcc"}]);
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
    jest.spyOn(User, "find").mockResolvedValue([{username: "firstUsernameExample"}, {username: "secondUsernameExample"}]);

    jest.spyOn(transactions, "aggregate").mockImplementation(() => {throw new Error("Generic error in DB")});

    await getTransactionsByGroupByCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});

  });
})

describe("deleteTransaction", () => { 
    test('It should return a correct message', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4", Role: "Regular"}]);
      jest.spyOn(transactions, "findOne").mockResolvedValue({_id: "6hjkohgfc8nvu786", username: "RealRegularUser", type: "RealCategory", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0});
      jest.spyOn(jwt, "verify").mockReturnValue({username: "RealRegularUser"})
      jest.spyOn(transactions, "deleteOne").mockResolvedValue({});

      await deleteTransaction(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({data: {message: "Transaction deleted"}})

    });

    test('It should return a 400 error if the request body does not contain all the necessary attributes', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You must specify the id of the transaction to be deleted"});

    });

    test('It should return a 400 error if the username passed as a route parameter does not represent a user in the database', async() => {
      
      const mockReq = {
        params: { username: "FakeRegularUser"},
        url: "/users/FakeRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "User of the URL not found"});

    });

    test('It should return a 400 error if the _id in the request body does not represent a transaction in the database', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4", Role: "Regular"}]);
      jest.spyOn(transactions, "findOne").mockResolvedValue(null);

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "The id that you provided does not represent a transaction"});

    });

    test('It should return a 401 error if called by an authenticated user who is not the same user as the one in the route', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, cause: "Unauthorized"});

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized"});

    });

    test('It should return a 400 error if the username specified in the transaction to be deleted and the one derived from the refreshToken are different', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockResolvedValue([{username: "RealRegularUser", emails: "rRegularUser@gmail.com", password: "Password", refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4", Role: "Regular"}]);
      jest.spyOn(transactions, "findOne").mockResolvedValue({_id: "6hjkohgfc8nvu786", username: "DifferentUser", type: "RealCategory", amount: 20,date: "2023-05-20T21:59:15.635Z", __v: 0});
      jest.spyOn(jwt, "verify").mockReturnValue({username: "RealRegularUser"})

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "You are not the owner of the transaction, you cannot delete it"});

    });

    test('It should return a 400 error if a DB function throws an error', async() => {
      
      const mockReq = {
        params: { username: "RealRegularUser"},
        url: "/users/RealRegularUser/transactions",
        body: {
          _id: "6hjkohgfc8nvu786"
        },
        cookies: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJSZWd1bGFyVXNlckBnbWFpbC5jb20iLCJpZCI6IjY0Mzg5YWVhMTMzODg5MDE1ZmZmNDZjIiwidXNlcm5hbWUiOiJSZWFsUmVndWxhclVzZXIiLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NDU3NzA1MCwiZXhwIjoxNzA1MTgxODUwfQ.0n0F5iOAyHK3wVQqFSkuW_Sa872bNI8__F0ZayiORa4"
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: undefined,
        },
      };

      jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
      jest.spyOn(User, "findOne").mockImplementation(() => {throw new Error("Generic error in DB")});

      await deleteTransaction(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});

    });

})

describe("deleteTransactions", () => { 
  test('Should return an error if it is not admin authorized', async() => {
    const mockReq = {body: {_ids: ["646f1eb6aea4ccb252b68559","646f1ec1aea4ccb252b6855b"]}};
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            error: "Unauthorized"
        }
    };
    jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: false, error: "Unauthorized"});
    await deleteTransactions(mockReq,mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error})
});

test('Should return an error if not contain all the necessary attributes', async () => {
  const mockReq = {body: {_idsingular: "646f1e07aea4ccb252b6854b"}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "You have wrong attribute"
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  await deleteTransactions(mockReq, mockRes);
  expect(mockReq.body).not.toHaveProperty("_ids");
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  
});

test('Should return an error if exist empty string', async () => {
  const mockReq = {body: {_ids: ["647883355c534344eb39fcd8","","647883225c534344eb39fcd3"]}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "Some transactions do not exist or empty string exists."
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  //jest.spyOn(transactions,"findOne").mockResolvedValue();
  await deleteTransactions(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  
});

test('Should return an error if Some transactions do not exist', async () => {
  const mockReq = {body: {_ids: ["647883355c534344eb39fcd8","647883355c534344eb39fc11","647883225c534344eb39fcd3"]}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        error: "Some transactions do not exist or empty string exists."
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(transactions,"findOne").mockResolvedValue();
  await deleteTransactions(mockReq, mockRes);
  expect(transactions.findOne).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: mockRes.locals.error});
  
});

test('Should return the successful message with the change', async () => {
  const mockReq = {body: {_ids: ["647883355c534344eb39fcd8","647883225c534344eb39fcd3"]}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          message: "Transactions deleted.",
          refreshedTokenMessage: "undefined"
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, message: "Authorized"});
  jest.spyOn(transactions, "findOne").mockResolvedValue([]);
  jest.spyOn(transactions, "deleteOne").mockResolvedValue({modifiedCount: 1});
  await deleteTransactions(mockReq, mockRes);
  expect(transactions.findOne).toHaveBeenCalled();
  expect(transactions.deleteOne).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith({data:{message: mockRes.locals.message, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage}});
  
});

test('It should return a 400 error if a DB function throws an error', async() => {
      
  const mockReq = {body: {_ids: ["647883355c534344eb39fcd8","647883225c534344eb39fcd3"]}};
  const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
      }
  };
  jest.spyOn(utils, "verifyAuth").mockReturnValue({flag: true, cause: "Authorized"});
  jest.spyOn(transactions, "findOne").mockImplementation(() => {throw new Error("Generic error in DB")});
  await deleteTransactions(mockReq, mockRes);
  expect(mockRes.status).toHaveBeenCalledWith(400);
  expect(mockRes.json).toHaveBeenCalledWith({error: "Generic error in DB"});
});

})
