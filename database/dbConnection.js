import mongoose from "mongoose";

const dbConnection=()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName:"PORTFOLIO",
    })
.then(()=>{
    console.log("connected to database");
})
.catch((error)=>{
    console.log(`some error occured while connectio to database:${error}`);
});
};
export default dbConnection;