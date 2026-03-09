import express from "express";
const app=express();
const port=3000;

app.get("/",(req,res)=>{
  res.send("hi");  
})

app.listen(port, (req,res)=>{
    console.log(`Listening from port ${port}`)
})