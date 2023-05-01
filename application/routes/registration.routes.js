"use strict";

const express = require("express");
const { registerCompany,addDrug }  = require("../controllers/registration.controllers");

const router = express.Router();

router.post("/registerCompany",registerCompany);
router.post("/addDrug",addDrug);

module.exports =  router;