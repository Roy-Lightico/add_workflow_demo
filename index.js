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
      ss: function (el) {},
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
    customerData: { "name": customer_name },
  };
  return data;
};

const getSessionId = async (customer_name, customerEmail, toPhone) => {
  let data = {};
  toPhone === "on"
    ? (data = editData(customerEmail, customer_name))
    : (data = {
        sourceName: "lightico",
        userName: "na1test@lightico.com",
        email: customerEmail,
        customerName: customer_name,
        emailSubject: "You have an invitation from Lightico",
        sendNow: true,
        chatEnabled: true,
        customerData: { 
          "web_email": customerEmail,
          "name": customer_name,

           },
      });

  try {
    let sessionID = await axios({
      method: "post",
      url: "https://api.lightico.com/v2.3/sessions",
      data: data,
      headers: {
        // apiKey: process.env.na1_api_key,
        // tenantId: process.env.na1_tenantId,
        Authorization: process.env.na1_access_token
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
    Rental_Agreement: "bece8ea6-00b0-4adf-992e-32f2fad0f002",
    Loan_Terms: "2f7cc844-d80a-4146-8cf6-720c367f9703",
    Purchase_Agreement: "0cb6a9af-5c61-469b-9e72-886a3254404c",
    Proof_of_financing: "d9ab22aa-3104-49f5-8631-78206b170563",
  };
  let esignDocuments = [];
  templates.map((template, index) => {
    let idxNum = (index + 1)
    esignDocuments.push(
      {
        step: index,
        name: `This is step #${idxNum} of the workflow`,
        documents: {
          esignDocuments: [
            {
              templateId: tempID[template]
            },
          ],
        },
      },
    );
  });
  return esignDocuments;
};
const addWorkflow = async (
  customerName,
  customerEmail,
  phone,
  templates_to_add
) => {
  let workflowId = "cdcabcf0-ea0a-4a4f-b542-bb6022417cc8";
  let data = {};
  data = {
    name: "Workflow Test",
    steps: editEsignDocs(templates_to_add)
  };
  console.log("my new data, before sessionID", data)
  try {
    let sessionId = await getSessionId(customerName, customerEmail, phone);
    try {
      let workFlow = await axios({
        method: "post",
        url: `https://sandboxapi.lightico.com/v2.6/sessions/${sessionId}/workflows`,
        data: data,
        headers: {
          Authorization: process.env.na1_access_token,
        },
      });
      console.log("added workflow to session", workFlow.data.workflowId);
      let wfId = workFlow.data.workflowId;
    } catch (error) {
      console.log("Add Wrokflow Error", error);
    }
 
    return;
  } catch (error) {
    console.log("inside final error", error);
  }
};

app.get("/", (req, res) => {
  res.render("main", {
    layout: "index",
  });
});

app.post("/submit", (req, res) => {
  const { name, contact_info, toPhone, templates_to_add } = req.body;
  console.log("my Request", req.body);
  try {
    res.render("main", {
      layout: "index",
      api: addWorkflow(name, contact_info, toPhone, templates_to_add),
    });
  } catch (error) {
    console.error("MY ERROR", error.response);
  }
});

app.listen(port, () => console.log(`App listening to port ${port}`));

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
    // try {
    //   console.log("inside update session");
    //   let updateSession = await axios({
    //     method: "patch",
    //     url: `https://sandboxapi.lightico.com/V2.3/sessions/${sessionId}`,
    //     data: {
    //       sessionEnabled: true,
    //       startSession: true,
    //     },
    //     headers: {
    //       Authorization: process.env.access_token,
    //     },
    //   });
    //   console.log(
    //     "session started",
    //     `${updateSession.status} : ${updateSession.statusText}`
    //   );
    // } catch (error) {
    //   console.log("inside updateSessionError", error);
    // }
    // const editCoSignerData = (templateId, coSigner_Name, coSigner_Email) => {
    //   data = {
    //     templateId: templateId,
    //     participantId: 1,
    
    //     coSigners: [
    //       {
    //         participantId: 2,
    //         name: coSigner_Name,
    //         phoneNumber: coSigner_Email,
    //         orderGroupId: 1,
    //         fields: { "co signer full name": coSigner_Name },
    //       },
    //     ],
    //   };
    
    //   return data;
    // };