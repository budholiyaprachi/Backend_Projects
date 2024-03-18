const express =require('express')
const router=express.Router();
const User = require('../models/user');
const Candidate=require('../models/candidate');
const {jwtAuthMiddleware,generateToken}= require('../jwt');
//const candidate = require('../models/candidate');

const checkAdminRole= async(userId)=>{
 try{
    const user = await User.findById(userId);
        if(user.role === 'admin'){
            return true;
        }
    
}catch(err){
    return false;

 }
}


//to add the candidtae
router.post('/',jwtAuthMiddleware,async(req,res)=>{
    try{
        if(!(await checkAdminRole(req.user.id)))
             return res.status(403).json({message: 'user does not have admin role'});


        const data=req.body //req body contains candidate data
        const newCandidate= new Candidate(data);
        //save newUser to the database
        const response= await newCandidate.save();
        console.log("data saved");
        res.status(200).json({response: response});


    }catch(err){
        console.log(err);
        res.status(500).json({error:'Internal Server Error'});

    }
})


//user can change password route
router.put('/:candidateID',jwtAuthMiddleware,async(req,res)=>
{
    try{
        if(!checkAdminRole(req.user.id))
           return res.status(403).json({message:'user is not admin role'});

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

 //voting
 router.post('/vote/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    //no admin can vote
    //user can only vote once

     candidateID=req.params.candidateID;
    userId=req.user.id;

    try{
        //find candidate documents
        const candidate=await Candidate.findById(candidateID);
        if(!candidate){
          return res.status(403).json({message:'candidate not found'});
        }
        const user=await User.findById(userId);
        if(!user)
        {
            return res.status(403).json({message:'user not found'});
        }
        if(user.role=='admin')
        {
             res.status(403).json({message:'votee is admin or admin is not allowed'});
        }
        if(user.isvoted){
             res.status(400).json({message:'aready voted'});
        }
      
        //update the candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();


        //update the user document
        user.isvoted=true
        await user.save();

        res.status(200).json({message:'vote recorded successfully'});

    }catch(err){
       
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
 });

 //vote count
 router.get('/vote/count',async(req,res)=>{
    try{
        //find all the candidated and sort tem by vote count in desc
        const candidate=await Candidate.find().sort({voteCount:'desc'});

        //Map the candidate to only return their name and vote count
         const voteRecord=candidate.map((data)=>{
            return {
                party:data.party,
                count:data.voteCount
            }
         });

         return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }

 });
 // Get List of all candidates with only name and party fields
router.get('/candidate', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports=router;
