const express = require("express");
require("dotenv").config();// go to file .env and read the value

const { Pool } = require("pg");
const cors = require("cors");

const app = express();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME

});
app.use(cors());
app.use(express.json());
const PORT = 3000;

app.get("/api/expenses", async(req, res) => {
    const result = await pool.query(
        `
    SELECT 
        id,
        title,
        amount::float,
        category,
        TO_CHAR(date, 'DD-MM-YYYY') AS date
    FROM expenses
    ORDER BY id
        `);
        res.json(result.rows);
});

// get 1 expenses
app.get("/api/expenses/:id", async(req, res) =>{
    const id = req.params.id;

    // validation 
    if(isNaN(id)){
        return res.status(404).json({
            message:"Expense not found"
        });
    }
    //send query to DB
    const result = await pool.query(
        `SELECT
         id,
         title,
         amount::float,
         category,
         TO_CHAR(date, 'DD-MM-YYYY') AS date
     FROM expenses
      WHERE id =$1

      `, [id]);

    // check if result is found
    if(result.rows.length ===0){
        return res.status(404).json({ // if not found expense stope the route 
            message:"Expense id not found"
        });
    }
    res.json(result.rows[0]); // reutrn response

});

app.post("/api/expenses", async(req,res)=>{
    const{title, amount, category, date }= req.body;


// check title
if(!title || title.trim() === ""){
    return res.status(400).json({
        message: "Title is required"
    });

}

// amout check if is number and is greater than 0 or =0
if(typeof amount !== "number" || amount <= 0){
    return res.status(400).json({
        message: "Amount must be a number greater than 0"
    });
}

// check allow category ?
const allowedcategory =[
"Food",
"Transport",
"Bills",
"Entertainment",
"Other"
];

if(!allowedcategory.includes(category)){
    return res.status(400).json({
        message:'Invalid category'
    });
}

// date check
const parsedate = new Date(date);
if(!date || isNaN(parsedate.getTime())){
    return res.status(400).json({
        message:"Invalid Date"
    });
}

// insert into query
const result = await pool.query(
    `INSERT INTO expenses
      (title, amount, category, date)
      VALUES
          ($1, $2, $3, $4)
      RETURNING 
      id,
      title,
      amount::float AS amount,
      category,
      TO_CHAR(date, 'DD-MM-YYYY') AS date
      `,
      [title, amount, category, date]
);
res.status(201).json(result.rows[0]);//returning result 

});


// put 
app.put("/api/expenses/:id", async (req, res) => {
    const id = req.params.id;

    const {title, amount, category, date} = req.body;

    if(isNaN(id)){
        return res.status(404).json({
            message:"Expense not found"
        });
    }

    // validation

    if(!title || title.trim() ===""){
        return res.status(400).json({
            message: "Title is empty or not valide"
        });
    }

    if(typeof amount !== "number" || amount <=0){
        return res.status(400).json({
            message: "Amount should be number and greater than 0 not equal 0 "
        });
    }

    const allowedcategory =[
       "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Other" 
    ];
    if(!allowedcategory.includes(category)){
        return res.status(400).json({
            message:"This type of category not found enter allowed category"
        });
    }

    const parsedate =new Date(date);
    if(!date || isNaN(parsedate.getTime())){
        return res.status(400).json({
            message:"Date is Not valide "
        });
    }
// check if id found ?!
    const checkfound = await pool.query(
        "SELECT id FROM expenses WHERE id = $1",
        [id]
    );
    if(checkfound.rows.length === 0){
        return res.status(404).json({
            message: "Expense not found"
        });
    }

    const result = await pool.query(
        `
        UPDATE expenses
        SET
        title =$1,
        amount = $2,
        category = $3,
        date= $4
     WHERE id = $5
     RETURNING 
       id,
       title,
       amount::float AS amount,
       category,
       TO_CHAR(date, 'DD-MM-YYYY') AS date
        `,
        [title, amount, category, date, id]
    );
    res.status(200).json(result.rows[0]);
});


// Delete
app.delete("/api/expenses/:id", async(req,res)=>{
    const id = req.params.id;

    if(isNaN(id)){
        return res.status(404).json({
            message:'ID is not valid check the type'
        });
    }

    const checkfound = await pool.query(
     "SELECT id FROM expenses WHERE id = $1",
     [id]
    );
    if(checkfound.rows.length === 0){
        return res.status(404).json({
            message:"This expense id not found check from id ?"
        });
    }
    const result = await pool.query(`
        DELETE 
        FROM expenses
        WHERE id=$1
        RETURNING
           id,
           title,
           amount::float AS amount,
           category,
           TO_CHAR(date, 'DD-MM-YYYY') AS date
       `, [id] 
    );

    res.status(200).json(result.rows[0]);
});


app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
    console.log(`Expenses:http://localhost:${PORT}/api/expenses`);

});

