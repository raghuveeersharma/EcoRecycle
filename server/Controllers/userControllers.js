import bcrypt from 'bcryptjs';
import User from '../Models/userModel.js';
export const Signup=async(req,res)=>{
    try{
        const {name,email,password}=req.body;
        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(password,salt);
        const user = new User({
            name,
            email,
            password:hashPass
        });
        await user.save();
        console.log("User registered");
        res.status(200).json({success:true});
    }catch(err){
        console.log(err);
        res.status(500).json({success:false});
    }

}

export const Login = async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user = await
        User.findOne({email});
        if(!user){
            return res.status(400).json({success:false});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({success:false});
        }
        console.log("User logged in");
        res.status(200).json({success:true});
    }catch(err){
        console.log(err);
        res.status(500).json({success:false});
    }
}