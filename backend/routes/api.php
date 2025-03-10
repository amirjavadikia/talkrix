<?php

use App\Http\Controllers\API\AgentController;
use App\Http\Controllers\API\AnalyticsController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AutoReplyController;
use App\Http\Controllers\API\CannedResponseController;
use App\Http\Controllers\API\ConversationController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\SettingsController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\VisitorController;
use App\Http\Controllers\API\WebhookController;
use App\Http\Controllers\API\WebsiteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Visitor chat routes (no authentication required)
Route::prefix('visitor')->group(function () {
    Route::post('/init', [VisitorController::class, 'initializeVisitor']);
    Route::post('/messages', [MessageController::class, 'storeVisitorMessage']);
    Route::get('/messages/{conversation}', [MessageController::class, 'getVisitorMessages']);
    Route::post('/typing', [ConversationController::class, 'visitorTyping']);
    Route::post('/read', [MessageController::class, 'markAsReadByVisitor']);
});

// Protected routes (require authentication)
Route::middleware('auth:api')->group(function () {
    // User profile management
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::post('/user/password', [UserController::class, 'changePassword']);

    // Website management
    Route::apiResource('websites', WebsiteController::class);
    Route::put('/websites/{website}/settings', [WebsiteController::class, 'updateSettings']);
    Route::post('/websites/{website}/regenerate-key', [WebsiteController::class, 'regenerateApiKey']);

    // Agent management
    Route::apiResource('agents', AgentController::class);
    Route::put('/agents/{agent}/status', [AgentController::class, 'toggleStatus']);

    // Conversation management
    Route::apiResource('conversations', ConversationController::class);
    Route::get('/websites/{website}/conversations', [ConversationController::class, 'indexByWebsite']);
    Route::post('/conversations/{conversation}/assign', [ConversationController::class, 'assignAgent']);
    Route::post('/conversations/{conversation}/close', [ConversationController::class, 'closeConversation']);
    Route::post('/conversations/{conversation}/reopen', [ConversationController::class, 'reopenConversation']);

    // Message management
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
    Route::post('/messages/read', [MessageController::class, 'markAsRead']);

    // Visitor management
    Route::get('/websites/{website}/visitors', [VisitorController::class, 'index']);
    Route::get('/visitors/{visitor}', [VisitorController::class, 'show']);
    Route::put('/visitors/{visitor}/ban', [VisitorController::class, 'ban']);
    Route::put('/visitors/{visitor}/unban', [VisitorController::class, 'unban']);

    // Canned responses
    Route::apiResource('canned-responses', CannedResponseController::class);

    // Auto-reply rules
    Route::apiResource('websites.auto-replies', AutoReplyController::class);
    Route::put('/auto-replies/{autoReply}/status', [AutoReplyController::class, 'toggleStatus']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::put('/settings/notifications', [SettingsController::class, 'updateNotifications']);

    // Analytics
    Route::get('/websites/{website}/analytics', [AnalyticsController::class, 'show']);
    Route::get('/websites/{website}/analytics/conversations', [AnalyticsController::class, 'conversations']);
    Route::get('/websites/{website}/analytics/messages', [AnalyticsController::class, 'messages']);
    Route::get('/websites/{website}/analytics/response-times', [AnalyticsController::class, 'responseTimes']);
    Route::get('/websites/{website}/analytics/peak-hours', [AnalyticsController::class, 'peakHours']);
    Route::get('/websites/{website}/analytics/export', [AnalyticsController::class, 'export']);

    // Webhooks management
    Route::apiResource('websites.webhooks', WebhookController::class);

    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);


});
