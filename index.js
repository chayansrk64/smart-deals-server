require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
 
// middleware
app.use(cors());
app.use(express.json());


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
        app.get("/bids", async(req, res) => {
           const email = req.query.email;
            const query = {}
            if(email){
              query.buyer_email = email
            }
            const cursor = bidsCollection.find(query)
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
