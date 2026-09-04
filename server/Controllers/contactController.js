import env from "../Config/env.js";
import { validateBody } from "../Utils/validators.js";
import { sendMail } from "../Utils/mailer.js";
import logger from "../Utils/logger.js";
import asyncHandler from "../Middleware/asyncHandler.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = validateBody(req.body, {
    name: { required: true, min: 2, max: 60, label: "Name" },
    email: { required: true, type: "email", label: "Email" },
    message: { required: true, min: 10, max: 2000, label: "Message" },
  });

  logger.info(`Contact form submitted by ${email}`);

  await sendMail({
    to: env.CONTACT_TO || env.SMTP.from,
    subject: `EcoRecycle contact form — ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  res.status(201).json({
    success: true,
    message: "Thanks — your message has been received",
  });
});
