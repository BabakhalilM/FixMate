import express from "express";
import { userController } from "../controllers/userController";
import { authenticate, isTechnician } from "../middleware/auth";

const userRouter = express.Router();

// Public routes
userRouter.post("/customers", userController.createCustomer);

// Protected routes
userRouter.get("/", authenticate, userController.getUsers);

userRouter.get("/customers/search", authenticate, userController.searchUsers);
userRouter.get("/getCustomers/search",authenticate,isTechnician,userController.searchCustomer)

userRouter.get("/getCustomers", authenticate, userController.getCustomers);

userRouter.get("/profile", authenticate, userController.getProfile);

// Specific routes MUST come before /:id
userRouter.get(
  "/getMyCustomers",
  authenticate,
  isTechnician,
  userController.getMyCustomers,
);

userRouter.get(
  "/getMyTechnicians",
  authenticate,
  userController.getMyTechnicians,
);

// Dynamic routes MUST come last
userRouter.get("/:id", authenticate, userController.getUserById);

userRouter.put("/profile", authenticate, userController.updateProfile);

userRouter.put("/:id", authenticate, userController.updateUser);

userRouter.delete("/:id", authenticate, userController.deleteUser);

export default userRouter;
