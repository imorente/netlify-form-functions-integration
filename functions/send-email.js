const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { name, email, data = {} } = JSON.parse(event.body).payload || {};

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
