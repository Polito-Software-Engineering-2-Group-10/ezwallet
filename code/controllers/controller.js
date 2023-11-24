import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";
import jwt from 'jsonwebtoken'

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {

        const {type, color} = req.body

        //Authentication
        const verify = verifyAuth(req,res, {authType: "Admin"});
        if(!verify.flag) return res.status(401).json({ message: "Unauthorized" });

        // Check if one of parameter is an empty string
        if (type == "" || color == "" ) return res.status(400).json({ message: "Type and color must not be empty strings"})


        // Check if one parameter is missing
        if( !type || !color ) return res.status(400).json({message : "You must insert both type and color"});

        //Check the constraints
        if(await categories.findOne({type: type })) return res.status(400).json({message : "The category already exists"});
        const new_category = await categories.create({ type: type, color: color });
        return res.status(200).json({data: {type : type, color : color} , refreshedTokenMessage: res.locals.refreshedTokenMessage });
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {
        const {type, color} = req.body;


        // Check authorization
        const adminAuth = verifyAuth(req, res, {authType : "Admin"})
        if (!adminAuth.flag){
            return res.status(401).json({message : "Unauthorized"});
        }

        // Check if attributes are not empty strings
        if (type == "" || color == "" ) return res.status(400).json({ message: "Type and color must not be empty strings"})


        // Check if one parameter is missing
        if( !type || !color ) return res.status(400).json({message : "You must insert both type and color"});


        const existingCategory = await categories.findOne({ type: req.params.type });
        if (existingCategory){
            const categoryToModify = await categories.find( {type: type} )
            if(categoryToModify.length !=0 ) return res.status(400).json({message: "The category in which you want to update is already present!!!"});
            await categories.findOneAndReplace({type: req.params.type},{type: type, color: color});
            const changes = await transactions.updateMany({type : req.params.type}, {type: type});
            return res.status(200).json({data : { message: "Category edited successfully", count: changes.modifiedCount }, refreshedTokenMessage : res.locals.refreshedTokenMessage });
        }else{
            return res.status(400).json({message: "This category does not exist"});
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {
        let changes = 0;
        let isAllCategoories;
        let i;
        const firstCategory = await categories.findOne();

        const adminAuth = verifyAuth(req, res, {authType : "Admin"});
        if(!adminAuth.flag)
            return res.status(401).json({message : "Unauthorized"});

        
        if(!req.body.types || Object.prototype.toString.call(req.body.types) != '[object Array]' || req.body.types.length === 0) return res.status(400).json({message: "The request must contain an array"});

        if(await categories.count()==1) return res.status(400).json({message: "In the DB there is only one category, you cannot delete it"})


        for(i=0; i < req.body.types.length; i++){
            if( req.body.types[i] == "" ) return res.status(400).json({message : "The types inserted must not be empty strings"});

            if((await categories.find({type: req.body.types[i]})).length == 0){
                return res.status(400).json({message: "This category does not exist"})
            }

        }

        (await categories.count({type : {$in : req.body.types}})) === (await categories.count())? isAllCategoories=true : isAllCategoories=false; 
        for(i=0; i < req.body.types.length; i++){
            if(isAllCategoories && firstCategory.type === req.body.types[i] ){
                continue 
            }
            await categories.deleteOne({type: req.body.types[i]});
        }
        

        for(i= 0; i < req.body.types.length; i++){
            if(isAllCategoories && firstCategory.type === req.body.types[i]){
                continue 
            }
            changes += (await transactions.updateMany({type : req.body.types[i]},{type: (await categories.findOne()).type})).modifiedCount;
        }
        return res.status(200).json( { data: {message: "Categories deleted", count: changes }, refreshedTokenMessage: res.locals.refreshedTokenMessage } );
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {
        const auth = verifyAuth(req, res, {authType: "Simple"})
        if (!auth.flag) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        let data = await categories.find({})
        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

        return res.status(200).json({data : filter, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
        if (!userAuth.flag) {
            return res.status(401).json({ error: userAuth.cause }) // unauthorized
        }

        const { username, amount, type } = req.body;

        if(username === undefined || amount === undefined || type === undefined){
            return res.status(400).json({error: "You should provide username, amount and type values"});
        }

        if(username === "" || amount === "" || type === ""){
            return res.status(400).json({error: "Username, amount and type values cannot be the empty string"});
        }

        // Check if the category exists
        const categoryExists = await categories.findOne({ type: type });
        if (!categoryExists) {
            return res.status(400).json({ error: 'Category not found' });
        }

        // Check if the user (body) exists
        const userBodyExists = await User.findOne({ username: username });
        if (!userBodyExists) {
            return res.status(400).json({ error: 'User of the body not found' });
        }

        // Check if the user (URL) exists
        const userURLExists = await User.findOne({ username: req.params.username });
        if (!userURLExists) {
            return res.status(400).json({ error: 'User of the URL not found' });
        }

        if(username != req.params.username){
            return res.status(400).json({error: "Usernames in the URL and in the body don't match"})
        }

        const isFloat = /^-?(?!0\d+)\d+(\.\d+)?$/.test(amount);
        if(!isFloat){
            return res.status(400).json({error: "The amount is not a valid float number (negative number are accepted)"});
        }

        const new_transactions = new transactions({username, type, amount });
        const myData = await new_transactions.save()
        return res.status(200).json({data: {username: myData.username, amount: myData.amount, type: myData.type, date: myData.date}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (!adminAuth.flag) {
            return res.status(401).json({ error: adminAuth.cause }) // unauthorized
        }
        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */
        const result = await transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ])
        let myData = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
        return res.status(200).json({data: myData, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    try {

        const query_parameters_time = handleDateFilterParams(req);
        const query_parameters_amount = handleAmountFilterParams(req);
        const query_parameters = {...query_parameters_time, ...query_parameters_amount};

        const URLusername = req.params.username;

        // Check if the username exists
        const userExists = await User.findOne({ username: URLusername });
        if (!userExists) {
            return res.status(400).json({ error: 'User not found' });
        }

        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {

            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (adminAuth.flag) {
                
                const result = await transactions.aggregate([
                  {
                    $match: { username: URLusername },
                  },
                  {
                    $lookup: {
                      from: "categories",
                      localField: "type",
                      foreignField: "type",
                      as: "transactions_info",
                    },
                  },
                  {
                    $unwind: "$transactions_info",
                  },
                ]);  
                let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
                return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            } 
            else {
                res.status(401).json({ error: adminAuth.cause});
            }            
            
        } else {

            const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });

            if(userAuth.flag){
                query_parameters.username = URLusername;

                const result = await transactions.aggregate([
                    {
                        $match: query_parameters
                    },
                    {
                        $lookup: {
                            from: "categories", 
                            localField: "type", 
                            foreignField: "type", 
                            as: "transactions_info" 
                        }
                    },
                    {
                        $unwind: "$transactions_info"
                    }
                ])
                let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
                return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});

            }
            else{
                return res.status(401).json({error: userAuth.cause});
            }

            
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {

        const query_parameters = {username: req.params.username, type: req.params.category};


        // Check if the username exists
        const userExists = await User.findOne({ username: query_parameters.username });
        if (!userExists) {
            return res.status(400).json({ error: 'User not found' });
        }
        // Check if the category exists
        const categoryExists = await categories.findOne({ type: query_parameters.type });
        if (!categoryExists) {
            return res.status(400).json({ error: 'Category not found' });
        }

        //Distinction between route accessed by Admins or Regular users for functions that can be called by both
        //and different behaviors and access rights
        if (req.url.indexOf("/transactions/users/") >= 0) {

            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (adminAuth.flag) {

                const result = await transactions.aggregate([
                    {
                        $match: query_parameters 
                    },
                    {
                        $lookup: {
                        from: "categories", 
                        localField: "type", 
                        foreignField: "type", 
                        as: "transactions_info" 
                        }
                    },
                    {
                        $unwind: "$transactions_info"
                    }
                    ])
                    let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
                    return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});
            } 
            else {
                res.status(401).json({ error: adminAuth.cause})
            }            
            
        } else {

            const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });

            if(userAuth.flag){    

                const result = await transactions.aggregate([
                    {
                        $match: query_parameters
                    },
                    {
                        $lookup: {
                            from: "categories", 
                            localField: "type", 
                            foreignField: "type", 
                            as: "transactions_info" 
                        }
                    },
                    {
                        $unwind: "$transactions_info"
                    }
                ])
                let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
                return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});

            }
            else{
                return res.status(401).json({error: userAuth.cause});
            }

            
        }

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {

        // Check if the group exists
        const groupExists = await Group.findOne({ name: req.params.name });
        if (!groupExists) {
            return res.status(400).json({ error: 'Group not found' });
        }


        if(req.url.indexOf("/transactions/groups/") >= 0){
            //Admin

            const adminAuth = verifyAuth(req, res, { authType: "Admin" });

            if(!adminAuth.flag){ 
                    
                return res.status(401).json({error: adminAuth.cause});

            }
        }
        else{
            //User

            const groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupExists.members.map(m => m.email)});

            if(!groupAuth.flag){

                return res.status(401).json({error: groupAuth.cause});

            }
        }

        const emails = groupExists.members.map(m => m.email);

        const usernames = (await User.find({email: {$in: emails}}, { username: 1, _id: 0 })).map(u => u.username);

        const result = await transactions.aggregate([
            {
                $match: {username: { $in: usernames }}
            },
            {
                $lookup: {
                from: "categories", 
                localField: "type", 
                foreignField: "type", 
                as: "transactions_info" 
                }
            },
            {
                $unwind: "$transactions_info"
            }
            ])
            let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
            return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {

        // Check if the group exists
        const groupExists = await Group.findOne({ name: req.params.name });
        if (!groupExists) {
            return res.status(400).json({ error: 'Group not found' });
        }

        // Check if the group exists
        const categoryExists = await categories.findOne({ type: req.params.category });
        if (!categoryExists) {
            return res.status(400).json({ error: 'Category not found' });
        }


        if(req.url.indexOf("/transactions/groups/") >= 0){
            //Admin

            const adminAuth = verifyAuth(req, res, { authType: "Admin" });

            if(!adminAuth.flag){ 
                    
                return res.status(401).json({error: adminAuth.cause});

            }
        }
        else{
            //User

            const groupAuth = verifyAuth(req, res, { authType: "Group", emails: groupExists.members.map(m => m.email)});

            if(!groupAuth.flag){

                return res.status(401).json({error: groupAuth.cause});

            }
        }

        const emails = groupExists.members.map(m => m.email);

        const usernames = (await User.find({email: {$in: emails}}, { username: 1, _id: 0 })).map(u => u.username);

        const result = await transactions.aggregate([
            {
                $match: {username: { $in: usernames }, type: req.params.category}
            },
            {
                $lookup: {
                from: "categories", 
                localField: "type", 
                foreignField: "type", 
                as: "transactions_info" 
                }
            },
            {
                $unwind: "$transactions_info"
            }
            ])
            let info_array = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, date: v.date, color: v.transactions_info.color }))
            return res.status(200).json({data: info_array, refreshedTokenMessage: res.locals.refreshedTokenMessage});

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username });
        if (!userAuth.flag) {
            return res.status(401).json({ error: userAuth.cause }) // unauthorized
        }

        if(!req.body._id){
            return res.status(400).json({error: "You must specify the id of the transaction to be deleted"});
        }

        // Check if the user (URL) exists
        const userURLExists = await User.findOne({ username: req.params.username });
        if (!userURLExists) {
            return res.status(400).json({ error: 'User of the URL not found' });
        }

        const transactionExists = await transactions.findOne({_id: req.body._id});
        if(!transactionExists){
            return res.status(400).json({error: "The id that you provided does not represent a transaction"});
        }

        const refreshToken = jwt.verify(req.cookies.refreshToken, process.env.ACCESS_KEY)
        if(transactionExists.username != refreshToken.username){
            return res.status(400).json({error: "You are not the owner of the transaction, you cannot delete it"})
        }

        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.status(200).json({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage});
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
    export const deleteTransactions = async (req, res) => {
        try {
            //Authentication
            const adminAuth = verifyAuth(req, res, { authType: "Admin"})
            if (!adminAuth.flag) 
            //return res.status(401).json({message: "Admin Unauthorized." });
            return res.status(401).json({error: "Unauthorized"});
            
            const {_ids}=req.body
            //does not contain all the necessary attributes
            if(!_ids){
            return res.status(400).json({ error: "You have wrong attribute" });
             }
            //At least one of the ids in the array does not exist in the database or exist empty string
            let exist=true;
            for(let i=0; i < req.body._ids.length; i++){
                if((req.body._ids[i]==="") || (!await transactions.findOne({_id: req.body._ids[i]})))
                      exist=false;
              }
              if(exist===false)
              {
                return res.status(400).json({error: "Some transactions do not exist or empty string exists."})
              }
             else{
                for(let i=0; i < req.body._ids.length; i++){
               await transactions.deleteOne({_id : req.body._ids[i]});
             } 
            }
            return res.status(200).json({data: {message: "Transactions deleted.",refreshedTokenMessage: "undefined"}});
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }
