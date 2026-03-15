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
  const {id}=req.params;
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

app.put("/api/loans/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const id  = req.params.id;
  let oldLoanName,oldLoanType,oldOutStandingAmt,OldInterest,oldMonthlyEmi;
  //console.log(userId+" "+id);
  
  const queryForCurrentLoan = `
    SELECT *
    FROM loans
    WHERE user_id = $1 AND id = $2
    ORDER BY created_at DESC;
  `;

  try {
    const result = await db.query(queryForCurrentLoan, [userId,id]);
    console.log(result.rows[0]);
    oldLoanName=result.rows[0].loan_name;
    oldLoanType=result.rows[0].loan_type;
    oldMonthlyEmi=result.rows[0].monthly_emi;
    oldOutStandingAmt=result.rows[0].outstanding_amount;
    OldInterest=result.rows[0].interest_rate;
    
      
    
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
  
  console.log(req.body.loan_type!=undefined)
  let newLoanName,newLoanType,newOutStandingAmt,newInterest,newMonthlyEmi;
    newLoanName=oldLoanName;
    newLoanType=oldLoanType;
    newOutStandingAmt=oldOutStandingAmt;
    newMonthlyEmi=oldMonthlyEmi;
    newInterest=OldInterest;
  if(req.body.loan_type!=undefined) newLoanType=req.body.loan_type;
  if(req.body.loan_name!=undefined) newLoanName=req.body.loan_name;
  if(req.body.outstanding_amount!=undefined) newOutStandingAmt=req.body.outstanding_amount;
  if(req.body.monthly_emi!=undefined) newMonthlyEmi=req.body.monthly_emi;
  if(req.body.interest_rate!=undefined) newInterest=req.body.interest_rate;

  // const {
    
  //   newloanName,
  //   newloanType,
    
  //   newoutstandingAmount,
  //   newinterestRate,
  //   newmonthlyEmi,
    
  // } = req.body;

  console.log(newLoanName+" "+newLoanType+" "+newOutStandingAmt+" "+newInterest+" "+newMonthlyEmi)

  

  const query = `
    UPDATE loans
    SET
      loan_name = $1,
      loan_type = $2,
      
      outstanding_amount = $3,
      interest_rate = $4,
      monthly_emi = $5
    WHERE id = $6 AND user_id = $7
    RETURNING *;
  `;

  const values = [
   
    newLoanName,newLoanType,newOutStandingAmt,newInterest,newMonthlyEmi,
    id,
    userId
  ];
  console.log(values)
  try {
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    res.status(200).json({
      message: "Loan updated successfully",
      loan: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update loan",
      error: error.message,
    });
  }
});


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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
