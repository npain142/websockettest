const z = require('zod');

const EstablishedConnection = z.object({
	session_id: z.string(),
	client_id: z.string(),
});

const CommandRequestSchema = z.discriminatedUnion('method', [
	z.object({
		method: z.literal('join'),
		session_id: z.string(),
		username: z.string().optional(),
	}),
	z.object({
		...EstablishedConnection.shape,
		method: z.literal('create'),
	}),
	z.object({
		...EstablishedConnection.shape,
		method: z.literal('play'),
		id: z.number(),
		symbol: z.union([z.literal('X'), z.literal('O')]),
	}),
	z.object({
		...EstablishedConnection.shape,
		method: z.literal('win'),
	}),
]);

const CommandResponseSchema = z
	.discriminatedUnion('method', [
		z.object({
			method: z.literal('session_id'),
			session_id: z.string(),
		}),
		z.object({
			method: z.literal('symbol'),
			symbol: z.union([z.literal('X'), z.literal('O')]),
		}),
		z.object({
			method: z.literal('turn'),
		}),
		z.object({
			method: z.literal('end'),
			message: z.union([z.literal('Looser'), z.literal('Winner')]),
		}),
		z.object({
			method: z.literal('client_id'),
			client_id: z.string(),
		}),
	])
	// hint: workaround with or because nesting discriminated unions is yet not supported
	.or(CommandRequestSchema);

module.exports = {
	CommandRequestSchema,
	CommandResponseSchema,
};
