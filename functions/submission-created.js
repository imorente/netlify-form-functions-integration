const fetch = require("node-fetch");
const mandrill = require("mandrill-api/mandrill");
exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { name, email, message } = JSON.parse(event.body).payload || {};

  console.log("Sending email via mandrill");

  const mandrillClient = new mandrill.Mandrill(process.env.MANDRILL_API_KEY);
  const emailMessage = {
    html: "<p>Example HTML content</p>",
    text: "Example text content",
    subject: "example subject",
    from_email: "message.from_email@example.com",
    from_name: "Example Name",
    to: [
      {
        email: email,
        name: name,
        type: "to"
      }
    ],
    headers: {
      "Reply-To": "message.reply@example.com"
    },
    subaccount: "marketing-oreilly-book"
  };
  mandrillClient.messages.send(
    { message: emailMessage },
    result => {
      console.log("Email sent:" + result);
    },
    err => {
      console.log("A mandrill error occurred: " + e.name + " - " + e.message);
    }
  );

  // Send greeting to Slack
  return fetch(process.env.SLACK_WEBHOOK_URL, {
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ text: `${name} says ${message}!` })
  })
    .then(() => ({
      statusCode: 200,
      body: `Hello, ${name}! Your greeting has been sent to Slack 👋`
    }))
    .catch(error => ({
      statusCode: 422,
      body: `Oops! Something went wrong. ${error}`
    }));
};
