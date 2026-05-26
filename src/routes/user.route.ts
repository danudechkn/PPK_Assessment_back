import { Router } from "express";

import { AllInOneController } from "../controllers/all_in_one/allInOne.controller";
const router = Router();
// const apiLogger = require("../middleware/apiLogger");
// const {
//   authenticateToken,
//   authorizeRole,
// } = require("../middleware/authMiddleware");

//route
// router.use(authenticateToken, apiLogger, authorizeRole(1));

// router.get("/mapAll", AllChoiceController.mapAll);
router.get("/all-in-one", AllInOneController.index);

export default router;
