const { sendSuccess, sendError } = require('../../utils/responseHelper');
const db = require('../../utils/db'); // assume SQL connection here

const getApplicationSettting = async (req, res, next) => {
  try {
    const query = "SELECT * FROM prav_ai_application_settings";

    db.query(query, [], (err, results) => {
      if (err) return next(err);

      if (results.rows.length === 0) {
        return sendError(
            res,
            "Application details not found. Please contact the administrator.",
            404,
            "APP_NOT_FOUND"
          );
      }

      const data = results.rows[0];


      // --- Transform DB result to required JSON format ---
 
      return sendSuccess(
        res,
        "Application details loaded successfully.",
        transformApplicationSettings(data)
      );
    });

  } catch (err) {
    next(err);
    return sendError(
      res,
      "Internal server error",
      500,
      "SERVER_ERROR"
    );
  }
};
const transformApplicationSettings = (data) => {
  if (!data) return null;

  return [{
    applicationInfo: {
      name: data.applicationname,
      logo: data.applicationlogo,
      version: `Version ${data.applicationversion}`,
      description: data.applicationdescription
    },
    companyDetails: {
      companyName: data.companyname,
      companyLogo: data.companylogo,
      website: data.companywebsite
    },
    maintenance: {
      isMaintenanceMode :data.ismaintenancemode,
      maintenanceMessage : data.maintenancemessage,
    },
    settings: {
      theme: data.themedefault,
      enableThemeChange: data.enablethemechange,
      showAI: data.enableai
    },
    professionalServices: {
      supportEmail: data.supportemail,
      supportContact: data.supportphone,
      documentationUrl: data.documentationurl,
      termsAndConditionsUrl: data.termsurl,
      privacyPolicyUrl: data.privacyurl
    }
  }];
};
;



module.exports = { getApplicationSettting };
