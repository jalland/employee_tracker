const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');

//Create connection to SQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'employee_tracker',
  port: 8889
}, console.log(`Connected to the employee_tracker database.`));

//The init function is the main prompt a user will be interacting with. init() is called many times in the code after a user has done a task (e.g., added a new employee). Note that we are doing async with try-catch blocks, as if I didn't have these, the init() function would run again and again at the same time the user is trying to answer the prompts. 
async function init() {
  try {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'toDo',
        message: "What would you like to do?",
        choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", "Add employee", "Update employee's role"]
      },
    ]);
    //This block prints out a formatted table of the departments. 
    if (response.toDo == 'View all departments') {
      const results = await queryDatabase('SELECT * FROM department');
      const formattedResults = results.map(result => ({ 
          id: result.id, 
          name: result.name 
        }));
      console.table(formattedResults);
      init();
    //This block prints out a formatted table of all roles. 
    } else if (response.toDo == 'View all roles') {
      const results = await queryDatabase('SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department ON role.department_id = department.id');
      const formattedResults = results.map(result => ({ 
          id: result.id, 
          title: result.title, 
          department: result.department, salary: result.salary 
        }));
      console.table(formattedResults);
      init();
    //This block prints out a formatted table of all employees. 
    } else if (response.toDo == 'View all employees') {
      const results = await queryDatabase(`
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
      `);
      console.table(results);
      init();
    //This block allows a user to add a department. Then, when printing out the departments table, the new department will be added. 
    } else if (response.toDo == 'Add a department') {
      const newDepartment = await inquirer.prompt([
        {
          type: 'input',
          name: 'newDepartment',
          message: "What is the name of the department?",
        },
      ]);
      await queryDatabase(`INSERT INTO department (name) VALUES ('${newDepartment.newDepartment}')`);
      init();
    //This block allows a user to add a role. Then, when printing out the roles table, the new role will be added. 
    } else if (response.toDo == 'Add a role') {
      const departments = await getDepartments();
      const newRole = await inquirer.prompt([
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
          choices: departments.map(department => department.name),
        },
      ]);
      //Chat GPT helped me with this. Originally I had a for loop to determine the departemnt id, but it wasn't working. 
      const department_id = departments.find(dep => dep.name === newRole.department).id;
      await queryDatabase(`INSERT INTO role (title, department_id, salary) VALUES ('${newRole.newRole}', ${department_id}, ${newRole.newSalary})`);
      init();
    //This block allows a user to add an employee. Then, when printing out the employees table, the new employee will be added. 
    } else if (response.toDo == 'Add employee') {
      const roles = await getRoles();
      const employees = await getEmployees();
      employees.push("None");
      const newEmployee = await inquirer.prompt([
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
          choices: roles.map(role => role.title),
        },
        {
          type: 'list',
          name: 'manager',
          message: "Who is the employee's manager",
          choices: employees,
        },
      ]);
      //Chat GPT helped with this "find" method. 
      const role_id = roles.find(role => role.title === newEmployee.role).id;

      //Manager id is set to null if no manager. Otherwise, it is set to the id of the manager name.
      const manager_id = newEmployee.manager === "None" ? null : employees.indexOf(newEmployee.manager) + 1;

      await queryDatabase(`
        INSERT INTO employee (first_name, last_name, role_id, manager_id)
        VALUES ('${newEmployee.firstName}', '${newEmployee.lastName}', ${role_id}, ${manager_id})
      `);
      init();
    //This block allows a user to update an employee's role. Then, when printing out the employee's table, the updated information will appear in the employee's row. 
    } else if (response.toDo == "Update employee's role") {
      const employees = await getEmployees();
      const roles = await getRoles();
      const updateEmployeeRole = await inquirer.prompt([
        {
          type: 'list',
          name: 'employeeName',
          message: "What is the name of the employee you want to change the role for?",
          choices: employees,
        },
        {
          type: 'list',
          name: 'newRole',
          message: "What role do you want to assign to the selected employee",
          choices: roles.map(role => role.title),
        },
      ]);

      const employeeFullName = updateEmployeeRole.employeeName.trim();
      const [firstName, lastName] = employeeFullName.split(' ');

      const role_id = roles.find(role => role.title === updateEmployeeRole.newRole).id;

      await queryDatabase(`
        UPDATE employee
        SET role_id = ${role_id}
        WHERE first_name = '${firstName}' AND last_name = '${lastName}'
      `)
      init();;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

//This function takes in an sql query to do something with the database (e.g., SELECT, INSERT, UPDATE)
async function queryDatabase(sqlQuery) {
  return new Promise((resolve, reject) => {
    db.query(sqlQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

//This function returns an array of objects where each element of the array contains the id and department name. 
async function getDepartments() {
  try {
    const departments = await queryDatabase('SELECT id, name FROM department');
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return;
  }
}

//This function returns an array of objects where each element of the array is the role id, title, salary, and department_id. 
async function getRoles() {
  try {
    const roles = await queryDatabase('SELECT * FROM role');
    return roles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return;
  }
}

//This function returns an array where each element is the full name of an employee. 
async function getEmployees() {
  try {
    const employees = await queryDatabase('SELECT * FROM employee');
    return employees.map(employee => `${employee.first_name} ${employee.last_name}`);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return;
  }
}

init();