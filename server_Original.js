const express = require('express');
// Import and require mysql2
const mysql = require('mysql2');
const inquirer = require('inquirer');

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



// // Default response for any other request (Not Found)
// app.use((req, res) => {
//   res.status(404).end();
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// TODO: Create a function to initialize app
function init() {
  inquirer
    .prompt([
        {
          type: 'list',
          name: 'toDo',
          message: "What would you like to do?",
          choices: ["View all departments","View all roles","View all employees","Add a department","Add a role","Add employee","Update employee's role"]
        },

    ])
    .then((response) => {
      //console.log(response);
      if(response.toDo == 'View all departments'){
        // Query database
        db.query('SELECT * FROM department', function (err, results) {
          const formattedResults = results.map(result => ({
            id: result.id,
            name: result.name,
          }));
          console.table(formattedResults);
        });
      }
      else if(response.toDo == 'View all roles'){
        // Query database
        db.query('SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department ON role.department_id = department.id', function (err, results) {
          console.log(results)
          // Formatted table - chat gpt assisted with this code development
          const formattedResults = results.map(result => ({
            id: result.id,
            title: result.title,
            department: result.department,
            salary: result.salary
          }));
          console.table(formattedResults);
        });
      }
      else if (response.toDo == 'View all employees') {
        // Chat GPT helped me with this query, as I was getting errors with the joins
        db.query(`
            SELECT
                e.id AS employee_id,
                e.first_name,
                e.last_name,
                r.title AS role,
                d.name AS department,
                r.salary,
                CONCAT(m.first_name, ' ', m.last_name) AS manager
            FROM
                employee e
            LEFT JOIN
                role r ON e.role_id = r.id
            LEFT JOIN
                department d ON r.department_id = d.id
            LEFT JOIN
                employee m ON e.manager_id = m.id;
        `, function (err, results) {
            if (err) {
                console.error('Error executing SQL query:', err);
                return;
            }
    
            console.table(results);
        });
    }

    else if (response.toDo == 'Add a department') {
      inquirer
      .prompt([
          {
            type: 'input',
            name: 'newDepartment',
            message: "What is the name of the department?",
          },
  
      ]).then((response) => { 
        console.log(response.newDepartment)
        db.query(
          `INSERT INTO department (name) VALUES ('${response.newDepartment}');`
        )

      });
  }
  else if (response.toDo == 'Add a role') {
    function getDepartments() {
      return new Promise((resolve, reject) => {
        db.query('SELECT * FROM department', function (err, results) {
          if (err) {
            reject(err);
          } else {
            const departments = results.map(result => result.name);
            resolve(departments);
          }
        });
      });
    }
    
    // Usage
    getDepartments()
      .then(departments => {
        console.log(departments);
        inquirer
        .prompt([
            {
              type: 'input',
              name: 'newRole',
              message: "What is the name of the role?",
            },
            {
              type: 'input',
              name: 'newSalary',
              message: "What is the salary of the role?",
            },
            {
              type: 'list',
              name: 'department',
              message: "What department does the role belong to?",
              choices: departments
            },
    
        ]).then((response) => { 
          console.log(departments)
          console.log(response)
          department_id = -999
          //To find the department id associated with a specific department
          for(i=0;i<departments.length;i++){
            if(departments[i]==response.department){
              department_id = i+1
          }
        }
        console.log(department_id)
          db.query(
            `INSERT INTO role (title, department_id, salary) VALUES ('${response.newRole}', ${department_id}, ${response.newSalary});`
          )
    
        });
        // Now you can use the departments array here
      })
      .catch(error => {
        console.error('Error fetching departments:', error);
      });
}

else if (response.toDo == 'Add employee') {
  function getRoles() {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM role', function (err, results) {
        if (err) {
          reject(err);
        } else {
          const roles = results.map(role => role.title);
          resolve(roles);
        }
      });
    });
  }
  function getEmployee() {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM employee', function (err, results) {
        if (err) {
          reject(err);
        } else {
          const employees = results.map(employee => `${employee.first_name}  ${employee.last_name}`);
          resolve(employees);
        }
      });
    });
  }
  
  // Usage
  getRoles()
    .then(roles => {
      getEmployee().then(employees =>{
      console.log(employees);
      employees.push("None")
      inquirer
      .prompt([
          {
            type: 'input',
            name: 'firstName',
            message: "What is the employee's first name?",
          },
          {
            type: 'input',
            name: 'lastName',
            message: "What is the employee's last name?",
          },
          {
            type: 'list',
            name: 'role',
            message: "What is the employee's role?",
            choices: roles
          },
          {
          type: 'list',
          name: 'manager',
          message: "Who is the employee's manager",
          choices: employees
        },
  
      ]).then((response) => { 
        console.log(roles)
        console.log(response)
        role_id = -999
        //To find the role id associated with a specific department
        for(i=0;i<roles.length;i++){
          if(roles[i]==response.role){
            role_id = i+1
        }
      }
        //To find the manager id associated with a specific department
        manager_id = -999
        for(i=0;i<employees.length;i++){
          if(employees[i]==response.manager && response.manager != "None"){
            manager_id = i+1
            db.query(
              `INSERT INTO employee (first_name,last_name,role_id,manager_id) VALUES ('${response.firstName}', '${response.lastName}', ${role_id}, ${manager_id});`,
            )
            break
        }
        else if(response.manager === "None"){
          db.query(
            `INSERT INTO employee (first_name,last_name,role_id,manager_id) VALUES ('${response.firstName}', '${response.lastName}', ${role_id}, NULL);`,
          )
          break
        }
      }

  
      });
      });
      // Now you can use the departments array here
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
    });
}
else if (response.toDo == "Update employee's role") {
  function getRoles() {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM role', function (err, results) {
        if (err) {
          reject(err);
        } else {
          const roles = results.map(role => role.title);
          resolve(roles);
        }
      });
    });
  }
  function getEmployee() {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM employee', function (err, results) {
        if (err) {
          reject(err);
        } else {
          const employees = results.map(employee => `${employee.first_name} ${employee.last_name}`);
          resolve(employees);
        }
      });
    });
  }
  
  // Usage
  getRoles()
  .then(roles => {
    getEmployee().then(employees =>{
      inquirer
      .prompt([
          {
            type: 'list',
            name: 'employeeName',
            message: "What is the name of the employee you want to change the role for?",
            choices: employees
          },
          {
            type: 'list',
            name: 'newRole',
            message: "What role do you want to assign to selected employee",
            choices: roles
          },
  
      ]).then((response) => { 
        console.log(response)
        const employeeFullName = response.employeeName.trim();
        console.log(employeeFullName)
        const [firstName, lastName] = employeeFullName.split(' ');
        //const [firstName, lastName] = employeeFullName.split(` `);


        console.log('First Name:', firstName);
        console.log('Last Name:', lastName);

        role_id = -999
        //To find the department id associated with a specific department
        for(i=0;i<roles.length;i++){
          if(roles[i]==response.newRole){
            roles_id = i+1
        }
      }
        db.query(
          `UPDATE employee SET role_id = ${roles_id} WHERE first_name = '${firstName}' AND last_name = '${lastName}'`
          )
  
      });
      // Now you can use the departments array here
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
    });
  });
}
    

    //init()





    });
}

// Function call to initialize app
init();





 function getDepartments() {
  // Replace this with your actual database query to fetch departments
  // Example using a Promise (make sure to handle errors appropriately)
  return new Promise((resolve, reject) => {
    db.query('SELECT id, name FROM department', (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}