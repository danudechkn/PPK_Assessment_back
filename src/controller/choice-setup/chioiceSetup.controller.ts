import { Response, Request } from "express";
import { ChoiceSetupService } from "../../service/choice-setup/choiceSetup.service";

export class ChoiceSetupController {
  static async getListChoiceSetup(req: Request, res: Response) {
    try {
      const [funcunit, personnalofficegroup, positionlevel] = await Promise.all(
        [
          ChoiceSetupService.getFuncUnit(),
          ChoiceSetupService.personnalOfficeGroup(),
          ChoiceSetupService.positionLevel(),
        ],
      );

      if (!funcunit || !personnalofficegroup || !positionlevel) {
        return res.status(404).json({
          success: false,
          message: "Data not exist",
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        message: "Success",
        data: {
          personnalofficegroup,
          positionlevel,
          funcunit,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Error",
        error: error,
      });
    }
  }
}
