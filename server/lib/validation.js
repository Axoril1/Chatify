import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(24),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(24).optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(72),
});

export const channelCreateSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(50),
  invites: z.array(z.string().trim().min(1)).max(20).optional().default([]),
});

export const inviteSchema = z.object({
  invites: z.array(z.string().trim().min(1)).min(1, "At least one invite is required").max(20),
});

export const groupAvatarSchema = z.object({
  avatarUrl: z.string().url("A valid avatar URL is required"),
});

export const dmCreateSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
});

const attachmentSchema = z
  .object({
    url: z.string().url(),
    publicId: z.string().optional(),
    fileName: z.string().max(255).optional(),
    fileType: z.string().max(255).optional(),
    fileSize: z.number().optional(),
    resourceType: z.string().optional(),
  })
  .optional();

export const messageCreateSchema = z
  .object({
    channelId: z.string().min(1, "channelId is required"),
    content: z.string().trim().max(4000, "Message is too long").optional().default(""),
    attachment: attachmentSchema,
  })
  .refine((data) => data.content?.trim() || data.attachment?.url, {
    message: "Message must have content or an attachment",
  });

export const messageEditSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty").max(4000, "Message is too long"),
});

export const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(8),
});

export const automationCreateSchema = z.object({
  channelId: z.string().min(1, "channelId is required"),
  keyword: z.string().trim().toLowerCase().min(1, "Keyword is required").max(50),
  response: z.string().trim().min(1, "Response is required").max(500),
});

export const summarizeSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};