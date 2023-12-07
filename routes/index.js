const express = require("express");
const router = express.Router();

const indexController = require("../controllers/index");

/* GET home page. */
router.get("/", indexController.index);

router.get("/signup", indexController.sign_up_get);

router.post("/signup", indexController.sign_up_post);

router.get("/login", indexController.log_in_get);

router.post("/login", indexController.log_in_post);

router.get("/logout", indexController.log_out_get);

router.post("/logout", indexController.log_out_post);

module.exports = router;
