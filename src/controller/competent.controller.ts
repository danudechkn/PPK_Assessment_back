import CategoriesController from "./competent/categories.controller";
import CompetenciesController from "./competent/competencies.controller";
import BehaviorsController from "./competent/behaviors.controller";

export { CategoriesController, CompetenciesController, BehaviorsController };

/**
 * @deprecated แนะนำให้ import แยกตาม domain:
 * - CategoriesController จาก "./competent/categories.controller"
 * - CompetenciesController จาก "./competent/competencies.controller"
 * - BehaviorsController จาก "./competent/behaviors.controller"
 */
class CompetentController {
  // ==========================================
  // Competencies Categories
  // ==========================================
  static getAllCategories = CategoriesController.getAllCategories;
  static getCategoriesFull = CategoriesController.getCategoriesFull;
  static getCategoryById = CategoriesController.getCategoryById;
  static createCategory = CategoriesController.createCategory;
  static updateCategory = CategoriesController.updateCategory;
  static deleteCategory = CategoriesController.deleteCategory;

  // ==========================================
  // Competencies
  // ==========================================
  static getCompetent = CompetenciesController.getCompetent;
  static getCompetentById = CompetenciesController.getCompetentById;
  static getCompetentByUserAccess = CompetenciesController.getCompetentByUserAccess;
  static getCompetenciesByCategory = CompetenciesController.getCompetenciesByCategory;
  static createCompetent = CompetenciesController.createCompetent;
  static updateCompetent = CompetenciesController.updateCompetent;
  static deleteCompetent = CompetenciesController.deleteCompetent;

  // ==========================================
  // Behaviors
  // ==========================================
  static getBehavior = BehaviorsController.getBehavior;
  static getBehaviorById = BehaviorsController.getBehaviorById;
  static getBehaviorsByCompetency = BehaviorsController.getBehaviorsByCompetency;
  static createBehavior = BehaviorsController.createBehavior;
  static updateBehavior = BehaviorsController.updateBehavior;
  static deleteBehavior = BehaviorsController.deleteBehavior;
}

export default CompetentController;
