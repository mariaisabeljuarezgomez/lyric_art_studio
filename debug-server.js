// debug-server.js  – 15 lines, zero deps
const express = require('express');
const app = express();
const session = require('express-session');

app.use(express.static(__dirname));
app.use(express.json());
app.use(session({ secret: 'abc', resave: false, saveUninitialized: true, cookie: { secure: false } }));

// routes
app.get('/api/cart',      (req,res)=>res.json(req.session.cart||[]));
app.post('/api/cart/add', (req,res)=>{
  const {itemId,qty=1}=req.body;
  if(!req.session.cart) req.session.cart=[];
  const ex=req.session.cart.find(i=>i.itemId===itemId);
  ex ? ex.qty+=qty : req.session.cart.push({itemId,qty});
  res.json({ok:true});
});
app.get('/api/cart/count',(req,res)=>res.json({count:(req.session.cart||[]).reduce((s,i)=>s+i.qty,0)}));

app.listen(3001, ()=>console.log('🔥 Debug server on http://localhost:3001')); 