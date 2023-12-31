import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyAuth } from './utils.js';

/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
    export const register = async (req, res) => {
        try {
            const { username, email, password } = req.body;
        
        if(username == undefined || email == undefined || password == undefined)
            return res.status(400).json( { error: "You have to insert username, email and password!" });
        
            if(username == "" || email == ""|| password == "")
            return res.status(400).json({ error: "Username, email and password can not be empy!" });
        
        const valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
        if (!valid.test(email))
            return res.status(400).json({ error: "The email is not valid!" });
       
        const existingUser = await User.findOne({ $or: [{email: req.body.email}, {username : req.body.username} ]});
        
        if (existingUser) return res.status(400).json({ error: "Username and/or email are already in our database!" });
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: "Regular"
        });
        
        res.status(200).json({data : {message : 'User added succesfully'}});
        } catch (err) {
            res.status(400).json(err);
        }
    };
    
/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    - error 400 is returned if there is already a user with the same username and/or email
 */
    export const registerAdmin = async (req, res) => {
        try {
            //does not contain all the necessary attributes or at least one empty string
            const { username, email, password } = req.body
            if(!username || !email || !password){
                return res.status(400).json({ error: "you have to insert username, email and password!" });
            }
            //invalid email format
            //No "@" symbol in email
            var eformat=JSON.stringify(email);
           if(!eformat.includes("@"))
           {
               return res.status(400).json({ error: "invalid email format!" });
           }
           //More than one "@" symbol in email
           else
           {
            var index = -1;
            var count=0;
            do {
                index = eformat.indexOf("@", index + 1); 
                 if (index != -1) {
                  count++;
                }
               } while (index != -1);
               if(count!==1)
               {
                return res.status(400).json({ error: "invalid email format!" });
               }
           }
           //offical part
            const existingUser = await User.findOne({ $or: [{email: req.body.email}, {username : req.body.username} ]});
            if (existingUser) return res.status(400).json({ error: "you are already registered" });
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await User.create({
                username,
                email,
                password: hashedPassword,
                role: "Admin"
            });
            res.status(200).json({data : {message : "admin added succesfully"}});
        } catch (err) {
            res.status(400).json(err);
        }
    
    }

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - error 400 is returned if the supplied password does not match with the one in the database
 */
    export const login = async (req, res) => {
        const { email, password } = req.body
        //does not contain all the necessary attributes or at least one empty string
        if(!email || !password){
            return res.status(400).json({ error: "you have to insert email and password!" });
        }
        //invalid email format
        //No "@" symbol in email
        var eformat=JSON.stringify(email);
       if(!eformat.includes("@"))
       {
           return res.status(400).json({ error: "invalid email format!" });
       }
       //More than one "@" symbol in email
       else
       {
        var index = -1;
        var count=0;
        do {
            index = eformat.indexOf("@", index + 1); 
             if (index != -1) {
              count++;
            }
           } while (index != -1);
           if(count!==1)
           {
            return res.status(400).json({ error: "invalid email format!" });
           }
       }
       //offical part
       const cookie = req.cookies
       const existingUser = await User.findOne({ email: email })
       if (!existingUser) return res.status(400).json({error:'please you need to register'})
       try {
           const match = await bcrypt.compare(password, existingUser.password)
           if (!match) return res.status(400).json({error:'wrong credentials'})
           //CREATE ACCESSTOKEN
           const accessToken = jwt.sign({
               email: existingUser.email,
               id: existingUser.id,
               username: existingUser.username,
               role: existingUser.role
           }, process.env.ACCESS_KEY, { expiresIn: '1h' })
           //CREATE REFRESH TOKEN
           const refreshToken = jwt.sign({
               email: existingUser.email,
               id: existingUser.id,
               username: existingUser.username,
               role: existingUser.role
           }, process.env.ACCESS_KEY, { expiresIn: '7d' })
           //SAVE REFRESH TOKEN TO DB
           existingUser.refreshToken = refreshToken
           const savedUser = await existingUser.save()
           res.cookie("accessToken", accessToken, { httpOnly: true, domain: "localhost", path: "/api", maxAge: 60 * 60 * 1000, sameSite: "none", secure: true })
           res.cookie('refreshToken', refreshToken, { httpOnly: true, domain: "localhost", path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none', secure: true })
           res.status(200).json({ data: { accessToken: accessToken, refreshToken: refreshToken } })
       } catch (error) {
           res.status(400).json(error)
       }
    }

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    - error 400 is returned if the user does not exist
 */
    export const logout = async (req, res) => {
        const auth = verifyAuth(req, res, {authType: "Simple"})
    const refreshToken = req.cookies.refreshToken
if (!refreshToken) return res.status(400).json({error:"user has logged out"})
const user = await User.findOne({ refreshToken: refreshToken })
if (!user) return res.status(400).json({error:"user not found"})
try {
    user.refreshToken = null
    res.cookie("accessToken", "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
    res.cookie('refreshToken', "", { httpOnly: true, path: '/api', maxAge: 0, sameSite: 'none', secure: true })
    const savedUser = await user.save()
    res.status(200).json({data: {message: "User logged out"}})
} catch (error) {
    res.status(400).json(error)
}
    }
    
