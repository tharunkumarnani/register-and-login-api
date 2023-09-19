const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");
const bcrypt = require("bcrypt");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//register user

app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getSelectUser = `
    select * from user where username='${username}'`;
  const dbUser = await db.get(getSelectUser);
  const hashedPassword = await bcrypt.hash(password, 10);
  if (dbUser === undefined) {
    //create User
    const createUser = `
        insert into user (username,name,password,gender,location) 
        values ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    await db.run(createUser);
    response.send("User Created Successfully");
  } else {
    //Username Exist
    response.status(400);
    response.send("Username already Exists");
  }
});

//login user

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `
    select * from user where username='${username}'`;
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    //invalid user
    response.status(400);
    response.send("Invalid User");
  } else {
    //check password
    const checkPassword = await bcrypt.compare(password, dbUser.password);

    if (checkPassword) {
      response.send("Login Successfully");
    } else {
      response.status(400);
      response.send("Incorrect Password");
    }
  }
});
