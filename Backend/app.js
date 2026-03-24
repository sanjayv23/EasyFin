import express from "express";
import pg from "pg";
import jwt from "jsonwebtoken";
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
const JWT_SECRET = "sanjaymajasooo";
db.connect();
app.use(express.json());
app.use(body.urlencoded({ extended: true }));

const authMiddleware = (req, res, next) => {
  const userId = req.header("x-user-id");
  console.log(req.header("authorization"));
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized: missing user id",
    });
  }

  req.user = { id: userId };
  next();
};

const JWTauthMiddleware = (req, res, next) => {
  const authheader = req.header("authorization").split(" ")[1];

  if (!authheader) {
    return res.status(401).json({
      message: "UNo token, authorization denied",
    });
  }
  console.log(" verift " + JSON.stringify(jwt.verify(authheader, JWT_SECRET)));
  req.user = jwt.verify(authheader, JWT_SECRET);
  next();
};

app.get("/", (req, res) => {
  res.send("Server is running");
});

//USERS-
app.post("/api/user/login", async (req, res) => {
  const {mail,password} = req.body;
  
  
  if(!mail || !password){
    return res.status(400).json({
      message: "Email and password are required"
    })
  }
  
  try {
    const query = `select user_id from users where mail=$1 and password=$2`;
    const values=[ mail,password]; 
    const result = await db.query(query, values);
    if(result.rowCount==0){
      return res.status(404).json({
      message: "user not found"
    }) 
    }
    console.log("Result "+result.rows[0]);
    const user_id = result.rows[0].user_id;
    const token = jwt.sign(
      { id: user_id, mail: mail },

      JWT_SECRET,
      { expiresIn: "1h" },
    );
    return res.status(200).json({ 
      token,
      
    });
  } catch (error) {
    return res.status(500).json({
      message: "Invalid credentials",
      error: error.message,
    });
  }
  
});


// LOANS -

app.post("/api/loans", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log("user ID " + userId);
  console.log("req  " + JSON.stringify(req.body));
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
    userId,
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
  const id = req.params.id;
  console.log(user_id + " " + id);
  const query = `
    SELECT *
    FROM loans
    WHERE user_id = $1 AND id = $2
    ORDER BY created_at DESC;
  `;

  try {
    const result = await db.query(query, [user_id, id]);
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
  const userId = req.params.userId;

  const query = `
    SELECT sum(outstanding_amount)
    FROM loans
    WHERE user_id = $1
    ;

  `;

  try {
    const result = await db.query(query, [userId]);
    console.log(result.rows[0]);
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
app.patch("/api/loans/:id", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;

  const {
    loan_name,
    loan_type,
    outstanding_amount,
    interest_rate,
    monthly_emi,
  } = req.body;
  console.log(
    loan_name +
      " " +
      loan_type +
      " " +
      outstanding_amount +
      " " +
      interest_rate +
      " " +
      monthly_emi +
      " ",
  );
  // coalesce ($1,loan_name) takes $1 or take already
  const query = `
    update loans
    set loan_name=Coalesce($1,loan_name),
    loan_type=Coalesce($2,loan_type),
    outstanding_amount=Coalesce($3,outstanding_amount), 
    interest_rate=Coalesce($4,interest_rate), 
    monthly_emi=Coalesce($5,monthly_emi)
    where user_id=$6 and id=$7
    returning *
  `;

  console.log(monthly_emi || null);
  const values = [
    loan_name || null,
    loan_type || null,
    outstanding_amount || null,
    interest_rate || null,
    monthly_emi || null,
    userId,
    loanId,
  ];
  try {
    const result = await db.query(query, values);
    res.status(200).json({
      message: "Update Success",
      updatedLoan: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
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



// ASSEST - JWT AUTH
app.get("/api/asset", JWTauthMiddleware, async (req, res) => {
  
  try{
    const query=`select * from assets where user_id=$1`;
    
    const result=await db.query(query,[req.user.id]);
    
    return res.status(200).json({
      assets:result.rows,
      
    })
  }
  catch(error){
    console.error("error "+error.message);    
    return res.status(500).json({
      message:"Internal server error",
      
    })
  }

  

  
});

app.post("/api/asset", JWTauthMiddleware, async (req, res) => {
  const {
    current_value,units,invested_value,asset_class,asset_name,isin_code
  } = req.body;
    if (!current_value || !units || !invested_value || !asset_class || !asset_name) {
  return res.status(400).json({ message: "All required fields must be provided" });
}
  try{
    
    
    const query=`insert into assets(user_id,current_value,units,invested_value,asset_class,asset_name,isin_code) values($1,$2,$3,$4,$5,$6,$7) returning *`;
    
    const values=[
      req.user.id,current_value,units,invested_value,asset_class,asset_name,isin_code
    ]
    const result=await db.query(query,values);
    
    
    return res.status(201).json({
      message:"Assets Added Sucessfully",
      assets:result.rows,
    
    })
  }
  catch(error){
    console.log("error "+error.message);  
    return res.status(500).json({
      message:"Internal server error",
      
    })
  }

  

  
});

app.get("/api/value/asset", JWTauthMiddleware, async (req, res) => {
  
  try{
    const query=`SELECT SUM(invested_value) AS total_invested, 
                      SUM(current_value) AS total_current 
               FROM assets WHERE user_id=$1`;
    
    const result=await db.query(query,[req.user.id]);
    
    return res.status(200).json({
      invested_value:result.rows[0].total_invested || 0,
      current_value:result.rows[0].total_current || 0
    })
  }
  catch(error){
    console.error("error "+error.message);    
    return res.status(500).json({
      message:"Internal server error",
      
    })
  }

  

  
});

app.delete("/api/asset/:asset_id",JWTauthMiddleware,async (req,res)=>{
    if(!req.params.asset_id){
      return res.status(400).json({
        message:"asset_id is required"
      })
    }
    try{
    const query=`delete from assets where user_id=$1 and asset_id=$2 returning *`;
    
    const result=await db.query(query,[req.user.id,req.params.asset_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }
    return res.status(200).json({
      assets:result.rows,
    
    })
  }
  catch(error){
    console.error("error "+error.message);    
    return res.status(500).json({
      message:"Internal server error",
      
    })
  }
})

app.patch("/api/asset/:asset_id", JWTauthMiddleware, async (req, res) => {
  const {
    current_value,units,invested_value,asset_class,asset_name,isin_code
  } = req.body;
    
  try{
    
    
    const query=`update assets
    set asset_name=Coalesce($1,asset_name),
    asset_class=Coalesce($2,asset_class),
    invested_value=Coalesce($3,invested_value), 
    current_value=Coalesce($4,current_value), 
    units=Coalesce($5,units),
    isin_code=coalesce($6,isin_code)
    where user_id=$7 and asset_id=$8
    returning *`;
    
    const values=[
      asset_name || null,asset_class || null,invested_value || null,current_value|| null ,units || null,isin_code || null,req.user.id,req.params.asset_id 
    ]
    const result=await db.query(query,values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    return res.status(200).json({
      message:"Assets updated Sucessfully",
      assets:result.rows,
    
    })
  }
  catch(error){
    console.log("error "+error.message);  
    return res.status(500).json({
      message:"Internal server error",
      
    })
  }  
  
});

//Expense and income tracker 






























// SERVER LISTENING TO PORT
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
