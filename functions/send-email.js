const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signed(event) {
  const signature = event.headers["x-webhook-signature"];
  if (!signature) {
    console.log("Missing x-webhook-signature");
    return false;
  }

  const { sha256 } = jwt.verify(signature, process.env.JWS_SECRET);
  const hash = crypto
    .createHash("sha256")
    .update(event.body)
    .digest("hex");
  console.log("hash: " + hash + ". sha:" + sha256);
  return sha256 === hash;
}

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  console.log("Event: " + JSON.stringify(event));
  console.log("Context: " + JSON.stringify(context));

  if (!signed(event)) {
    console.log("Invalid signature");
    return {
      statusCode: 403
    };
  }

  const { name, email, data = {} } = JSON.parse(event.body);

  if (!email) {
    console.log("Missing email address");
    return {
      statusCode: 422,
      body: "Missing email"
    };
  }

  console.log(
    `Sending email to ${name} <${email}>. Data: ` + JSON.stringify(data)
  );

  return fetch("https://mandrillapp.com/api/1.0/messages/send.json", {
    headers: {
      "content-type": "application/json",
      "X-MC-Subaccount": "marketing-oreilly-book"
    },
    method: "POST",
    body: JSON.stringify({
      key: process.env.MANDRILL_API_KEY,
      message: {
        from_email: "irene@netlify.com",
        to: [
          {
            email: email,
            name: name,
            type: "to"
          }
        ],
        autotext: "true",
        subject: "test",
        html: "test"
      }
    })
  })
    .then(() => {
      console.log("email sent");
      return {
        statusCode: 200,
        body: "Email sent"
      };
    })
    .catch(error => {
      console.log("Something went wrong: " + error);
      return {
        statusCode: 422,
        body: `Oops! Something went wrong. ${error}`
      };
    });
};
