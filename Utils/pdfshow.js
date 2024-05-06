const PDFLib = require("pdf-lib");
const fs = require("fs");
const { google } = require("googleapis");
const apikey = require("../apikey.json");
const { Readable } = require("stream");
const fontkit = require("@pdf-lib/fontkit"); // Import fontkit
const path = require("path");

async function generatePDF(details) {
  try {
    const templatePath = path.join(__dirname, "../TDC.pdf");
    const templateBytes = await fs.promises.readFile(templatePath);

    const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    pdfDoc.registerFontkit(fontkit);
    const fontpath = path.join(__dirname, "../SedanSC-Regular.ttf");

    const sedanFontBytes = await fs.promises.readFile(fontpath);
    const sedanFont = await pdfDoc.embedFont(sedanFontBytes);
    const nameText = details.name;
    const courseText = details.course;
    const approvalDateText = details.certificatedate;
    let xPosition = width / 2 - 150;
    const yPosition = height / 2 + 70;
    const fontSize = 50;
    const textColor = PDFLib.rgb(255 / 255, 191 / 255, 0 / 255);
    const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    function toCamelCase(str) {
      return str.replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
    }
    var namestring = toCamelCase(nameText);
    for (const char of namestring) {
      const charWidth = sedanFont.widthOfTextAtSize(char, fontSize);
      page.drawText(char, {
        x: xPosition,
        y: yPosition,
        size: fontSize,
        font: sedanFont,
        color: textColor,
      });
      xPosition += charWidth;
    }

    page.drawText(`For successfully completing the ${courseText}`, {
      x: width / 2 - 180,
      y: height / 2 + 10,
      size: 20,
      font: boldFont,
    });

    page.drawText(`course on ${approvalDateText}.`, {
      x: width / 2 - 80,
      y: height / 2 - 20,
      size: 18,
      font: boldFont,
    });

    const SCOPE = ["https://www.googleapis.com/auth/drive"];

    const authClient = new google.auth.JWT(
      apikey.client_email,
      null,
      apikey.private_key,
      SCOPE
    );

    await authClient.authorize();

    const drive = google.drive({ version: "v3", auth: authClient });
    const fileMetaData = {
      name: `${nameText}-certificate.pdf`,
      parents: ["1yj9YTyIMa6BbQblxL6-5PKJlzhazI2lj"], // A folder ID to which file will get uploaded
      mimeType: "application/pdf",
    };

    // Obtain PDF content and convert it into a buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Convert PDF buffer into a readable stream
    const pdfStream = Readable.from(pdfBuffer);

    const response = await drive.files.create({
      resource: fileMetaData,
      media: {
        mimeType: "application/pdf",
        body: pdfStream,
      },
      fields: "id",
    });

    const fileUrl = `https://drive.google.com/uc?id=${response.data.id}&export=download`;
    return { driveLink: fileUrl };
  } catch (error) {
    console.error("Error generating PDF and uploading to Google Drive:", error);
    throw error;
  }
}

module.exports = { generatePDF };
