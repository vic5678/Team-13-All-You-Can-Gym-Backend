import gymAdminService from "../services/gymAdminService.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../config/constants.js";
import { successResponse, errorResponse, createdResponse } from "../utils/responses.js";

// ---------- CRUD ----------
export const createGymAdmin = async (req, res) => {
  try {
    const admin = await gymAdminService.createAdmin(req.body);
    return createdResponse(
      res,
      admin,
      SUCCESS_MESSAGES.GYM_ADMIN_CREATED || "Gym admin created"
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      error.message || ERROR_MESSAGES.INVALID_INPUT,
      error
    );
  }
};

export const getGymAdmin = async (req, res) => {
  try {
    const admin = await gymAdminService.getAdminById(req.params.id);
    if (!admin) return errorResponse(res, 404, ERROR_MESSAGES.INVALID_INPUT);
    return successResponse(
      res,
      200,
      SUCCESS_MESSAGES.GYM_ADMIN_RETRIEVED || "Gym admin retrieved",
      admin
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      error.message || ERROR_MESSAGES.INVALID_INPUT,
      error
    );
  }
};

export const addGymToAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { gymId } = req.body;
    const admin = await gymAdminService.addGymToAdmin(adminId, gymId);
    return successResponse(
      res,
      200,
      SUCCESS_MESSAGES.GYM_UPDATED || "Gym added to admin",
      admin
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      error.message || ERROR_MESSAGES.INVALID_INPUT,
      error
    );
  }
};

// default export (not important for login)
export default {
  createGymAdmin,
  getGymAdmin,
  addGymToAdmin,
};

export const loginGymAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminData = await gymAdminService.loginAdmin(email, password);
    return successResponse(
      res, 
      200, 
      "Gym admin logged in successfully", 
      adminData
    );
  } catch (error) {
    const statusCode = error.message.includes("required") ? 400 : 401;
    return errorResponse(
      res,
      statusCode,
      error.message || ERROR_MESSAGES.INVALID_INPUT,
      error
    );
  }
};