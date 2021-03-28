const express = require('express')
const app = express()
const port = 8080
const bodyParser=require('body-parser');
const cors=require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q17pz.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const serviceAccount = require("./configs/burj-al-arab-after-auth-a11ab-firebase-adminsdk-hg05l-62539d28e1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send('Hello World');
})

client.connect(err => {
    let idToken;
  const bookings = client.db("burjAlArab").collection("bookings");
  app.post('/addBooking',(req,res)=>{
      const newBooking=req.body;
      bookings.insertOne(newBooking)
      .then(result=>{
          res.send(result.insertedCount>0)
      })
      
  })

  app.get('/bookings',(req,res)=>{
      const bearer=req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
        idToken=bearer.split(' ')[1];
        // idToken comes from the client app
        admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
        const tokenEmail = decodedToken.email;
        const queryEmail=req.query.email;
        if(tokenEmail==queryEmail){
            bookings.find({email: queryEmail})
            .toArray((err,documents)=>{
                res.status(200).send(documents)
            })
        }
        else{
            res.status(401).send('unauthorized access')
        }
        // ...
        })
        .catch((error) => {
        // Handle error
        res.status(401).send('unauthorized access')
        });
      }
      else{
          res.status(401).send('unauthorized access')
      }


      


  })
});


app.listen(process.env.PORT || port)