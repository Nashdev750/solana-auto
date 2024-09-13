require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fetch = require('axios');

const app = express();
const port = 4000;


const sol = "So11111111111111111111111111111111111111112"
const mainwallet = "8R5brRqNa1CDMtcQRaLPQfJeLBrtyqpjDPTSKbBvmsna"

const actions = ["INIT_SWAP","SWAP","TRANSFER"]

mongoose.connect(process.env.CONNECTIONSTRING).then(()=>{
    console.log("connected")
});

const itemSchema = new mongoose.Schema({
    name: String
});
const transactionSchema = new mongoose.Schema({
    type: Boolean,
    type2: String,
    from: String,
    to:String,
    description: String,
    Date: Date,
    open: Boolean
});

const Item = mongoose.model('Item', itemSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
    const items = await Item.find();
    res.render('index', { items });
});


app.post('/webhook', async (req, res)=>{
    const data = req.body[0]

    // if(!actions.includes(data.type)) return
    const transfers = data.tokenTransfers
    let buy = true
    // if(transfers.length != 2) return

    if(transfers[0].mint != sol) buy = false 

    await Transaction.create({
        type: buy,
        type2: data.type,
        from: transfers[0].mint,
        to:transfers[1].mint,
        description: data.description,
        Date: new Date(),
        open: true
    })

    // if(buy && transfers[1].toUserAccount != mainwallet) return
    
    // if(!buy && transfers[1].toUserAccount != mainwallet){
    //     if(transfers[1].tokenAmount < 10) return
    // }

    

    const message = `${buy ? "Buy Signal! 🐳" : "Sell Signal!"}
Transaction Type: ${data.type}
Wallet ${data.description},
Token Details: https://photon-sol.tinyastro.io/en/lp/${transfers[buy?1:0].mint}?handle=6427307965a195fb7968c,
Tracked wallet: ${transfers[1].toUserAccount}


    `
    try {
        const url = `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`;

        const payload = {
            chat_id: -1002205079287,
            text: message
        };
        await fetch.post(url,payload);

    } catch (error) {
        console.log(error.message)
    }
    res.send({success:true})
})


app.post('/add', async (req, res) => {
    const newItem = new Item({
        name: req.body.name
    });

    await newItem.save();
    const url = `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`;

        const payload = {
            chat_id: -1002205079287,
            text: "added wallet: "+newItem.name
        };
        await fetch.post(url,payload);
    res.redirect('/');
});

app.post('/delete', async (req, res) => {
    try {
        const newItem = await Item.findByIdAndDelete({_id:req.body.id});
        const url = `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`;

        const payload = {
            chat_id: -1002205079287,
            text: "Deleted wallet: "+newItem.name
        };
        await fetch.post(url,payload);
    } catch (error) {
        console.log(error.message)
    }
    res.redirect('/');
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
// G94GGaypWjXeTMRDbZgi1nbF56bhWsJAy2hYXV1aTgaa