const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* Verifies submission has been invoked by a Netlify webhook
https://www.netlify.com/docs/webhooks/#url-notifications
*/
function signed(event) {
  const signature = event.headers["x-webhook-signature"];
  if (!signature) {
    console.log("Missing x-webhook-signature");
    return false;
  }

  const { iss, sha256 } = jwt.verify(signature, process.env.JWS_SECRET);
  const hash = crypto
    .createHash("sha256")
    .update(event.body)
    .digest("hex");

  return iss === "netlify" && sha256 === hash;
}

function sendEmail({ name, email }) {
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
        subject: "This is the subject of the email",
        text: "This is the body of the email"
      }
    })
  });
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  if (!signed(event)) {
    return {
      statusCode: 403,
      body: "Invalid signature"
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

  return sendEmail({ name, email })
    .then(() => {
      console.log(`Email sent to ${name} <${email}>`);
      return {
        statusCode: 200,
        body: "Email sent"
      };
    })
    .catch(error => {
      console.log(`Error sending email to ${name} <${email}>: ${error}`);
      return {
        statusCode: 422,
        body: `Oops! Something went wrong. ${error}`
      };
    });
};
