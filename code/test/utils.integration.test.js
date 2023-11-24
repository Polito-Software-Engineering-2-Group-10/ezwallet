import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const adminAccessTokenValid = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' });

const adminAccessTokenExpired = jwt.sign({
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '0s' });

const testerAccessTokenValid = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' });

const testerAccessTokenExpired = jwt.sign({
    email: "tester@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })

const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

const testDifferentUsernameToken = jwt.sign({
    email: "tester@test.com",
    username: "tester2",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const testDifferentEmailToken = jwt.sign({
    email: "tester2@test.com",
    username: "tester",
    role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

describe("handleDateFilterParams", () => { 
    test('Should give an error because I pass date + another param', () => {
        const mockReq = { query: {date: "2023-01-24", from: "2021-01-20"} };

        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
        
    });

    test('Should throw an error because I pass an invalid format in date', () => {
        const mockReq = { query: {date: '23-11-2022' } }

        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
    });

    test('Should throw an error because I pass an invalid format in from', () => {
        const mockReq = { query: {from: '23-11-2022' } }
 
        expect(()=>{handleDateFilterParams(mockReq)}).toThrow();
    });

    test('Should throw an error because I pass an invalid format in upTo', () => {
        const mockReq = { query: {upTo: '23-11-2022' } }

        expect(()=>{handleDateFilterParams(mockReq)}).toThrow(Error("Invalid format for upTo"));
    });

    test('Should return an empty query', () => {
        const mockReq = {query : {}}

        const object = handleDateFilterParams(mockReq);
        expect(Object.keys(object).length).toBe(0);

    })

    test('Should return a query with $lte and $gte field', () => {
        const mockReq = { query: {date: "2023-01-24"} }

        const object = handleDateFilterParams(mockReq);

        expect(object).toHaveProperty("date");
        expect(object.date).toHaveProperty("$gte", new Date("2023-01-24T00:00:00.000Z"));
        expect(object.date).toHaveProperty("$lte", new Date("2023-01-24T23:59:59.999Z"));

    })

    test('Should return an object with only $gte field', () => {
        const mockReq = { query: {from: "2023-01-24"} }

        const object = handleDateFilterParams(mockReq);
       
        expect(object).toHaveProperty("date");
        expect(object.date).toHaveProperty("$gte", new Date("2023-01-24T00:00:00.000Z"));

    })

    test('Should return an object with only $lte field', () => {
        const mockReq = { query: {upTo: "2023-01-24"} }

        const returnObject = { date: {$lte: new Date("2023-01-24T23:59:59.999Z")}}

        const object = handleDateFilterParams(mockReq);
        
        expect(object).toHaveProperty("date");
        expect(object.date).toHaveProperty("$lte", new Date("2023-01-24T23:59:59.999Z"));
        
    })

    test('Should return an object with $gte and $lte field', () => {
        const mockReq = { query: {from: "2023-01-24", upTo: "2023-02-28"} }

        const object = handleDateFilterParams(mockReq);
        
        expect(object).toHaveProperty("date");
        expect(object.date).toHaveProperty("$gte", new Date("2023-01-24T00:00:00.000Z"));
        expect(object.date).toHaveProperty("$lte", new Date("2023-02-28T23:59:59.999Z"));
    })
})

describe("verifyAuth", () => { 
    test('Should return an error because there are not accessToken and refreshToken', () => {
        const req = { cookies: {} }
        const res = {}

        const response = verifyAuth(req, res, { authType: "Simple"});
        expect(Object.values(response).includes(false)).toBe(true);

    });

    test('Should return an error because information in accessToken is missing ', () => {
        const req = { cookies: { accessToken: testerAccessTokenEmpty, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(false)).toBe(true);
    });

    test('Should return an error because information in refreshToken is missing ', () => {

        const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerAccessTokenEmpty } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(false)).toBe(true);
    })

    test('Should return an error because the username in the token and the one passed do not match', () => {

        const req = { cookies: { accessToken: testDifferentUsernameToken, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(false)).toBe(true);
    
    });


    test('Should return false because the email of the token is not in the group of emails', () => {

        const req = { cookies: { accessToken: testDifferentEmailToken, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(false)).toBe(true);
        
    });

    test('Should return an error because the token passed is not admin', () => {

        const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "Admin" } );

        expect(Object.values(response).includes(false)).toBe(true);
        
    });

    test('Should return an error because the User passed is not the same of the token', () => {

        const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "User", username: "tester2" } );

        expect(Object.values(response).includes(false)).toBe(true);
        
    });

    test('Should return an error because you have to specify a valid AuthType', () => {
        const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerAccessTokenValid } }
        const res = {}
        const response = verifyAuth(req, res, { authType: "NotValid" } );

        expect(Object.values(response).includes(false)).toBe(true);
    });

    test('Should return an error because both tokens are expired', ()=>{
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenExpired } }
        const res = {}

        const response = verifyAuth(req,res, {authType: "Simple"} );
        expect(Object.values(response).includes(false)).toBe(true);
        expect(response).toHaveProperty("cause");
    })

    test('Should return authorized but with the token refreshed', () => {
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid } }

        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };
        const response = verifyAuth(req, res, { authType: "User", username: "tester" } );

        expect(Object.values(response).includes(true)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    });

    test('Should return authorized', () => {

        const req = { cookies: { accessToken: adminAccessTokenValid, refreshToken: adminAccessTokenValid } }
        const res = {};
        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(true)).toBe(true);
        
    });

    test("Should return an error because is not admin but the token must be refreshed", ()=>{
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };
        const response = verifyAuth(req, res, { authType: "Admin" } );

        expect(Object.values(response).includes(false)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("Should return an error because the User passed is not the same of the token but the token must be refreshed", () => {
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };
        const response = verifyAuth(req, res, { authType: "User" , username: "tester2"} );

        expect(Object.values(response).includes(false)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("Should return false because the email of the token is not in the group of emails but the token must be refreshed", () => {
        const req = { cookies: { accessToken: testerAccessTokenExpired, refreshToken: testerAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };
        const response = verifyAuth(req, res, { authType: "Group", emails: ["tester1@test.com", "tester2@test.com", "tester3@test.com"] } );

        expect(Object.values(response).includes(false)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("An admin should be verified well and token must be refreshed", ()=>{
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };
        const response = verifyAuth(req, res, { authType: "Admin" } );

        expect(Object.values(response).includes(true)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("A group should be verified well and token must be refreshed", () => {
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };

        const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com", "tester2@test.com", "tester3@test.com"] } );

        expect(Object.values(response).includes(true)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("A user should be verified well and token must be refreshed", () => {
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };

        const response = verifyAuth(req, res, { authType: "User", username: "admin"} );

        expect(Object.values(response).includes(true)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("Simple authentication should pass and the token must be refreshed", () => {
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };

        const response = verifyAuth(req, res, { authType: "Simple" } );

        expect(Object.values(response).includes(true)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

    test("A User must be verified at first time", () => {
        const req = { cookies: { accessToken: adminAccessTokenValid , refreshToken: adminAccessTokenValid } }
        const res = {};

        const response = verifyAuth(req, res, { authType: "User", username: "admin" } );

        expect(Object.values(response).includes(true)).toBe(true);

    })

    test("A Group must be verified at first time", () => {
        const req = { cookies: { accessToken: adminAccessTokenValid , refreshToken: adminAccessTokenValid } }
        const res = { };

        const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com", "tester2@test.com", "tester3@test.com"] } );

        expect(Object.values(response).includes(true)).toBe(true);
    
    })

    test("An Admin must be verified at first time", () => {
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const res = {};

        const response = verifyAuth(req, res, { authType: "Admin" } );

        expect(Object.values(response).includes(false)).toBe(true);
    
    })

    test("Should return an error because the authType is not valid but the token must be refreshed", () => {
        const req = { cookies: { accessToken: adminAccessTokenExpired , refreshToken: adminAccessTokenValid } }
        const cookieMocked = (name, value, options) => {
            res.cookieArgs = {name, value, options }
        }
        const res = {
            cookie: cookieMocked,
            locals: {}
        };

        const response = verifyAuth(req, res, { authType: "NotAtype" } );

        expect(Object.values(response).includes(false)).toBe(true);
        expect(res.cookieArgs).toEqual({
            name: 'accessToken',
            value: expect.any(String), 
            options: { 
                httpOnly: true,
                path: '/api',
                maxAge: 60 * 60 * 1000,
                sameSite: 'none',
                secure: true,
            },
        })
        const message = res.locals.message? true: false
        expect(message).toBe(true)
    })

})

describe("handleAmountFilterParams", () => { 
    test('Should throw an error because max is not an integer', () => {
        const mockReq = {query: {min: "10", max: "2022-01-22"}}

        expect(()=>{handleAmountFilterParams(mockReq)}).toThrow()
    })

    test('Should throw an error because min is not an integer', () => {
        const mockReq = {query: {min: "2000-22-11"}}

        expect(()=>{handleAmountFilterParams(mockReq)}).toThrow()
    })

    test('Should return an empty query', () => {
        const mockReq = {query : {}}

        const object = handleAmountFilterParams(mockReq);
        expect(Object.keys(object).length).toBe(0);
    })
    
    test('Should return a query with only min', () => {
        const mockReq = { query: {min: "200"} }

        const object = handleAmountFilterParams(mockReq);

        expect(object).toHaveProperty("amount")
        expect(object.amount).toHaveProperty("$gte",200);
    })

    test('Should return a query with only max',()=>{
        const mockReq = { query: {max: "200"} }

        const object = handleAmountFilterParams(mockReq);

        expect(object).toHaveProperty("amount")
        expect(object.amount).toHaveProperty("$lte",200);

    })

    test('Should return a query with max and min', ()=>{
        const mockReq = { query: {min: "200", max:"1000"} }

        const object = handleAmountFilterParams(mockReq);
        
        expect(object).toHaveProperty("amount")
        expect(object.amount).toHaveProperty("$gte",200);
        expect(object.amount).toHaveProperty("$lte",1000);

    })
})
