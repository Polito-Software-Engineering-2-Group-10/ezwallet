import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
const jwt = require('jsonwebtoken')

describe("handleDateFilterParams", () => { 
    test('Should give an error because I pass date + another param', () => {
        const mockReq = { query: {date: "2023-01-24", from: "2021-01-20"} };

        const func = () => {
            handleDateFilterParams(mockReq);
        }

        expect(func).toThrow(Error("It includes only one parameter of from and upTo with date"));
        
    });

    test('Should throw an error because I pass an invalid format in date', () => {
        const mockReq = { query: {date: '23-11-2022' } }

        const func = () => {
            handleDateFilterParams(mockReq);
        }

        expect(func).toThrow(Error("Invalid format for date"));
    });

    test('Should throw an error because I pass an invalid format in from', () => {
        const mockReq = { query: {from: '23-11-2022' } }

        const func = () => {
            handleDateFilterParams(mockReq);
        }
 
        expect(func).toThrow(Error("Invalid format for from"));
    });

    test('Should throw an error because I pass an invalid format in upTo', () => {
        const mockReq = { query: {upTo: '23-11-2022' } }

        const func = () => {
            handleDateFilterParams(mockReq);
        }

        expect(func).toThrow(Error("Invalid format for upTo"));
    });

    test('Should return an empty query', () => {
        const mockReq = {query : {}}

        const returnObject = {}
        const object = handleDateFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

    test('Should return a query with $lte and $gte field', () => {
        const mockReq = { query: {date: "2023-01-24"} }

        const returnObject = { date: {$gte: new Date("2023-01-24T00:00:00.000Z"), $lte: new Date("2023-01-24T23:59:59.999Z")}}

        const object = handleDateFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

    test('Should return an object with only $gte field', () => {
        const mockReq = { query: {from: "2023-01-24"} }

        const returnObject = { date: {$gte: new Date("2023-01-24T00:00:00.000Z")}}

        const object = handleDateFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

    test('Should return an object with only $lte field', () => {
        const mockReq = { query: {upTo: "2023-01-24"} }

        const returnObject = { date: {$lte: new Date("2023-01-24T23:59:59.999Z")}}

        const object = handleDateFilterParams(mockReq);
        expect(object).toEqual(returnObject);
        
    })

    test('Should return an object with $gte and $lte field', () => {
        const mockReq = { query: {from: "2023-01-24", upTo: "2023-02-28"} }

        const returnObject = { date: {$gte: new Date("2023-01-24T00:00:00.000Z"), $lte: new Date("2023-02-28T23:59:59.999Z")}}

        const object = handleDateFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

})

describe("verifyAuth", () => { 
    test('Should return an error because there are not accessToken and refreshToken', () => {
        const mockReq = {cookies : {}}
        const mockRes = {}

        const auth = verifyAuth(mockReq, mockRes, {authType : "Simple"});
        expect(auth).toEqual({flag: false, cause: "Unauthorized"})
    });

    test('Should return an error because information in accessToken is missing ', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.ZgSmWqGAf4pOBhg6CIpa9M4Q1fy7rKXyoEU4fG2h714", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);

        const auth = verifyAuth(mockReq, mockRes, {authType : "Simple"});
        expect(auth).toEqual({flag: false, cause: "Token is missing information"})
    });

    test('Should return an error because information in refreshToken is missing ', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1OTU0NDIyLCJleHAiOjIwMDAwMDAwMDB9.fwqiGsP0Uv1PkLq5mDBukhZXmDbty6Yi1UeQyl-CxI"}}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);

        const auth = verifyAuth(mockReq, mockRes, {authType : "Simple"});
        expect(auth).toEqual({flag: false, cause: "Token is missing information"})
    })

    test('Should return an error because the username in the token and the one passed do not match', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiUGFsYSIsInJvbGUiOiJSZWd1bGFyIiwiaWF0IjoxNjg1OTU0NDIyLCJleHAiOjIwMDAwMDAwMDB9.WcQWBN0tojclRBmXnoQdE3eBOM22xm9w4iG8G9rWuYk"}}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Elia",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Simple"});
        expect(auth).toEqual({flag: false, cause: "Mismatched users"})
    });


    test('Should return false because the email of the token is not in the group of emails', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Group", emails: ["eliaferraro@gmail.com", "nicolasinisi@gmail.com", "yanlinxiao@gmail.com"]});
        expect(auth).toEqual({flag: false, cause: "The email of the token doesn't match"})
    });

    test('Should return an error because the token passed is not admin', () => {
        const mockReq = {cookies : {accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg1OTU5NzUxfQ.6-xwSUcLC9IqGdm6gvsuaL0fW1udXvimVT0QSchPJlU', 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg2NTYwOTUxfQ.2b8YNxxsJA40-DkGwsZqf_WUEWcpmfRj4bAYLfSXYa4"}}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);

        const auth = verifyAuth(mockReq, mockRes, {authType : "Admin"});
        expect(auth).toEqual({flag: false, cause: "The user must be an Admin"});
    });

    test('Should return an error because the User passed is not the same of the token', () => {
        const mockReq = {cookies : {accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg1OTU5NzUxfQ.6-xwSUcLC9IqGdm6gvsuaL0fW1udXvimVT0QSchPJlU', 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg2NTYwOTUxfQ.2b8YNxxsJA40-DkGwsZqf_WUEWcpmfRj4bAYLfSXYa4"}}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);

        const auth = verifyAuth(mockReq, mockRes, {authType : "User", username: 'Elia'});
        expect(auth).toEqual({flag: false, cause: "The username of the cookie and that one you provide don't match"});
    });

    test('Should return an error because you have to specify a valid AuthType', () => {
        const mockReq = {cookies : {accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg1OTU5NzUxfQ.6-xwSUcLC9IqGdm6gvsuaL0fW1udXvimVT0QSchPJlU', 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg2NTYwOTUxfQ.2b8YNxxsJA40-DkGwsZqf_WUEWcpmfRj4bAYLfSXYa4"}}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);

        const auth = verifyAuth(mockReq, mockRes,{ authType: "NotType" } );
        expect(auth).toEqual({flag: false, cause: "You must specify a valid authType"});
    })

    test('Should return authorized', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = {}

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedAccesToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType: "Simple"});
        expect(auth).toEqual({flag: true, cause: "Authorized"})
    });

    test('Should return an error because both tokens are expired', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementation(() => {throw {name: "TokenExpiredError"}});
        const auth = verifyAuth(mockReq, mockRes, {authType: "Admin"});
        expect(auth).toEqual({flag: false, cause: "Perform login again"});
    });

    test("Should return an error because is not admin but the token must be refreshed", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockImplementationOnce(()=>{return mockDecodedAccesToken});
        const auth = verifyAuth(mockReq, mockRes, {authType: "Admin"});
        expect(auth).toEqual({flag: false, cause: "The user must be an Admin"});
        expect(mockRes.locals).toHaveProperty("message");
    })

    test("Should return an error because the User passed is not the same of the token but the token must be refreshed", () => {
        const mockReq = {cookies : {accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg1OTU5NzUxfQ.6-xwSUcLC9IqGdm6gvsuaL0fW1udXvimVT0QSchPJlU', 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NjE1MSwiZXhwIjoxNjg2NTYwOTUxfQ.2b8YNxxsJA40-DkGwsZqf_WUEWcpmfRj4bAYLfSXYa4"}}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "User", username: 'Elia'});

        expect(auth).toEqual({flag: false, cause: "The username of the cookie and that one you provide don't match"});
    })

    test("Should return false because the email of the token is not in the group of emails but the token must be refreshed", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Group", emails: ["eliaferraro@gmail.com", "nicolasinisi@gmail.com", "yanlinxiao@gmail.com"]});
        expect(auth).toEqual({flag: false, cause: "The email of the token doesn't match"})
        expect(mockRes.locals).toHaveProperty("message");
    })

    test('Should return authorized and refreshed Token too', () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedAccesToken  = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Regular"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType: "Simple"});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
        expect(mockRes.locals).toHaveProperty("message");
    })

    test("An admin should be verified well and token must be refreshed", ()=>{
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davide.palatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType: "Admin"});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
        expect(mockRes.locals).toHaveProperty("message");

    });

    test("A group should be verified well and token must be refreshed", ()=>{
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Group", emails: ["davidepalatroni@gmail.com","eliaferraro@gmail.com", "nicolasinisi@gmail.com", "yanlinxiao@gmail.com"]});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
        expect(mockRes.locals).toHaveProperty("message");
    })

    test("A user should be verified well and token must be refreshed", ()=>{
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "User", username: 'Pala'});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
        expect(mockRes.locals).toHaveProperty("message");
    })

    test("A User must be verified at first time", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedRefreshToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "User", username: 'Pala'});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
    })

    test("A Group must be verified at first time", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedRefreshToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Group", emails: ["davidepalatroni@gmail.com","eliaferraro@gmail.com", "nicolasinisi@gmail.com", "yanlinxiao@gmail.com"]});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
    } )
    test("An Admin must be verified at first time", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockReturnValueOnce(mockDecodedRefreshToken).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "Admin"});
        expect(auth).toEqual({flag: true, cause: "Authorized"});
    })

    test("An error was caused by accessToken and it is not TokenExpiredError", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TypeError"}});
        const auth = verifyAuth(mockReq, mockRes, {authType : "User", username: 'Pala'});
        expect(auth).toEqual({flag: false, cause: "TypeError"});
    })

    test("An error was caused by refreshToken and it is not TokenExpiredError", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockImplementationOnce(() => {throw {name: "TypeError"}});
        const auth = verifyAuth(mockReq, mockRes, {authType : "Simple"});
        expect(auth).toEqual({flag: false, cause: "TypeError"});
    })

    test("Should return an error because the authType is not valid but the token must be refreshed", () => {
        const mockReq = {cookies : {accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoxNjg1OTU4MDIyfQ.AX55VeQFm5Xaxd6WRUJVlBQ9SGUg5xm6aG-fBLARXGY", 
                                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhdmlkZS5tYXJpb3R0aUBnbWFpbC5jb20iLCJpZCI6IjY0N2Q5ZjY4ZmQwNWNmYzBjYzJkZjMwNiIsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiUmVndWxhciIsImlhdCI6MTY4NTk1NDQyMiwiZXhwIjoyMDAwMDAwMDAwfQ.d9wdz2xaSeV1xzciZski-b_GR50ReCLD04EKPHeb0nI" }}
        const mockRes = { locals: {}, cookie: jest.fn().mockImplementation() }

        const mockDecodedRefreshToken = {
            username: "Pala",
            email: "davidepalatroni@gmail.com",
            role: "Admin"
        }

        jest.spyOn(jwt, "sign").mockImplementation(()=>{return null})
        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {throw {name: "TokenExpiredError"}}).mockReturnValueOnce(mockDecodedRefreshToken);
        const auth = verifyAuth(mockReq, mockRes, {authType : "NotAType"});
        expect(auth).toEqual({flag: false, cause: "You must specify the authType"});
    })

})

describe("handleAmountFilterParams", () => { 
    test('Should throw an error because max is not an integer', () => {
        const mockReq = {query: {min: "10", max: "2022-01-22"}}
        const func = () => {
            handleAmountFilterParams(mockReq)
        }

        expect(func).toThrow(Error("Max must be an integer"))
    })

    test('Should throw an error because min is not an integer', () => {
        const mockReq = {query: {min: "2000-22-11"}}
        const func = () => {
            handleAmountFilterParams(mockReq);
        }

        expect(func).toThrow(Error("Min must be an integer"))
    })

    test('Should return an empty query', () => {
        const mockReq = {query : {}}

        const returnObject = {}
        const object = handleAmountFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })
    
    test('Should return a query with only min', () => {
        const mockReq = { query: {min: "200"} }

        const returnObject = { amount: {$gte : 200}}

        const object = handleAmountFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

    test('Should return a query with only max',()=>{
        const mockReq = { query: {max: "200"} }

        const returnObject = { amount: {$lte : 200}}

        const object = handleAmountFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })

    test('Should return a query with max and min', ()=>{
        const mockReq = { query: {min: "200", max:"1000"} }

        const returnObject = { amount: {$gte : 200, $lte: 1000}}

        const object = handleAmountFilterParams(mockReq);
        expect(object).toEqual(returnObject);
    })
    
})
