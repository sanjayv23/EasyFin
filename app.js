import express from "express";
const app=express();
const port=3000;

app.get("/",(req,res)=>{
  res.send("hi");  
})
app.get("/liabilities",(req,res)=>{
    
});
app.listen(port, (req,res)=>{
    console.log(`Listening from port ${port}`)
})