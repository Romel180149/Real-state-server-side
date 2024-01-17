require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken')
// require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000


// middleware
app.use(cors())
app.use(express.json())

// console.log(process.env.STRIPE_SECRET_KEY)
// import database connection

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pzs7tdj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db('Bery_DB').collection('users')
    const propertyCollection = client.db('Bery_DB').collection('property')
    const reviewsCollection = client.db('Bery_DB').collection('review')
    const wishlistCollection = client.db('Bery_DB').collection('wishlist')
    const propertyBoughtCollection = client.db('Bery_DB').collection('property_bought')
    const paymentCollection = client.db('Bery_DB').collection('payments')

    // JWT related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      
      
      res.send({ token })
    })
    

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized  access' })
        }
        req.decoded = decoded;
        next()
      })
    }

    // use verify admin after verifyToken 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }
   

    // ------------------------------------------ Users related API Starts ----------------------------------------
    app.get('/allUsers', verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.get('/users', async (req, res) => {
      const userEmail = req.query.email
      const query = { email: userEmail }
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })

    // check if user is admin for dynamically set the the accessibility of dashboard navigation
    app.get('/allUsers/admin/:email', verifyToken, async (req, res, next) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin })
    })
    // check if user is agent for dynamically set the accessibility of dashboard navigation
    app.get('/allUsers/agent/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let agent = false
      if (user) {
        agent = user?.role === 'agent';
      }
      res.send({ agent })
    })

    app.post('/users', async (req, res) => {
      const userInfo = req.body
      // inserrt email if user doesn't exist:
      // you can do this many ways (1. unique email, 2. Upsert 3.simple checking)
      const query = { email: userInfo.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedID: null })
      }
      const result = await usersCollection.insertOne(userInfo)
      res.send(result)
    })
    // user admin role Control API
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    // user Agent role Control API
    app.patch('/users/agent/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'agent'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    // user Delete button control API
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })
    // ------------------------------------------ Users related API Ends ----------------------------------------


    // ------------------------------------------ All properties related API starts ----------------------------------------
    // All properties data API calls
    app.get('/property', async (req, res) => {
      const result = await propertyCollection.find().toArray()
      res.send(result)
    })
    // post on all properties from add property route of agents dashboard
    app.post('/property', async (req, res) => {
      const property = req.body;
      const result = await propertyCollection.insertOne(property)
      res.send(result)
    })

    app.patch('/property/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateProperty = req.body;
      const result = await propertyCollection.updateOne(filter, { $set: updateProperty })
      res.send(result)
    })

    // delete a property from all properties for agent dashboard my properties route
    app.delete('/property/:id', async (req, res) => {
      const propertyID = req.params.id
      const query = { _id: new ObjectId(propertyID) }
      const result = await propertyCollection.deleteOne(query)
      res.send(result)
    })


    // Get one property by id
    app.get('/property/:id', async (req, res) => {
      const propertyID = req.params.id
      const query = { _id: new ObjectId(propertyID) }
      const result = await propertyCollection.findOne(query)
      res.send(result)
    })


    // Verification_status========{Verified} properties status control API
    app.patch('/property/verify/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          verification_status: 'Verified'
        }
      }
      const result = await propertyCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    // Verification_status========{Regected} properties status control API
    app.patch('/property/reject/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          verification_status: 'Rejected'
        }
      }
      const result = await propertyCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })






  -------------------------------




    // ------------------------------------------ All Reviews related API Starts ----------------------------------------
    // All reviews data API calls
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })

    app.post('/reviews', async (req, res) => {
      const reviewItem = req.body
      const result = await reviewsCollection.insertOne(reviewItem)
      res.send(result)
    })

    app.delete('/reviews/:id', async (req, res) => {
      const reviewID = req.params.id
      const query = { _id: new ObjectId(reviewID) }
      const result = await reviewsCollection.deleteOne(query)
      res.send(result)
    })
    // ------------------------------------------ All Reviews related API Ends ----------------------------------------


    // ----------------------- Wishlist Related API Starts --------------------
    // get properties of wishlist firn wishlist API
    app.get('/allWishlist', async (req, res) => {
      const result = await wishlistCollection.find().toArray();
      res.send(result)
    })
    app.get('/wishlist', async (req, res) => {
      const email = req.query.email;
      const query = { wishUserEmail: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    // add properties to wishlist
    app.post('/wishlist', async (req, res) => {
      const wishItem = req.body
      const result = await wishlistCollection.insertOne(wishItem)
      res.send(result)
    })
    //delete property from wishlist
    app.delete('/wishlist/:id', async (req, res) => {
      const wishID = req.params.id
      const query = { _id: new ObjectId(wishID) }
      const result = await wishlistCollection.deleteOne(query)
      res.send(result)
    })
    // ----------------------- Wishlist Related API Ends --------------------




    // ---------------------------------- Property Bought API starts (Offered API) --------------------------------
    // get offered properties in property bought list API
    app.get('/allProperty_bought', async (req, res) => {
      const result = await propertyBoughtCollection.find().toArray()
      res.send(result)
    })

    // get offered properties in property bought list by USER email
    app.get('/property_bought', async (req, res) => {
      const email = req.query.email
      const query = { BuyerEmail: email }
      const result = await propertyBoughtCollection.find(query).toArray();
      res.send(result)
    })

    // add offered properties to property bought list
    app.post('/property_bought', async (req, res) => {
      const offeredProperty = req.body
      const result = await propertyBoughtCollection.insertOne(offeredProperty)
      res.send(result)
    })
    // ---------------------------------- Property Bought API Ends (Offered API) --------------------------------

    // ---------- Get Requested Properties related API ===> Property Bought API Ends (Offered API) starts ---------------
    app.get('/requestedProperties', async (req, res) => {
      const email = req.query.email
      const query = { Agent_email: email }
      const result = await propertyBoughtCollection.find(query).toArray();
      res.send(result)
    })

    // requested properties status control API
    app.patch('/requestedProperties/accept/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'accepted'
        }
      }
      const result = await propertyBoughtCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    app.patch('/requestedProperties/reject/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'rejected'
        }
      }
      const result = await propertyBoughtCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    // ---------- Get Requested Properties related API ===> Property Bought API Ends (Offered API) ends ---------------

    // Payment intent
    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      try {
        const { price } = req.body;
        const amount = price * 100;

        const paymentIntent = await stripe.paymentIntents.create({
          currency: 'usd',
          amount: amount,
          payment_method_types: [
            "card"
          ]

        })
        res.send({
          clientSecret: paymentIntent.client_secret,
        });


      } catch (error) {
        res.send({
          success: false,
          error: error.message

        })
      }
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const query = { _id: new ObjectId(payment.boughtID) }
      const updateDoc = {
        $set: {
          status: payment.status,
          transactionID: payment.transactionId
        },
      };
      const paymentResult = await paymentCollection.insertOne(payment);
      const statusResult = await propertyBoughtCollection.updateOne(query, updateDoc);
      console.log('payment info', payment)
      res.send({ paymentResult, statusResult });
    })

    app.get('/payments', async (req, res) => {
      const email = req.query.email;
      const query = { Agent_email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('bery server is running')
})

app.listen(port, () => {
  console.log('bery server is listening on port', port)
})