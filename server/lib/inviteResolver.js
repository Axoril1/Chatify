import User from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function resolveInvites(invites, excludeEmail) {
  const cleaned = [...new Set(invites.map((i) => i.trim()))].filter(Boolean);

  const emailInvites = cleaned
    .filter((i) => EMAIL_REGEX.test(i))
    .map((i) => i.toLowerCase())
    .filter((email) => email !== excludeEmail);
  const usernameInvites = cleaned.filter((i) => !EMAIL_REGEX.test(i));

  const usersByEmail = emailInvites.length
    ? await User.find({ email: { $in: emailInvites } })
    : [];
  const resolvedEmailSet = new Set(usersByEmail.map((u) => u.email));
  const pendingInvites = emailInvites.filter((email) => !resolvedEmailSet.has(email));

  const usersByUsername = usernameInvites.length
    ? await User.find({ username: { $in: usernameInvites } })
    : [];
  const foundUsernameSet = new Set(usersByUsername.map((u) => u.username));
  const notFoundUsernames = usernameInvites.filter((u) => !foundUsernameSet.has(u));

  const userIds = [
    ...usersByEmail.map((u) => u._id.toString()),
    ...usersByUsername.map((u) => u._id.toString()),
  ];

  return { userIds, pendingInvites, notFoundUsernames };
}