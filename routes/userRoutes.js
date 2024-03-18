const express =require('express')
const router=express.Router();
const user=require('./../models/user');
const {jwtAuthMiddleware,generateToken}= require('./../jwt');



router.post('/signup',async(req,res)=>{
    try{
        const data=req.body;
        const newUser= new user(data);
        //save newUser to the database
        const response= await newUser.save();
        console.log("data saved");

        const payload={
            id:response.id
        }
        console.log(JSON.stringify(payload));
        const token=generateToken(payload);
        console.log("Token is:", token);

        res.status(200).json({response:response,token:token});


    }catch(err){
        console.log(err);
        res.status(500).json({error:'Internal Server Error'});

    }
})

//login route
router.post('/login',async(req,res)=>{
    try{
    const {aadhar,password}=req.body
    //find the user by aadhar number
    const user = await user.findOne({aadhar:aadhar});
    //if user doesnt exist or pass doent match return err
    if(!user || !(await user.comparePassword(password)))
    {
        return res.status(500).json({error:'Internal Server Error'});
    }
    //generate token
    const payload={
        id:user.id
    }
    const token=generateToken(payload);
    //return token as respose
    res.json(token);
}catch(err)
{
    console.error(err);
    return res.status(500).json({error:'Internal Server Error'});

}
})

//profile route
router.get('/profile',jwtAuthMiddleware,async(req,res)=>{
     try{
        const userData=req.user;
        const userId=userData.id;
        const user=await user.findById(userId);
        res.status(200).json({user});


     }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal Server Error'});

     }
})
//user can change password route
router.put('/profile/password',jwtAuthMiddleware,async(req,res)=>
{
    try{
        const userId=req.user.id; //extracting id from token
        const{currPassword,newPassword}=req.body //extract curr and new pass from req body
        //check user bu userid
        const user = await user.findById(userId);
        //if pass doesnt match return err
        if(!(await user.comparePassword(currPassword)))
    {
        return res.status(500).json({error:'Invalid username or pasword'});
    }
    //update the users pass
    user.password=newPassword;
    await user.save();
    console.log('password updated');
    }catch(err){
        console.error(err);
        return res.status(500).json({error:'Internal Server Error'});
    }
})
module.exports=router;
