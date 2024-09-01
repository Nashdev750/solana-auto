require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fetch = require('axios');

const app = express();
const port = 4000;


const sol = "So11111111111111111111111111111111111111112"

mongoose.connect(process.env.CONNECTIONSTRING).then(()=>{
    console.log("connected")
});

const itemSchema = new mongoose.Schema({
    name: String
});
const transactionSchema = new mongoose.Schema({
    type: Boolean,
    from: String,
    to:String,
    description: String,
    Date: Date,
    open: Boolean
});

const Item = mongoose.model('Item', itemSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);



app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
    const items = await Item.find();
    res.render('index', { items });
});


app.post('/webhook', async (req, res)=>{
    if(!req.body[0].description.toLowerCase().includes("swapped")) return
    const data = req.body[0]
    const transfers = data.tokenTransfers
    const buy = true
    if(transfers.length != 2) return
    if(transfers[0].mint != sol) buy = false 

    await Transaction.create({
        type: buy,
        from: transfers[0].mint,
        to:transfers[1].mint,
        description: data.description,
        Date: new Date(),
        open: true
    })
    const message = `${data.description},
    token: https://birdeye.so/token/${transfers[buy?1:0].mint}?chain=solana,
    wallet: ${transfers[1].toUserAccount}
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
