import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import jwt from 'jsonwebtoken';

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, { authType: "Admin"});
        if (!adminAuth.flag) 
          return res.status(401).json({ error: adminAuth.cause });
        const users = await User.find();
        const user = [];
        for(const u of users){
          user.push({username : u.username, email : u.email, role : u.role});
        }
        
        res.status(200).json({data : user, refreshTokenMessage : res.locals.refreshTokenMessage});
  } catch (error) {
      res.status(400).json(error.message);
    }
}

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
  try {

    if(!req.params.username || req.params.username == "" || req.url == "/users/:username"){
      return res.status(400).json({ error: "You have to insert the username" });
    }

    const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
    const adminAuth = verifyAuth(req, res, { authType: "Admin"});
    
    if(userAuth.flag == false){
      if(adminAuth.flag == false){
        return res.status(401).json({ error : userAuth.cause});
      }
    }
    const u = await User.findOne({ username : req.params.username });

    if (!u) 
      return res.status(400).json({ error: "User not found" });
    

      res.status(200).json({data : {username : u.username , email : u.email , role : u.role}, refreshTokenMessage : res.locals.refreshTokenMessage});
   
} catch (error) {
    res.status(400).json(error.message)
}
}

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
    export const createGroup = async (req, res) => {
      try {
          const name = req.body.name;
          const memberEmails = req.body.memberEmails;
          const simpleAuth = verifyAuth(req, res, { authType: "Simple" });
          
          if(simpleAuth.flag == false)
            return res.status(401).json({ error: simpleAuth.cause});  
          
          

          if(name == undefined || memberEmails == undefined){
            return res.status(400).json({error: 'The request body does not contain all the necessary attributes!'});
          }

          if(name == ""){
            return res.status(400).json({error: 'The group name can not be an empty string!'});
          }

          const existingGroup = await Group.findOne({ name:name});

          if (existingGroup != null){
            return res.status(400).json({ error: `The group ${name} already exists` });
          }

          const refreshToken = jwt.verify(req.cookies.refreshToken, process.env.ACCESS_KEY);
          const ownerE = refreshToken.email;

          const group = await Group.findOne({members : { $elemMatch : {email: ownerE}}});

          if(group!= null){
            return res.status(400).json({error: 'You can not crate a new group: you are already in a group!'});
          }

          if(memberEmails.length == 0){
            return res.status(400).json({ error: 'Member emails are required!' });
          }else{
            let  x=0;
            for(const e of memberEmails){
              if(e == ownerE){
                x=1;
              }
            }
            if(x==0){
              memberEmails.push(ownerE);
            }
          }

          const members = [];
          const alreadyInGroup = [];
          const membersNotFound = [];
          const toShow = [];
          const valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          
          for(const e of memberEmails){
              if (!valid.test(e) && e.length>0){
                return res.status(400).json({ error: "At least one email is not valid!" });
              }
              if(e == ""){
                return res.status(400).json({ error: "At least one email is empty!" });
              }
              const user = await User.findOne({email : e});
              if(user){
                const group = await Group.findOne({members : { $elemMatch : {email: e}}});
                if(group)
                  alreadyInGroup.push(e);
                else{
                  members.push({email : e, user : user._id});
                  toShow.push({email : e});
                }
              }else
                membersNotFound.push(e);
          }
    
          if(members.length - 1 ==0) //I don't consider who wants to create the group
            return res.status(400).json({ error: 'No one can be added to this group' });
          
          const new_group = new Group({name, members});
          await new_group.save();
          return res.status(200).json({ data : {
            group : {name : name, members : toShow},
            alreadyInGroup : alreadyInGroup,
            membersNotFound : membersNotFound
          }, refreshTokenMessage : res.locals.refreshTokenMessage});
    
    
      } catch (err) {
          return res.status(400).json(err.message)
      }
    }
    

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, { authType: "Admin"})
        if (!adminAuth.flag) 
          return res.status(401).json({ error: adminAuth.cause });
          
          const groups = await Group.find();
          const group = [];
          let inside = [];
          for(const g of groups){
            for(const e of g.members){
              inside.push({email : e.email});
            }
            group.push({name : g.name, members : inside});
            inside = [];
          }

          res.status(200).json({ data :  group , refreshTokenMessage : res.locals.refreshTokenMessage });
  } catch (err) {
      res.status(400).json(err.message)
    }
}

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {

    if(!req.params.name || req.params.name == "" || req.url == "/groups/:name"){
      return res.status(400).json({ error: "You have to insert the group name" });
    }  

    const name = req.params.name;
    const inside = []; //people into the group
    const check = [];
    const g = await Group.findOne({ name:name});


    if(g){
      for(const e of g.members){
        check.push(e.email);
        inside.push({email : e.email});
      }
    }

    const groupAuth = verifyAuth(req, res, { authType: "Group", emails: check});  
    const adminAuth = verifyAuth(req, res, { authType: "Admin"});
   
    if(groupAuth.flag == false){
      if(adminAuth.flag == false){
        return res.status(401).json({ error : groupAuth.cause});
      }
    }

    if(!g)
      return res.status(400).json({ error: "The group does not exist" });
    
    res.status(200).json({ data : {group : {name : g.name , members : inside}}, refreshTokenMessage : res.locals.refreshTokenMessage });
    
 } catch (err) {
     res.status(400).json(err.message)
   }
}

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {

    const membersEmail = req.body.emails;
          const name = req.params.name;
        
          if(!name || name == "" || req.url == "/groups/:name/add" || req.url == "/groups/:name/insert" ){
            return res.status(400).json({ error: "You have to insert the group name" });
          } 

          if(!membersEmail){
            return res.status(400).json({ error: "emails are required" });
          }else{
            if(membersEmail.length<=0)
              return res.status(400).json({ error: "emails are required" });
          }

          const inside = []; //people already into the group
          const toShow = [];
          const toCheck = [];

          const group = await Group.findOne({ name:name});

          if(group){
            for(const e of group.members){
              inside.push(e);
              toShow.push({email : e.email});
              toCheck.push(e.email);
            }
          }

          if (req.url == `/groups/${req.params.name}/insert`){
            const adminAuth = verifyAuth(req, res, { authType: "Admin"});
            if (!adminAuth.flag) 
              return res.status(401).json({ error: adminAuth.cause });
          }else{
            const groupAuth = verifyAuth(req, res, { authType: "Group", emails: toCheck});
            const adminAuth = verifyAuth(req, res, { authType: "Admin"});
            if(groupAuth.flag == false && adminAuth.flag == false)
              return res.status(401).json({error : groupAuth.cause});
          }
          
          if(!group)
            return res.status(400).json({ error: "The group does not exist" });

          const members = [];
          const alreadyInGroup = [];
          const membersNotFound = [];
          const valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

          for(const e of membersEmail){
            if (!valid.test(e) && e.length>0){
              return res.status(400).json({ error: "at least one email is not valid!" });
            }
            if(e == ""){
              return res.status(400).json({ error: "at least one email is empty!" });
            }
            const user = await User.findOne({email : e});
            if(user){
              const group = await Group.findOne({members : { $elemMatch : {email: e}}});
              if(group)
                alreadyInGroup.push(e);
              else{
                members.push({email : e, user : user._id});
                toShow.push({email : e});
              }
            }else
              membersNotFound.push(e);
            }

            
          if(members.length==0)
            return res.status(400).json({ error: 'No one can be added to this group' });
    
          //concat the 2 arrays : people already in the group + new people

          const to_insert = inside.concat(members);

          await Group.updateOne({ name : name }, { $set: { members : to_insert }});
          res.status(200).json({ data : {
            group : {name : name, members : toShow},
            alreadyInGroup : alreadyInGroup,
            membersNotFound : membersNotFound
          }, refreshTokenMessage : res.locals.refreshTokenMessage});
      

      } catch (err) {
      res.status(400).json(err.message)
        }
}

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
    export const removeFromGroup = async (req, res) => {
      try {
          //check if contain all the necessary attributes
          //if(!req.params.name){
        //    return res.status(400).json({ error: "You have to insert the group name" });
         // } 
          //const membersEmail = req.body.memberEmails;
          const membersEmail = req.body.emails;
          const name = req.params.name;
        
          if(!name || name == "" || req.url == "/groups/:name/pull" || req.url == "/groups/:name/remove" ){
            return res.status(400).json({ error: "You have to insert the group name" });
          } 

          if(!membersEmail){
            return res.status(400).json({ error: "emails are required" });
          }else{
            if(membersEmail.length<=0)
              return res.status(400).json({ error: "emails are required" });
          }

              const inside = []; 
              const toShow = [];
              const toCheck = [];
  
              const group = await Group.findOne({ name:name});
              if(group){ 
                if(group.members.length===1)
            {
              return res.status(400).json({ error: "The group only exists one member" });
            }
                for(const oneObj of group.members){
                  inside.push(oneObj); //store whole group object
                  toShow.push({email : oneObj.email}); //store whole group object email
                  toCheck.push(oneObj.email);
                }
              }
              if(!group)
                return res.status(400).json({ error: "The group does not exist" });

              //Auth check
            if (req.url === `/groups/${req.params.name}/pull`){
              const adminAuth = verifyAuth(req, res, { authType: "Admin"});
              if (!adminAuth.flag) 
                return res.status(401).json({ error: adminAuth.cause });
            }
            else{
              //const groupAuth = verifyAuth(req, res, { authType: "Group", email: inside.email});
              const groupAuth = verifyAuth(req, res, { authType: "Group", emails: toCheck});
              if(groupAuth.flag === false)
                return res.status(401).json({error : groupAuth.cause});
            }
           // if(!group)
           //     return res.status(400).json({ error: "The group does not exist" });

              const members = [];
              const notInGroup = [];
              const membersNotFound = [];
              const valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
              //check email valid
              for(const oneObj of membersEmail){
                if (!valid.test(oneObj) && oneObj.length>0){
                  return res.status(400).json({ error: "at least one email is not valid!" });
                }
                if(oneObj == ""){
                  return res.status(400).json({ error: "at least one email is empty!" });
                }
                
                  const user = await User.findOne({email : oneObj});
                  if(user){ 
                    const group = await Group.findOne({members : { $elemMatch : {email: oneObj}}});
                     if(group.name!==req.params.name)
                     notInGroup.push(oneObj);
                    else{
                      members.push({email : oneObj, user : user._id});//store RemoveEmail and user ID
                      toShow.push({email : oneObj});//store RemoveEmail
                    }
                  }
                  else
                  {
                    membersNotFound.push(oneObj);
                  }
                }
  
                if(members.length===0)
                return res.status(400).json({ error: "No one can be removed from this group" });
  
              for(let i=0;i<members.length;i++)
              {
                  await Group.updateOne(
                {name: name},
                { $pull: { "members": { email: members[i].email }}} 
              )
              }
            
              for (var i=0; i<inside.length; i++) { 
                for (var j=0; j<members.length; j++) {
                       if (inside[i].email == members[j].email) {
                         inside.splice(i, 1); 
                        } 
                }
           }
           const remaining_members=[];
           for(const oneObj of inside)
           {
            remaining_members.push({email : oneObj.email}); 
           }
              res.status(200).json({ data : {
              group : {name : name, members : remaining_members},
              notInGroup : notInGroup,
              membersNotFound : membersNotFound
            }, refreshTokenMessage : "undefined"});
                
      } catch (err) {
          res.status(400).json(err.message)
      }
  }

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
    export const deleteUser = async (req, res) => {
      try {
           //Authentication
           const adminAuth = verifyAuth(req, res, { authType: "Admin"})
           if (!adminAuth.flag) 
           return res.status(401).json({error: "Unauthorized" });
         const {email}=req.body
         //does not contain all the necessary attributes or one empty string
         if(!email){
           return res.status(400).json({ error: "you have to insert email!" });
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
           //check if the user exists
           const existingUser = await User.findOne({ email:req.body.email});
           //const existingUser = await User.find({ email:req.body.email});
           if (!existingUser) return res.status(400).json({ error: "The user does not exist" });
           //check if admin
           if( await User.findOne({ $and: [{email: req.body.email}, {role : "Admin"} ]})) return res.status(400).json({ error: "The user is an admin" });
           //else{
            //Transaction count
            const existingTrans = await transactions.find({username:existingUser.username});
            let countTrans=0;
            for(let i=0;i<existingTrans.length;i++)
            {
              await transactions.deleteOne({username:existingTrans[i].username})
              countTrans++;
            }
       
          const group = await Group.findOne({members : { $elemMatch : {email: req.body.email}}});
          if(group === null)
            {
              await User.deleteOne({email:req.body.email});
              res.status(200).json({data: {message: "User has been deleted.",deletedTransactions: countTrans, deletedFromGroup: false}, refreshTokenMessage: "undefined"});
            }
        
          //if(group!== null)
          else{
          for(let i=0;i<group.members.length;i++)
          {
            if(group.members[i].email===req.body.email)
           {
            await Group.updateOne(
            {name: group.name},
            { $pull: { "members": { email: req.body.email } } } 
          )
           }
         }
         let groupDelete=false;
         if(group.members.length===1)
          {
            await Group.deleteOne({name:group.name});
            groupDelete=true;
          }
          await User.deleteOne({email:req.body.email});
          res.status(200).json({data: {message: "User has been deleted.",deletedTransactions: countTrans, deletedFromGroup: true, groupDelete: groupDelete}, refreshTokenMessage: "undefined"});
        }
       } catch (err) {
           res.status(400).json(err.message)
       }
    }

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
    export const deleteGroup = async (req, res) => {
      try {
        /*const cookie = req.cookies
          if (!cookie.accessToken || !cookie.refreshToken) {
              return res.status(401).json({ message: "Unauthorized" }) // unauthorized
          }*/
          //Authentication
          const adminAuth = verifyAuth(req, res, { authType: "Admin"})
          if (!adminAuth.flag) 
          return res.status(401).json({error: "Unauthorized" });
          //return res.status(401).json({error: adminAuth.message});
    
        const {name}=req.body
        //does not contain all the necessary attributes or one empty string
        if(!name){
          return res.status(400).json({ error: "you have to insert group name!" });
      }
      //check if the group exists
          const existingGroup = await Group.findOne({ name:req.body.name});
          if (!existingGroup) return res.status(400).json({ error: "The group does not exist" });
          const deletedGroup=await Group.deleteOne({name:req.body.name});
         // res.status(200).json({message: "Group deleted successfully"});
          res.status(200).json({data: {message: "Group deleted successfully",refreshedTokenMessage: "undefined"}});
      } catch (err) {
          res.status(400).json(err.message)
      }
    }