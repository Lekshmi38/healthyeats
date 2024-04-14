const mysql = require('mysql');
const express = require('express');
const app = express();
const axios = require('axios');
const ejs = require('ejs');
const PORT = 5000;
const bodyParser = require('body-parser');
const path=require('path');
require('dotenv').config();
const API_ID=process.env.API_ID;
const API_KEY=process.env.API_KEY;
const appId=process.env.appId;
const appKey=process.env.appKey;
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.set('view engine', 'ejs');
 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'recipe'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'recipe'
  });
  
  // Endpoint to fetch table names
  app.get('/fetch_table_names', (req, res) => {
    // Query to fetch table names
    const query = 'SHOW TABLES';
  
    // Execute the query
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching table names:', error);
        return res.status(500).json({ error: 'An error occurred while fetching table names' });
      }
      const tableNames = results.map(result => Object.values(result)[0]);
      
      res.json(tableNames);
    });

  });
  app.get('/fetch_table_columns', async (req, res) => {
    try {
        // Query to fetch table names
        const tablesQuery = 'SHOW TABLES';
        const tableResults = await pool.query(tablesQuery);

        const tableNames = tableResults.map(result => Object.values(result)[0]);
        const tablesData = [];

        // Fetch columns with their data types for each table
        for (const tableName of tableNames) {
            const columnsQuery = `SHOW COLUMNS FROM ${tableName}`;
            const columnsResult = await pool.query(columnsQuery);

            // Extract column names and types and add them to tablesData
            const columnInfo = columnsResult.map(column => ({ name: column.Field, type: column.Type }));
            tablesData.push({ tableName, columns: columnInfo });
        }

        res.json(tablesData);
    } catch (error) {
        console.error('Error fetching table columns:', error);
        console.error('Query:', error.sql); // Log the SQL query that caused the error
        res.status(500).json({ error: 'An error occurred while fetching table columns' });
    }
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public','index.html'));
});
app.get('/find',(req,res)=>{
res.render('index');
});
app.get('/calorie',(req,res)=>{
    res.render('index3');
    });
app.get('/driven',(req,res)=>{
    res.render('index2');
    });
app.post('/find_alternative', (req, res) => {
    const { alter,health } = req.body; // Use req.body for POST requests
   
    connection.query('SELECT * FROM ?? WHERE type = ?', [health, alter], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            return res.status(500).send('An error occurred. Please try again later.');
        }
        results.forEach(result => {
            result.ingredients = result.ingredients.replace(/<br>/g, '<br>'); // Replace <br> with newline character
        });
        res.status(200).json(results);
    });
});
app.get('/recipes', async (req, res) => {
    const { ingredients } = req.query;

    try {
        const response = await axios.get(`https://api.edamam.com/search?q=${encodeURIComponent(ingredients)}&app_id=${API_ID}&app_key=${API_KEY}`);
        const recipes = response.data.hits.map(hit => {
            const { label, ingredientLines, url } = hit.recipe;
            return { label, ingredientLines, url };
        });

        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Error fetching recipes' });
    }
});
app.post('/calorie_find', async (req, res) => {
    const { foodName, quantity } = req.body;
  
   

    try {
        const response = await axios.get(`https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(quantity + ' ' + foodName)}`);
        const calorie = response.data.calories;
        console.log(calorie);
        res.json({ calorie });
    } catch (error) {
        console.error('Error fetching calorie:', error);
        res.status(500).json({ error: 'Error fetching calorie' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
