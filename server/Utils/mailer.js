import nodemailer from "nodemailer";
import env from "../Config/env.js";
import logger from "./logger.js";

let transporter = null;

const getTransporter = () => {
  if (!env.SMTP.host || !env.SMTP.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP.host,
      port: env.SMTP.port,
      secure: env.SMTP.port === 465,
      auth: { user: env.SMTP.user, pass: env.SMTP.pass },
    });
  }
  return transporter;
};

/**
 * Sends mail when SMTP is configured. Without SMTP (local dev) the message is
 * logged instead, so flows such as password reset remain testable.
 */
export const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx) {
    logger.warn(`SMTP not configured — mail not sent. To: ${to} | ${subject}`);
    logger.info(`Mail body: ${text}`);
    return { delivered: false };
  }
  await tx.sendMail({ from: env.SMTP.from, to, subject, text, html });
  logger.info(`Mail sent to ${to}: ${subject}`);
  return { delivered: true };
};
