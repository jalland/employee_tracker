const express = require('express');
// Import and require mysql2
const mysql = require('mysql2');

// const PORT = process.env.PORT || 3001;
// const app = express();

// // Express middleware
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: 'root',
    // MySQL password
    password: 'root',
    database: 'employee_tracker',
    port: 8889
  },
  console.log(`Connected to the employee_tracker database.`)
);

// Query database
db.query('SELECT * FROM department', function (err, results) {
  console.log(results);
  console.log("id   name")
  console.log("--   ------------")
  for(i=0;i<results.length;i++){
    console.log(`${results[i].id}    ${results[i].name}`)
  }
});

// // Default response for any other request (Not Found)
// app.use((req, res) => {
//   res.status(404).end();
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
