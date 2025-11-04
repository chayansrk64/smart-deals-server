require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;



// firebase admin sdk
const serviceAccount = require("./smart-deals-6d1d6-firebase-admin-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

 
// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log('logger info:');
  next()
}

const verifyFirebaseToken = async(req, res, next) => {
  
  if(!req.headers.authorization){
    return res.status(401).send({message: "Unauthorized Access!"})
  } 
  const token = req.headers.authorization.split(' ')[1]

  if(!token){
    return res.status(401).send({message: 'Unauthorized Access!'})
  }

  try{
    const userInfo = await admin.auth().verifyIdToken(token)
    req.token_email = userInfo.email;
    console.log('after user validation', userInfo);
    next()
  }
  catch{
    return res.status(401).send({message: "Unauthorized Access!"})
  }



  
}


const db_user = process.env.DB_USER;
const db_pass = process.env.DB_pass;



const uri =
  `mongodb+srv://${db_user}:${db_pass}@cluster0.hkduy2w.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



app.get("/", (req, res) => {
  res.send("SMART SERVER IS RUNNING...");
});



async function run () {
    try{
        // connect the client to the server
        await client.connect();

        const database = client.db("smart_db")
        const productsCollection = database.collection("products")
        const bidsCollection = database.collection("bids")
        const usersCollection = database.collection("users")



      // JWT related apis
      app.post("/getToken", (req, res) => {
        const loggedUser = req.body;
        console.log(loggedUser);
        const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {expiresIn: "1h"})
        res.send({token: token})
      })


        app.post("/users", async(req, res) => {
           const newUser = req.body;
           const email = req.body.email;
           const query = {email: email}
           const existingUser = await usersCollection.findOne(query)

           if(existingUser){
              res.status(409).json({message: "User Already Exists!"})
           } else{
             const result = await usersCollection.insertOne(newUser)
             res.send(result)
           }

        })

        app.get("/products", async(req, res) => {
            // const cursor = productsCollection.find().sort({price_min: 1}).skip(3).limit(2)
            const email = req.query.email;
            const query = {}
            if(email){
              query.email = email
            }
             
            const cursor = productsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/latest-products", async(req, res) => {
            const cursor = productsCollection.find().sort({created_at: -1}).limit(6)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/products/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id: id}
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        app.post("/products", async(req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct)
            res.send(result)
        })

        app.patch("/products/:id", async(req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const query = {_id: new ObjectId(id)}
            const update = {
              $set: {
                  ...updatedProduct
              }
            }
            const result = await productsCollection.updateOne(query, update)
            res.send(result)
        })

        app.delete("/products/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })





        
        // bids related APIs ============

        app.get("/bids", logger, verifyFirebaseToken, async(req, res) => {
          console.log("token", req);
           const email = req.query.email;
            const query = {}

            if(email){
              if(email !== req.token_email){
                 return res.status(403).send({message: "Forbidden Access!"})
              }
              query.buyer_email = email
            }

            const cursor = bidsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/products/bids/:productId", verifyFirebaseToken, async(req, res) => {
            const productId = req.params.productId;
            const query = {product: productId}
            const cursor = bidsCollection.find(query).sort({bid_price: -1})
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post("/bids", async(req, res) => {
            const newBid = req.body;
            const result = await bidsCollection.insertOne(newBid)
            res.send(result)
        })

        app.delete("/bids/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await bidsCollection.deleteOne(query)
            res.send(result)
        })

        app.get("/bids/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await bidsCollection.findOne(query)
            res.send(result)
        })

        // send a ping for successful connection
        await client.db("admin").command({ ping: 1 })
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally{
        //  await client.close();
    }
}

run().catch(console.dir);



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})



// client.connect()
//   .then(() => {
//     app.listen(port, () => {
//       console.log(`Server is running on port: ${port}`);
//     });
//   })
//   .catch((error) => console.dir(error));
