const usersService = require("../services/users.service");

const usersController = {
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, role, status } = req.query;
      const result = await usersService.getAllUsers({
        page,
        limit,
        role,
        status,
      });

      res.status(200).json({
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(parseInt(id));

      res.status(200).json({
        data: user,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = await usersService.updateUser(parseInt(id), updateData);

      res.status(200).json({
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Email is already in use") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * PATCH /users/:id/account
   * Update a user's account_status and/or roles in one request.
   * Body: { "account_status": "Active", "roles": ["Teacher", "Parent"] }
   * Both fields are optional — supply one or both.
   */
  async updateAccountSettings(req, res, next) {
    try {
      const { id } = req.params;
      const { account_status, roles } = req.body;

      const user = await usersService.updateAccountSettings(parseInt(id), {
        account_status,
        roles,
      });

      res.status(200).json({
        message: "User account settings updated successfully",
        data: user,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.startsWith("User account is already")) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async assignRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const userRole = await usersService.assignRole(parseInt(id), role);

      res.status(201).json({
        message: "Role assigned successfully",
        data: userRole,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "User already has this role") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async removeRole(req, res, next) {
    try {
      const { id, roleId } = req.params;
      await usersService.removeRole(parseInt(id), parseInt(roleId));

      res.status(200).json({
        message: "Role removed successfully",
      });
    } catch (error) {
      if (error.message === "Role not found for this user") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = usersController;