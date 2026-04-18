const libraryService = require("../services/library.service");

const libraryController = {
  async getAllMaterials(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        item_type,
        category_id,
        grade_level,
        subject_id,
      } = req.query;
      const result = await libraryService.getAllMaterials({
        page,
        limit,
        item_type,
        category_id,
        grade_level,
        subject_id,
      });

      res.status(200).json({
        data: result.materials,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;
      const material = await libraryService.getMaterialById(parseInt(id));

      res.status(200).json({
        data: material,
      });
    } catch (error) {
      if (error.message === "Material not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async createMaterial(req, res, next) {
    try {
      const materialData = {
        ...req.body,
        uploaded_by: req.user.user_id,
      };

      const material = await libraryService.createMaterial(materialData);

      res.status(201).json({
        message: "Material created successfully",
        data: material,
      });
    } catch (error) {
      if (error.message === "Uploader not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Subject not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const material = await libraryService.updateMaterial(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: "Material updated successfully",
        data: material,
      });
    } catch (error) {
      if (error.message === "Material not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Category not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Subject not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;
      await libraryService.deleteMaterial(parseInt(id));

      res.status(200).json({
        message: "Material deleted successfully",
      });
    } catch (error) {
      if (error.message === "Material not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async addCopy(req, res, next) {
    try {
      const { id } = req.params;
      const copyData = {
        item_id: parseInt(id),
        ...req.body,
      };

      const copy = await libraryService.addCopy(copyData);

      res.status(201).json({
        message: "Copy added successfully",
        data: copy,
      });
    } catch (error) {
      if (error.message === "Material not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message === "Copy code already exists" ||
        error.message === "Copy code already exists for this material"
      ) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateCopyStatus(req, res, next) {
    try {
      const { copyId } = req.params;
      const { status, condition } = req.body;

      const copy = await libraryService.updateCopyStatus(parseInt(copyId), {
        status,
        condition,
      });

      res.status(200).json({
        message: "Copy status updated successfully",
        data: copy,
      });
    } catch (error) {
      if (error.message === "Material copy not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async borrowMaterial(req, res, next) {
    try {
      const borrowData = req.body;
      const record = await libraryService.borrowMaterial(borrowData);

      res.status(201).json({
        message: "Material borrowed successfully",
        data: record,
      });
    } catch (error) {
      if (error.message === "Material copy not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Material copy is not available for borrowing") {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === "A valid borrower is required") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async returnMaterial(req, res, next) {
    try {
      const { borrowId } = req.params;
      const { penalty_cost, remarks } = req.body;

      const record = await libraryService.returnMaterial(parseInt(borrowId), {
        penalty_cost,
        remarks,
      });

      res.status(200).json({
        message: "Material returned successfully",
        data: record,
      });
    } catch (error) {
      if (error.message === "Borrow record not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Material has already been returned") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async getBorrowHistory(req, res, next) {
    try {
      const { page = 1, limit = 10, student_id, user_id, status, copy_status } = req.query;
      const result = await libraryService.getBorrowHistory({
        page,
        limit,
        student_id,
        user_id,
        status,
        copy_status,
      });

      res.status(200).json({
        data: result.records,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllCategories(req, res, next) {
    try {
      const categories = await libraryService.getAllCategories();

      res.status(200).json({
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllSubjects(req, res, next) {
    try {
      const subjects = await libraryService.getAllSubjects();

      res.status(200).json({
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  },

  async lookupBorrowers(req, res, next) {
    try {
      const { q } = req.query;
      const borrowers = await libraryService.lookupBorrowers(q);

      res.status(200).json({
        data: borrowers,
      });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { category_name } = req.body;
      const category = await libraryService.createCategory(category_name);

      res.status(201).json({
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      if (error.message === "Category already exists") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { category_name } = req.body;
      const category = await libraryService.updateCategory(parseInt(categoryId), category_name);

      res.status(200).json({
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      if (error.message === "Category not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Category already exists") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = libraryController;
