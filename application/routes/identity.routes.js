"use strict";

const express = require("express");
const {  addToWalletManufacturer,
         addToWalletDistributor,
         addToWalletTransporter,
         addToWalletRetailer,
         addToWalletConsumer }  = require("../controllers/identity.controllers");

const router = express.Router();

router.post("/addToWalletManufacturer",addToWalletManufacturer);
router.post("/addToWalletDistributor",addToWalletDistributor);
router.post("/addToWalletTransporter",addToWalletTransporter);
router.post("/addToWalletRetailer",addToWalletRetailer);
router.post("/addToWalletConsumer",addToWalletConsumer);

module.exports =  router;