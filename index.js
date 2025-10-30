require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;
 
// middleware
app.use(cors());
app.use(express.json());

// smartDBusers
// B0ihROpX8DNg2EII
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


        app.post("/products", async(req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct)
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
