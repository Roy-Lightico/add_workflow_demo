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
const editData = (customerEmail, customerName) => {
  data = {
    sourceName: "lightico",
    userName: "na1test@lightico.com",
    phoneNumber: customerEmail,
    customerName: customerName,
    emailSubject: "You have an invitation from Lightico",
    sendNow: true,
    chatEnabled: true,
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
      },
    ],
  };

  return data;
};
const getSessionId = async (customerName, customerEmail, toPhone) => {
  let data = {};
  toPhone === "on"
    ? (data = editData(customerEmail, customerName))
    : (data = {
        sourceName: "lightico",
        userName: "na1test@lightico.com",
        email: customerEmail,
        customerName: customerName,
        emailSubject: "You have an invitation from Lightico",
        sendNow: true,
        chatEnabled: true,
      });

  try {
    let sessionID = await axios({
      method: "post",
      url: "https://api.lightico.com/v2.3/sessions",
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

const addEsign = async (name, email, templateId, toPhone, toPhoneCoSigner) => {
  const [customerName, coSigner_Name] = name;
  const [customerEmail, coSigner_Email] = email;
  const phone = toPhone;
  const coSignerPhone = toPhoneCoSigner;
  let data = {};
  toPhoneCoSigner === "on"
    ? (data = editCoSignerData(templateId, coSigner_Name, coSigner_Email))
    : (data = {
        templateId: templateId,
        participantId: 1,
        coSigners: [
          {
            participantId: 2,
            name: coSigner_Name,
            email: coSigner_Email,
            orderGroupId: 1,
          },
        ],
      });

  try {
    let sessionId = await getSessionId(customerName, customerEmail, phone);
    let eSgin = await axios({
      method: "post",
      url: `https://api.lightico.com/V2.5/sessions/${sessionId}/esigns`,
      data: data,
      headers: {
        apiKey: process.env.api_Key,
        tenantId: process.env.tenant_Id,
      },
    });
    let esignId = eSgin.data.esignId;
    console.log("Got eSignId", esignId);

    return esignId;
  } catch (error) {
    console.error("MY ERROR", error.response);
  }
};

app.get("/", (req, res) => {
  res.render("main", {
    layout: "index",
  });
});

app.post(
  "/sign",
  // [body("username").isEmail().escape()],

  (req, res) => {
    const { name, contact_info, template, toPhone, toPhoneCoSigner } = req.body;
    let templates = {
      Demo1: "2f7cc844-d80a-4146-8cf6-720c367f9703",
      Demo2: "d8f52ede-c60a-4fae-8fbc-ad848c63a8f0",
    };
    console.log("my Request", req.body);
    try {
      res.render("main", {
        layout: "index",
        api: addEsign(
          name,
          contact_info,
          templates[template],
          toPhone,
          toPhoneCoSigner
        ),
      });
    } catch (error) {
      console.error("MY ERROR", error.response);
    }
  }
);

app.listen(port, () => console.log(`App listening to port ${port}`));
