const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

// Import all function modules
const identityRouter = require("./routes/identity.routes");
const registartionRouter = require("./routes/registration.routes");
const transferRouter = require("./routes/transfer.routes");
const lifecycleRouter = require("./routes/lifecycle.routes");

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set("title", "Pharma App");

//add routes to app instance
app.use("/identity",identityRouter);
app.use("/register",registartionRouter)
app.use("/transfer",transferRouter);
app.use("/view",lifecycleRouter);

app.get("/", (req, res) => res.send("Welcome to the Pharmacy network"));

app.listen(port, () => console.log(`Distributed Pharma App listening on port ${port}!`));
