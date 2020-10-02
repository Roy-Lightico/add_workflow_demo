require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
//Loads the handlebars module
const handlebars = require("express-handlebars");
//Sets our app to use the handlebars engine
app.set("view engine", "hbs");
//Sets handlebars configurations (we will go through them later on)
app.engine(
  "hbs",
  handlebars({
    layoutsDir: __dirname + "/views/layouts",
    extname: "hbs",
    defaultLayout: "planB",
    partialsDir: __dirname + "/views/partials/",
    helpers: {
      ss: function (el) {
        // let x = document.getElementById("test");
        // console.log("inside helper", x);
        // // let x = Document.getElementById("tests");
        // console.log(el);
        // return "hi";
      },
    },
  })
);
app.use(express.static("public"));
const { body, validationResult } = require("express-validator");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const editData = (customerEmail, customer_name) => {
  data = {
    sourceName: "lightico",
    userName: "na1test@lightico.com",
    phoneNumber: customerEmail,
    customerName: customer_name,
    emailSubject: "You have an invitation from Lightico",
    sendNow: true,
    chatEnabled: true,
    customerData: { customer_name },
  };
  return data;
};
const editCoSignerData = (templateId, coSigner_Name, coSigner_Email) => {
  data = {
    templateId: templateId,
    participantId: 1,

    coSigners: [
      {
        participantId: 2,
        name: coSigner_Name,
        phoneNumber: coSigner_Email,
        orderGroupId: 1,
        fields: { "co signer full name": coSigner_Name },
      },
    ],
  };

  return data;
};
const getSessionId = async (customer_name, customerEmail, toPhone) => {
  let data = {};
  toPhone === "on"
    ? (data = editData(customerEmail, customer_name))
    : (data = {
        sourceName: "lightico",
        userName: "RoySandbox@lightico.com",
        email: customerEmail,
        customerName: customer_name,
        emailSubject: "You have an invitation from Lightico",
        sendNow: false,
        chatEnabled: true,
        customerData: { customer_name },
      });

  try {
    let sessionID = await axios({
      method: "post",
      url: "https://sandboxapi.lightico.com/v2.3/sessions",
      data: data,
      headers: {
        apiKey: process.env.api_Key,
        tenantId: process.env.tenant_Id,
      },
    });
    let ID = sessionID.data.sessionId;
    console.log("Got SessionId", ID);
    return ID;
  } catch (error) {
    console.error("MY ERROR", error.response);
  }
};
const editEsignDocs = (templates, customerName) => {
  let tempID = {
    Rental_Agreement: "c0508860-66b1-4bfd-b012-bd936ec462b2",
    Loan_Terms: "9d7ef83c-137b-4768-8487-eea86a236eaf",
    Purchase_Agreement: "87aa9176-3fe6-415e-8375-f3ed6471d4c2",
    Proof_of_financing: "58a16337-104e-4c47-8d74-8d79f93c50ea",
  };
  let esignDocuments = [];
  templates.map((template) => {
    console.log("before", template);
    esignDocuments.push({
      templateId: `${tempID[template]}`,
      name: `${template}`,
      fields: {
        personal_first_name: `${customerName}`,
      },
    });
  });
  // console.log("my esigndocs are.......", esignDocuments);
  return esignDocuments;
};
const addWorkflow = async (
  customerName,
  customerEmail,
  phone,
  templates_to_add
) => {
  let templates = {
    Rental_Agreement: "c0508860-66b1-4bfd-b012-bd936ec462b2",
    Loan_Terms: "9d7ef83c-137b-4768-8487-eea86a236eaf",
    Purchase_Agreement: "87aa9176-3fe6-415e-8375-f3ed6471d4c2",
    Proof_of_financing: "58a16337-104e-4c47-8d74-8d79f93c50ea",
  };

  let workflowId = "cdcabcf0-ea0a-4a4f-b542-bb6022417cc8";
  let data = {};
  data = {
    templateId: `${workflowId}`,
    name: "Workflow Test",
    steps: [
      {
        step: 0,
        name: "step 0 initiated",
        documents: {
          esignDocuments: editEsignDocs(templates_to_add, customerName),
        },
      },
    ],
  };
  try {
    // let accessToken = await axios({
    //   method: 'post',
    //   url: "https://sandboxapi.lightico.com/v2.3/services/oauth2/token",
    //   headers: {
    //     apiKey: process.env.api_Key,
    //     tenantId: process.env.tenant_Id,
    //   }
    // })
    let sessionId = await getSessionId(customerName, customerEmail, phone);
    let tempData = {
      name: "nmmnmn",
      steps: [
        {
          step: 0,
          name: "Step 0 Name",
          documents: {
            esignDocuments: [
              {
                templateId: "87aa9176-3fe6-415e-8375-f3ed6471d4c2",
                name: "yyy",
                fields: {
                  first_name: "Riley",
                },
              },
              {
                templateId: "58a16337-104e-4c47-8d74-8d79f93c50ea",
              },
            ],
          },
        },
        {
          step: 1,
          name: "Step 1 Name",
          documents: {
            esignDocuments: [
              {
                templateId: "9d7ef83c-137b-4768-8487-eea86a236eaf",
              },
            ],
          },
        },
      ],
    };
    let workFlow = await axios({
      method: "post",
      url: `https://sandboxapi.lightico.com/v2.6/sessions/${sessionId}/workflows`,
      data: tempData,
      headers: {
        Authorization: process.env.access_token,
      },
    });
    console.log("added workflow to session", workFlow);
    let wfId = workFlow.data.workflowId;
    console.log("Data before....", data);
    let updateSession = await axios({
      method: "patch",
      url: `https://sandboxapi.lightico.com/V2.3/sessions/${sessionId}`,
      data: {
        sessionEnabled: true,
        startSession: true,
      },
      headers: {
        // apiKey: process.env.api_Key,
        // tenantId: process.env.tenant_Id,
        Authorization: process.env.access_token,
      },
    });
    console.log(
      "session started",
      `${updateSession.status} : ${updateSession.statusText}`
    );

    return workFlow;
  } catch (error) {}
};

// const addEsign = async (name, email, templateId, toPhone, toPhoneCoSigner) => {
//   const [customerName, coSigner_Name] = name;
//   const [customerEmail, coSigner_Email] = email;
//   // let cosigner_name = coSigner_Name;
//   const phone = toPhone;
//   const coSignerPhone = toPhoneCoSigner;
//   let data = {};
//   toPhoneCoSigner === "on"
//     ? (data = editCoSignerData(templateId, coSigner_Name, coSigner_Email))
//     : (data = {
//         templateId: templateId,
//         participantId: 1,
//         coSigners: [
//           {
//             participantId: 2,
//             name: coSigner_Name,
//             email: coSigner_Email,
//             orderGroupId: 1,
//             fields: { "co signer full name": coSigner_Name },
//           },
//         ],
//       });

//   try {
//     let sessionId = await getSessionId(customerName, customerEmail, phone);
//     let eSgin = await axios({
//       method: "post",
//       url: `https://api.lightico.com/V2.5/sessions/${sessionId}/esigns`,
//       data: data,
//       headers: {
//         apiKey: process.env.api_Key,
//         tenantId: process.env.tenant_Id,
//       },
//     });
//     let esignId = eSgin.data.esignId;
//     console.log("Got eSignId", esignId);

//     return esignId;
//   } catch (error) {
//     console.error("MY ERROR", error.response);
//   }
// };

app.get("/", (req, res) => {
  res.render("main", {
    layout: "index",
  });
});

app.post(
  "/submit",
  // [body("username").isEmail().escape()],

  (req, res) => {
    const { name, contact_info, toPhone, templates_to_add } = req.body;
    // let templates = {
    //   Demo1: "2f7cc844-d80a-4146-8cf6-720c367f9703",
    //   Demo2: "d8f52ede-c60a-4fae-8fbc-ad848c63a8f0",
    // };
    console.log("my Request", req.body);
    try {
      res.render("main", {
        layout: "index",
        api: addWorkflow(name, contact_info, toPhone, templates_to_add),
      });
    } catch (error) {
      console.error("MY ERROR", error.response);
    }
  }
);

app.listen(port, () => console.log(`App listening to port ${port}`));
