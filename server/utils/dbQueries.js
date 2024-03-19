
const User= require("./../models/User");

const addFollowersFields= async(req, res)=>{
    await User.updateMany({}, {$set: {followers:[]}}).then(result=>{
        console.log("Updated all docs");
        // return res.json({message: "Documents updated"});
    }).catch((err)=>{
        console.log("Error")
        // return res.json({message: "Error when updating Documents"});
    });
}
const addFollowingFields= async(req, res)=>{
    await User.updateMany({}, {$set: {following:[]}}).then(result=>{
        console.log("Updated all docs");
        // return res.json({message: "Documents updated"});
    }).catch((err)=>{
        console.log("Error");
        // return res.json({message: "Error when updating Documents"});
    });
}

module.exports= {
    addFollowersFields,
    addFollowingFields
}