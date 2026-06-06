const PORT = process.env.PORT || 5000;

const bearerAuth = [{ bearerAuth: [] }];

const successResponse = (description, schemaRef) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, schemaRef ? { properties: { data: schemaRef } } : {}],
      },
    },
  },
});

const errorResponse = (description, statusCode) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-f\\d]{24}$' },
  description: 'MongoDB ObjectId',
};

const memberIdParam = {
  name: 'memberId',
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-f\\d]{24}$' },
  description: 'Member user ObjectId',
};

const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
];

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HouseMate API',
    version: '1.0.0',
    description:
      'REST API for the HouseMate shared-living app — auth, houses, tasks, expenses, inventory, notifications, and gamification.',
    contact: { name: 'HouseMate' },
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Local development' },
    { url: '/api', description: 'Relative (via proxy)' },
  ],
  tags: [
    { name: 'Health', description: 'Service health check' },
    { name: 'Auth', description: 'Registration, login, tokens, profile' },
    { name: 'Houses', description: 'House creation, membership, settings, leaderboard' },
    { name: 'Tasks', description: 'Chores, assist, swap, sick leave, marketplace' },
    { name: 'Expenses', description: 'Shared house expenses and splits' },
    { name: 'Inventory', description: 'Shared household inventory' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Users', description: 'Profiles and house members' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from login/register response',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: {},
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50, example: 'Faizu' },
          email: { type: 'string', format: 'email', example: 'faizu@housemate.app' },
          password: { type: 'string', minLength: 6, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/UserSummary' },
        },
      },
      UserSummary: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          avatar: { type: 'string', nullable: true },
          house: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['admin', 'member'] },
          points: { type: 'integer' },
          rank: { type: 'integer', nullable: true },
          streak: {
            type: 'object',
            properties: {
              current: { type: 'integer' },
              longest: { type: 'integer' },
            },
          },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          avatar: { type: 'string' },
          pushToken: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      CreateHouseRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'NeoPay Boys Flat' },
          description: { type: 'string' },
          maxMembers: { type: 'integer', minimum: 2, maximum: 20 },
        },
      },
      JoinHouseRequest: {
        type: 'object',
        required: ['inviteCode'],
        properties: {
          inviteCode: { type: 'string', example: 'NEOPAY' },
        },
      },
      UpdateHouseSettingsRequest: {
        type: 'object',
        properties: {
          taskRotationEnabled: { type: 'boolean' },
          reminderTime: { type: 'string', example: '08:00' },
          timezone: { type: 'string', example: 'Asia/Kolkata' },
          pointsForCompletion: { type: 'integer' },
          pointsForAssist: { type: 'integer' },
          pointsForSickCover: { type: 'integer' },
        },
      },
      UpdateMemberRoleRequest: {
        type: 'object',
        required: ['customRole'],
        properties: {
          customRole: { type: 'string', example: 'House Champion' },
        },
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title', 'dueDate'],
        properties: {
          title: { type: 'string', example: 'Kitchen Cleaning' },
          description: { type: 'string' },
          emoji: { type: 'string', example: '🍽' },
          category: {
            type: 'string',
            enum: ['kitchen', 'bathroom', 'living_room', 'bedroom', 'laundry', 'grocery', 'trash', 'garden', 'general'],
          },
          assignedTo: { type: 'string', nullable: true },
          dueDate: { type: 'string', format: 'date-time' },
          scheduledTime: { type: 'string', example: '09:00' },
          points: { type: 'integer', example: 10 },
          isRecurring: { type: 'boolean' },
          notes: { type: 'string' },
        },
      },
      SwapRequestBody: {
        type: 'object',
        required: ['requestedTo'],
        properties: {
          requestedTo: { type: 'string', description: 'User ObjectId' },
          offeredPoints: { type: 'integer', example: 20 },
        },
      },
      SwapRespondBody: {
        type: 'object',
        required: ['accept'],
        properties: {
          accept: { type: 'boolean' },
        },
      },
      SickLeaveRequest: {
        type: 'object',
        properties: {
          reason: { type: 'string', example: 'Fever' },
          date: { type: 'string', format: 'date-time' },
        },
      },
      CreateExpenseRequest: {
        type: 'object',
        required: ['title', 'amount'],
        properties: {
          title: { type: 'string', example: 'Groceries' },
          category: {
            type: 'string',
            enum: ['rent', 'groceries', 'utilities', 'gas', 'wifi', 'maintenance', 'entertainment', 'other'],
          },
          emoji: { type: 'string', example: '🛒' },
          amount: { type: 'number', example: 2300 },
          splitType: { type: 'string', enum: ['equal', 'custom', 'percentage'] },
          month: { type: 'string', example: '2026-06' },
          notes: { type: 'string' },
        },
      },
      SettleExpenseRequest: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Defaults to current user' },
        },
      },
      CreateInventoryRequest: {
        type: 'object',
        required: ['name', 'quantity'],
        properties: {
          name: { type: 'string', example: 'Rice' },
          category: {
            type: 'string',
            enum: ['groceries', 'cleaning', 'toiletries', 'kitchen', 'appliances', 'other'],
          },
          emoji: { type: 'string', example: '🌾' },
          quantity: {
            type: 'object',
            required: ['current'],
            properties: {
              current: { type: 'number' },
              unit: { type: 'string', example: 'kg' },
              minThreshold: { type: 'number' },
              maxCapacity: { type: 'number', nullable: true },
            },
          },
          stockPercent: { type: 'number', minimum: 0, maximum: 100, nullable: true },
          notes: { type: 'string' },
        },
      },
      MarkReadRequest: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Notification IDs; omit to mark all as read',
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string' },
                    version: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: errorResponse('Validation error', 400),
          409: errorResponse('Email already registered', 409),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: errorResponse('Invalid credentials', 401),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Uses `refreshToken` HTTP-only cookie',
        responses: {
          200: successResponse('Token refreshed'),
          401: errorResponse('Invalid refresh token', 401),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: bearerAuth,
        responses: {
          200: successResponse('User fetched', { $ref: '#/components/schemas/UserSummary' }),
          401: errorResponse('Unauthorized', 401),
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update profile',
        security: bearerAuth,
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } },
        },
        responses: {
          200: successResponse('Profile updated'),
          401: errorResponse('Unauthorized', 401),
        },
      },
    },
    '/api/auth/change-password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          200: successResponse('Password updated'),
          400: errorResponse('Incorrect current password', 400),
          401: errorResponse('Unauthorized', 401),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        security: bearerAuth,
        responses: {
          200: successResponse('Logged out'),
          401: errorResponse('Unauthorized', 401),
        },
      },
    },

    '/api/houses': {
      post: {
        tags: ['Houses'],
        summary: 'Create a house',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateHouseRequest' } } },
        },
        responses: {
          201: successResponse('House created'),
          400: errorResponse('Already in a house', 400),
          401: errorResponse('Unauthorized', 401),
        },
      },
    },
    '/api/houses/join': {
      post: {
        tags: ['Houses'],
        summary: 'Join house via invite code',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JoinHouseRequest' } } },
        },
        responses: {
          200: successResponse('Joined house'),
          404: errorResponse('Invalid invite code', 404),
        },
      },
    },
    '/api/houses/me': {
      get: {
        tags: ['Houses'],
        summary: 'Get my house',
        security: bearerAuth,
        responses: { 200: successResponse('House fetched'), 403: errorResponse('Not in a house', 403) },
      },
      put: {
        tags: ['Houses'],
        summary: 'Update house info (admin)',
        security: bearerAuth,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  avatar: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: successResponse('House updated'), 403: errorResponse('Admin only', 403) },
      },
    },
    '/api/houses/me/settings': {
      put: {
        tags: ['Houses'],
        summary: 'Update house settings (admin)',
        security: bearerAuth,
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateHouseSettingsRequest' } } },
        },
        responses: { 200: successResponse('Settings updated'), 403: errorResponse('Admin only', 403) },
      },
    },
    '/api/houses/me/invite': {
      post: {
        tags: ['Houses'],
        summary: 'Regenerate invite code (admin)',
        security: bearerAuth,
        responses: { 200: successResponse('Invite code regenerated'), 403: errorResponse('Admin only', 403) },
      },
    },
    '/api/houses/me/leave': {
      post: {
        tags: ['Houses'],
        summary: 'Leave house',
        security: bearerAuth,
        responses: { 200: successResponse('Left house') },
      },
    },
    '/api/houses/me/leaderboard': {
      get: {
        tags: ['Houses'],
        summary: 'Get house leaderboard',
        security: bearerAuth,
        responses: { 200: successResponse('Leaderboard fetched') },
      },
    },
    '/api/houses/members/{memberId}/role': {
      put: {
        tags: ['Houses'],
        summary: 'Update member role label (admin)',
        security: bearerAuth,
        parameters: [memberIdParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMemberRoleRequest' } } },
        },
        responses: { 200: successResponse('Role updated'), 403: errorResponse('Admin only', 403) },
      },
    },
    '/api/houses/members/{memberId}': {
      delete: {
        tags: ['Houses'],
        summary: 'Remove member (admin)',
        security: bearerAuth,
        parameters: [memberIdParam],
        responses: { 200: successResponse('Member removed'), 403: errorResponse('Admin only', 403) },
      },
    },

    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'isMarketplace', in: 'query', schema: { type: 'boolean' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: successResponse('Tasks fetched') },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create task',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } } },
        },
        responses: { 201: successResponse('Task created') },
      },
    },
    '/api/tasks/today': {
      get: {
        tags: ['Tasks'],
        summary: "Get today's tasks for current user",
        security: bearerAuth,
        responses: { 200: successResponse("Today's tasks fetched") },
      },
    },
    '/api/tasks/analytics': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task analytics',
        security: bearerAuth,
        parameters: [
          { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Defaults to current user' },
          { name: 'month', in: 'query', schema: { type: 'string', example: '2026-06' } },
        ],
        responses: { 200: successResponse('Analytics fetched') },
      },
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Task fetched'), 404: errorResponse('Not found', 404) },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update task',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } } },
        },
        responses: { 200: successResponse('Task updated') },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Task deleted') },
      },
    },
    '/api/tasks/{id}/complete': {
      post: {
        tags: ['Tasks'],
        summary: 'Mark task complete (awards points)',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Task completed') },
      },
    },
    '/api/tasks/{id}/assist/request': {
      post: {
        tags: ['Tasks'],
        summary: 'Request assist',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Assist request sent') },
      },
    },
    '/api/tasks/{id}/assist/accept': {
      post: {
        tags: ['Tasks'],
        summary: 'Accept assist request',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Assist accepted') },
      },
    },
    '/api/tasks/{id}/swap/request': {
      post: {
        tags: ['Tasks'],
        summary: 'Request task swap',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SwapRequestBody' } } },
        },
        responses: { 200: successResponse('Swap requested') },
      },
    },
    '/api/tasks/{id}/swap/respond': {
      post: {
        tags: ['Tasks'],
        summary: 'Accept or reject swap request',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SwapRespondBody' } } },
        },
        responses: { 200: successResponse('Swap responded') },
      },
    },
    '/api/tasks/{id}/sick': {
      post: {
        tags: ['Tasks'],
        summary: 'Request sick leave for task',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SickLeaveRequest' } } },
        },
        responses: { 200: successResponse('Sick leave requested') },
      },
    },
    '/api/tasks/{id}/sick/cover': {
      post: {
        tags: ['Tasks'],
        summary: 'Volunteer to cover sick leave task',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Cover accepted') },
      },
    },
    '/api/tasks/{id}/marketplace': {
      post: {
        tags: ['Tasks'],
        summary: 'Post task to marketplace',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Posted to marketplace') },
      },
    },
    '/api/tasks/{id}/claim': {
      post: {
        tags: ['Tasks'],
        summary: 'Claim marketplace task',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Task claimed') },
      },
    },

    '/api/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'month', in: 'query', schema: { type: 'string', example: '2026-06' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: successResponse('Expenses fetched') },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Add expense',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateExpenseRequest' } } },
        },
        responses: { 201: successResponse('Expense added') },
      },
    },
    '/api/expenses/summary': {
      get: {
        tags: ['Expenses'],
        summary: 'Monthly expense summary',
        security: bearerAuth,
        parameters: [{ name: 'month', in: 'query', schema: { type: 'string', example: '2026-06' } }],
        responses: { 200: successResponse('Summary fetched') },
      },
    },
    '/api/expenses/{id}/settle': {
      post: {
        tags: ['Expenses'],
        summary: 'Mark expense split as paid',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SettleExpenseRequest' } } },
        },
        responses: { 200: successResponse('Expense settled') },
      },
    },
    '/api/expenses/{id}': {
      delete: {
        tags: ['Expenses'],
        summary: 'Delete expense',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Expense deleted') },
      },
    },

    '/api/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List inventory items',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ok', 'low', 'out_of_stock', 'refill_requested'] } },
        ],
        responses: { 200: successResponse('Inventory fetched') },
      },
      post: {
        tags: ['Inventory'],
        summary: 'Add inventory item',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInventoryRequest' } } },
        },
        responses: { 201: successResponse('Item added') },
      },
    },
    '/api/inventory/alerts': {
      get: {
        tags: ['Inventory'],
        summary: 'Get low/out-of-stock alerts',
        security: bearerAuth,
        responses: { 200: successResponse('Alerts fetched') },
      },
    },
    '/api/inventory/{id}': {
      put: {
        tags: ['Inventory'],
        summary: 'Update inventory item',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateInventoryRequest' } } },
        },
        responses: { 200: successResponse('Item updated') },
      },
      delete: {
        tags: ['Inventory'],
        summary: 'Delete inventory item',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Item deleted') },
      },
    },
    '/api/inventory/{id}/refill': {
      post: {
        tags: ['Inventory'],
        summary: 'Request item refill',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Refill requested') },
      },
    },

    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: successResponse('Notifications fetched') },
      },
    },
    '/api/notifications/count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        security: bearerAuth,
        responses: { 200: successResponse('Count fetched') },
      },
    },
    '/api/notifications/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark notifications as read',
        security: bearerAuth,
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MarkReadRequest' } } },
        },
        responses: { 200: successResponse('Marked as read') },
      },
    },
    '/api/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Delete notification',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Notification deleted') },
      },
    },

    '/api/users/me/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get my full profile with badges',
        security: bearerAuth,
        responses: { 200: successResponse('Profile fetched') },
      },
    },
    '/api/users/house-members': {
      get: {
        tags: ['Users'],
        summary: 'Get all house members',
        security: bearerAuth,
        responses: { 200: successResponse('Members fetched'), 403: errorResponse('Not in a house', 403) },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get public profile of a house member',
        security: bearerAuth,
        parameters: [idParam],
        responses: { 200: successResponse('Profile fetched'), 404: errorResponse('Not found', 404) },
      },
    },
  },
};

module.exports = swaggerSpec;
