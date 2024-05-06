const express = require("express");
const router = express.Router();
const { generatePDF } = require("../Utils/pdfshow");
const student = require("../Models/Student");
const { validationResult, body } = require("express-validator");
router.post(
  "/pdfgenerate",
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required.")
      .isLength({ min: 3 })
      .withMessage("Name should be atleast 3 characters."),
    body("course").notEmpty().withMessage("Course is required."),
    body("certificatedate")
      .notEmpty()
      .withMessage("Date of certificate is required."),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = {};
        errors.array().forEach((error) => {
          if (!errorMessages[error.path]) {
            errorMessages[error.path] = [];
          }
          errorMessages[error.path].push(error.msg);
        });
        return res
          .status(400)
          .json({ success: false, message: errorMessages, errors });
      }
      const result = await generatePDF({
        name: req.body.name,
        course: req.body.course,
        certificatedate: req.body.certificatedate,
      });
      const existName = await student.find({ name: req.body.name });
      if (existName.length > 0) {
        existName[0].certificates.push({
          course: req.body.course,
          certificatedate: req.body.certificatedate,
          certificatelink: result.driveLink,
        });
        await student.updateOne(
          { name: req.body.name },
          { certificates: existName[0].certificates }
        );
        return res
          .status(200)
          .json({ certificatelink: result.driveLink, success: true });
      }
      await student
        .create({
          name: req.body.name,
          certificates: [
            {
              course: req.body.course,
              certificatedate: req.body.certificatedate,
              certificatelink: result.driveLink,
            },
          ],
        })
        .then(() => {
          res
            .status(200)
            .json({ certificatelink: result.driveLink, success: true });
        })
        .catch((error) => {
          res.status(400).json({
            success: false,
            message: "PDF not generated. Try again.",
            error,
          });
        });
    } catch (error) {
      console.error("Error adding text to PDF:", error);
      res
        .status(500)
        .json({ success: false, errorm: "Internal Server Error", error });
    }
  }
);

module.exports = router;
