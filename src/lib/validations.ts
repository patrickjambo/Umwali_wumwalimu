import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Shyiramo email yuzuye." }),
  password: z.string().min(6, { message: "Ijambo banga rigomba kuba nibura inyuguti 6." }),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, { message: "Izina rigomba kuba nibura inyuguti 2." }),
});
