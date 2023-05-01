"use strict";

const express = require("express");
const {  createPO,
         createShipment,
         updateShipment,
         retailDrug }  = require("../controllers/transfer.controllers");

const router = express.Router();

router.post("/createPO",createPO);
router.post("/createShipment",createShipment);
router.post("/updateShipment",updateShipment);
router.post("/retailDrug",retailDrug);

module.exports =  router;