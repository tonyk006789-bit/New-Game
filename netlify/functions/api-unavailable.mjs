// Keep API requests out of the SPA until a hosted player service is configured.
export default async () => Response.json({
  code: 'API_NOT_CONFIGURED',
  message: 'Online sign-in is not connected yet. You can explore the guest preview.',
}, {status: 503, headers: {'Cache-Control': 'no-store'}});
