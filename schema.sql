DROP DATABASE IF EXISTS employee_tracker;
CREATE DATABASE employee_tracker;

-- use inventory_db database --
USE employee_tracker;

CREATE TABLE department (
  id INT PRIMARY KEY,
  name VARCHAR(30)
);

CREATE TABLE role (
  id INT PRIMARY KEY,
  title VARCHAR(30),
  salary DECIMAL,
  FOREIGN KEY (department_id)
  REFERENCES department(id)
  ON DELETE SET NULL
);

CREATE TABLE employee (
  id INT PRIMARY KEY,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  FOREIGN KEY (role_id)
  REFERENCES role(id)
  ON DELETE SET NULL,
  manager_id INT
);