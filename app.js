const auth = require('./middleware/auth')
const express = require("express");
let bodyparser = require("body-parser");
const mongoose = require("mongoose");
const env= require('dotenv').config()

const jwt = require('jsonwebtoken');
const bcrypt=require('bcrypt');
const saltRounds=10;


const app = express();
app.use(express.json());
// app.use(express.urlencoded());

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect("mongodb+srv://amarshissal224:"+process.env.MONGOPASS+"@cluster0.brma3iz.mongodb.net/userDB", { useNewUrlParser: true })
  .catch((error) => console.error("error connecting DB", error));
mongoose.connection.on("connected", () => {
  console.log("Connected to DB...");
});



const userSchema = new mongoose.Schema({
    name:String,
    email: {
      type: String,
      required: [true, "Please Enter email"],
      unique:true
    },
    password: {
      type:String,
      required:[true,"Enter Password"]
    },
    secrets:String
  });
  



  const User= mongoose.model("User", userSchema);


app.get('/',function(req,res){
    res.render("home");
});

app.get('/register',function(req,res){
    res.render("register",{getregisterError:""});
});

app.get('/login',function(req,res){
    res.render("login",{getError:""});
});


// app.post('/secrets',auth,function(req,res){

//  res.render('submit')
// })

app.get('/secrets',auth,function(req,res){
  
  User.find({secrets:{$ne:null}}).then((foundUser)=>{


    res.render('secrets',{ token: req.query.token,usersecrets:foundUser})
  })

})

app.post('/submit',auth,function(req,res){
  let submittedSecret =req.body.field

  User.findOne({email:req.user.email}).then((result)=>{
    result.secrets = submittedSecret;
    result.save().then(()=>{
      res.send('Sucessfully Added')
    }).catch((e)=>{
      res.send("failed")
    })

  })

 


 
});
 
app.get('/submit',auth,function(req,res){
 
  res.render('submit',{token: req.query.token})
 
})



app.post("/register", function(req,res){
  User.findOne({email:req.body.username}).then((result)=>{
    if(result){
      res.render("register",{getregisterError:"User with this email already exists"});
    }
  }
  
  )
  if(req.body.Name==="" || req.body.password===""){
    res.render("register",{getregisterError:"Please Enter all Details"});

  }else{
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
      const newUser = new User({
        name:req.body.Name,
        email:req.body.username,
        password:hash
    })
    User.find({secrets:{$ne:null}}).then((foundUser)=>{
      
      
    const token =jwt.sign({email:req.body.username }, process.env.JWTKEY);
    newUser.save().then(()=>res.header('x-auth-token',token).render("secrets",{token:token,usersecrets:foundUser})).catch((e)=>console.log(e.message));
    
    })
    })
}})

app.post("/login",function(req,res){
   let username=req.body.username;
   let password=req.body.password;
    User.findOne({email:username})
   .then((result)=>{
  
    if(!result){
      console.log("No email registerd");
      res.render('login',{getError:"UserId or Password does not match"})
    }
    else{
       
       bcrypt.compare(password,result.password,function(err,ress){
        if(ress==true){
          const token =jwt.sign({email:username }, process.env.JWTKEY);
      
          res.header('x-auth-token',token).redirect(`/secrets?token=${token}`)
          console.log('login suceccfully' );
        }
        else{
          console.log('wrong password');
          res.render('login',{getError:"UserId or Password does not match"})
        }

       })
        
      } }).catch((e)=>{console.log("error with DB",e);});
    })

    


app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
  
