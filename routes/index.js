const express = require("express");
const router = express.Router();

const indexController = require("../controllers/index");

/* GET home page. */
router.get("/", indexController.index);

router.get("/sign-up", indexController.sign_up_get);

router.post("/sign-up", indexController.sign_up_post);

module.exports = router;
