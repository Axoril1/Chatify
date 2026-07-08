import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const AI_MODEL = "openai/gpt-oss-20b";