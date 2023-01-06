const fs = require('fs')
require("dotenv").config();
const cors = require("cors" )
const path = require('path')
const axios = require("axios")
const helmet = require("helmet")
const cheerio = require("cheerio")
const express = require("express");
const passport = require("passport")
const {google} = require("googleapis")
// const nodemailer = require("nodemailer")
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session")
const {Strategy} = require("passport-google-oauth20");

const PORT = process.env.PORT||5000
const app = express();

const config = {
  CLIENT_ID : process.env.CLIENT_ID,
  CLIENT_SECRET : process.env.CLIENT_SECRET,
  SESSION_KEY : process.env.SESSION_KEY
}

const auth_options = {
  callbackURL:"/auth/google/callback",
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  passReqToCallback: true
}

//create middlewares

let log={};

function verifyCallback(req, accesToken,refreshToken,profile,done){
  // fs.writeFileSync(path.join(__dirname,'data.json'),  JSON.stringify(profile._json))
  log = profile;
  done(null,profile)
  
}
function checkAuth(req, res, next){
  if(!(log // 👈 null and undefined check
  && Object.keys(log).length === 0
  && Object.getPrototypeOf(log) === Object.prototype)){
    if(log._json.email.includes("@iitrpr.ac.in")){
      const auth =new google.auth.GoogleAuth({
        keyFile : "cred.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
      })
      const client = auth.getClient();
      
      const googlesheets = google.sheets({version:"v4",auth: client})
      
      const spreadsheetId = "1lksymVWnJKKtk56QLfoKCH2RQW-kOUbHdbmhJbhVrtY"
      googlesheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range:"data of SoftCom members!A:C",
        valueInputOption:"USER_ENTERED",
        resource:{
          values:[
            [`${log.displayName}`,`${log._json.email}`]
          ]
        }})
      // console.log(log._json,"it is fine here but google api works?....HELL YEAH")
      log = {}
      next();
    }
  }else{
    res.redirect('/auth/google');
  }
}


//use middlewares
passport.use(new Strategy(auth_options,verifyCallback))

passport.serializeUser((user,done)=>{
  done(null,user)
})
passport.deserializeUser((obj,done)=>{
  done(null,obj)
})
app.use(
cors({
  // origin:"http://arpitverma.me",
  // origin:"http://127.0.0.1:5500",
  origin:"https://softcom-admin.github.io",
  // origin:"iitrpr.ac.in"
})
  )
app.use(cookieParser())  

app.use(helmet())
app.use(cookieSession({
  name:'session',
  maxAge:1000*60*60*24,
  keys:["secret","secretkey"],
  SameSite:'none',
  secure:"true"
}))
app.use(passport.initialize())
app.use(passport.session())




//auth

app.get("/auth/google",passport.authenticate('google',{
  scope: ['email', 'profile'], 
  session:true
}),(req,res)=>{
  console.log("Authenticated")
  res.send("Authenticated");
})

app.get("/auth/google/callback",passport.authenticate('google',{
  failureRedirect:'/',
  successRedirect:'https://softcom-api-h7ra.onrender.com/join',
  // successRedirect:'http://localhost:5000/join',
  session:true
}),(req,res)=>{
  
})



//endpoint
app.get('/lol',(req,res)=>{
 
  res.sendFile(path.join(__dirname,'./join/lol.html'))


})

app.get('/join',checkAuth, (req,res)=>{
   res.sendFile(path.join(__dirname,'./join/join.html'))

})



//announcements and events endpoint
app.get("/announcements",async (req,res)=>{
  const auth =new google.auth.GoogleAuth({
    keyFile : "cred.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
  })
  const client = await auth.getClient();

  const googlesheets = google.sheets({version:"v4",auth: client})

  const spreadsheetId = "1kCYRayvIfynBtycMEpyFTcoa5UC5XipLNxg6V7miR_4"
  
  const getRowsForAnnouncements = await googlesheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range:"Announcements"
  })
res.json(getRowsForAnnouncements.data.values)
})

//join as a member in the database
// console.log(data)






// comic endpoint yea!
app.get('/comic',(req,res)=>{
  const random_int = Math.floor(Math.random() * 2500);
  axios.get(`https://xkcd.com/${random_int}/`)
  .then((response)=>{
      const html = response.data
      const $ = cheerio.load(html)//$(".itemListElement")
      const comic_img = $("#middleContainer")
      const url = comic_img.find("a")
      .next()
      .next()
      .text()
      res.json(url)
    


  }).catch((err)=> console.log(err))
})








app.get('/',(req,res)=>{
  res.json("he110 w0r1d")
})


// //nodemailer (stopping this cause behaving stupidly)
// let transporter = nodemailer.createTransport({
//   service: 'outlook',
//   auth: {
//     user: 'softcom30t@outlook.com',
//     pass: 'softcom@botmailer23',
//   }
// });
// url = {
//   webdev : "https://www.youtube.com/watch?v=QA0XpGhiz5w",
//   gamedev : "https://www.youtube.com/watch?v=5M7vX_z6B9I&list=PLBIb_auVtBwBkYGKni2wKHGVFP5b4pVwj",
//   appdev : "https://developer.android.com/courses/android-basics-compose/course",
//   python : "https://www.youtube.com/watch?v=QXeEoD0pB3E&list=PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3",

// }
// let message = {
//   from: 'Nodemailer <example@nodemailer.com>',
//   to: 'Nodemailer <example@nodemailer.com>',
//   subject: 'AMP4EMAIL message',
//   text: 'For clients with plaintext support only',
//   html: '<p>For clients that do not support AMP4EMAIL or amp content is not valid</p>',
//   amp: `<!doctype html>
//   <html ⚡4email>
//     <head>
//       <meta charset="utf-8">
//       <style amp4email-boilerplate>body{visibility:hidden}</style>
//       <script async src="https://cdn.ampproject.org/v0.js"></script>
//       <script async custom-element="amp-anim" src="https://cdn.ampproject.org/v0/amp-anim-0.1.js"></script>
//     </head>
//     <body>
//       <p>Image: <amp-img src="https://cldup.com/P0b1bUmEet.png" width="16" height="16"/></p>
//       <p>GIF (requires "amp-anim" script in header):<br/>
//         <amp-anim src="https://cldup.com/D72zpdwI-i.gif" width="500" height="350"/></p>
//     </body>
//   </html>`
// }
// let mailOptions = {
//   from: "softcom30t@outlook.com",
//   to: `${data.email}`,
//   // cc:"softcom@iitrpr.ac.in",
//   subject: 'Hey there! Thank you for joining SoftCom',
//   text: `Let us begin your software developement journey and create wonderful projects! here are the resources for you:
//   Web-Dev - ${url.webdev}
//   App-Dev - ${url.appdev}
//   Game-Dev - ${url.gamedev}
//   Python - ${url.python}
  
//   `
  
// };

// transporter.sendMail(mailOptions, function(err, data) {
//   if (err) {
//     console.log("Error " + err);
//   }
// });
  


app.listen(PORT,()=>{
    console.log(`server is litening on port ${PORT}...`)
})