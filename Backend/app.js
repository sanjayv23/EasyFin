import express from "express";
import pg from "pg";

import body from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "EasyFin",
  password: "232004",
  port: 5432,
});

db.connect();
app.use(express.json());
app.use(body.urlencoded({extended:true}));

const authMiddleware = (req, res, next) => {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized: missing user id",
    });
  }

  req.user = { id: userId };
  next();
};

app.get("/", (req, res) => {
  res.send("Server is running");
});


// LOANS - 

app.post("/api/loans", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("user ID "  + userId);
  console.log("req  "  + JSON.stringify(req.body));
  const {
    id,
    loanName,
    loanType,
    
    outstandingAmount,
    interestRate,
    monthlyEmi,
    
  } = req.body;

  const query = `
    INSERT INTO loans (
      id,
      loan_name,
      loan_type,
      outstanding_amount,
      interest_rate,
      monthly_emi,
      user_id

    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    id,
    loanName,
    loanType,
    
    outstandingAmount,
    interestRate,
    monthlyEmi,
    userId
  ];

  try {
    const result = await db.query(query, values);
    
    res.status(201).json({
      message: "Loan created successfully",
      loan: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create loan",
      error: error.message,
    });
  }
});

app.get("/api/loans", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT *
    FROM loans
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  try {
    const result = await db.query(query, [userId]);
    res.status(200).json({
      message: "Loans fetched successfully",
      loans: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
});

app.get("/api/loans/:id", authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  const id=req.params.id;
  console.log(user_id+" "+id);
  const query = `
    SELECT *
    FROM loans
    WHERE user_id = $1 AND id = $2
    ORDER BY created_at DESC;
  `;

  try {
    const result = await db.query(query, [user_id,id]);
    res.status(200).json({
      message: "Loans fetched successfully",
      loans: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
});

app.get("/api/loans/amount/:userId", authMiddleware, async (req, res) => {
  
  const userId=req.params.userId;
  
  const query = `
    SELECT sum(outstanding_amount)
    FROM loans
    WHERE user_id = $1
    ;

  `;

  try {
    const result = await db.query(query, [userId]);
    console.log(result.rows[0])
    res.status(200).json({
      message: "Loans fetched successfully",
      loans: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans for particular user",
      error: error.message,
    });
  }
});
app.put("/api/loans/:id",authMiddleware,async (req,res)=>{
  
  const userId=req.user.id;
  const loanId=req.params.id;
  
  const {
    loan_name, 
    loan_type, 
    outstanding_amount, 
    interest_rate, 
    monthly_emi
  }=req.body;
  console.log(loan_name+" "+ 
    loan_type+" "+
    outstanding_amount+" "+ 
    interest_rate+" "+
    monthly_emi+" ")
  // coalesce ($1,loan_name) takes $1 or take already
  const query=`
    update loans
    set loan_name=Coalesce($1,loan_name),
    loan_type=Coalesce($2,loan_type),
    outstanding_amount=Coalesce($3,outstanding_amount), 
    interest_rate=Coalesce($4,interest_rate), 
    monthly_emi=Coalesce($5,monthly_emi)
    where user_id=$6 and id=$7
    returning *
  `;

  console.log(monthly_emi || null)
  const values=[
    loan_name || null, 
    loan_type || null, 
    outstanding_amount || null, 
    interest_rate || null, 
    monthly_emi || null,
    userId,
    loanId
  ]
  try {
    const result=await db.query(query,values);
    res.status(200).json({
      message:"Update Success",
      updatedLoan:result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message:"Update failed",
      error:error.message
    });
  }
})
app.delete("/api/loans/:loan_id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log(req.params);
  const { loan_id } = req.params;

  const query = `
    DELETE FROM loans
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  console.log("df");
  try {
    const result = await db.query(query, [loan_id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    res.status(200).json({
      message: "Loan deleted successfully",
      loan: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete loan",
      error: error.message,
    });
  }
});

// ASSEST - 

app.get("/api/assest",authMiddleware,async(req,res)=>{
  res.send("sd");
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


