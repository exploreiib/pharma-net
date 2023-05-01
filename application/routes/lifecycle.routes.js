"use strict";

const express = require("express");
const { viewHistory,viewCurrentState }  = require("../controllers/lifecycle.controllers");

const router = express.Router();

router.post("/viewHistory",viewHistory);
router.post("/viewCurrentState",viewCurrentState);

module.exports =  router;