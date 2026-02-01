<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\UploadTypeController;
use App\Http\Controllers\Api\V1\FileUploadController;
use App\Http\Controllers\Api\V1\FileController;

Route::prefix('v1')->group(function () {
    // 认证路由
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
        Route::post('refresh-token', [AuthController::class, 'refreshToken'])->middleware('auth:api');
        Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');
        Route::post('change-password', [AuthController::class, 'changePassword'])->middleware('auth:api');
        Route::post('users', [AuthController::class, 'createUser'])->middleware('auth:api', 'role:admin');
        Route::get('users', [AuthController::class, 'users'])->middleware('auth:api', 'role:admin');
        Route::delete('users/{id}', [AuthController::class, 'deleteUser'])->middleware('auth:api', 'role:admin');
    });

    // 作品管理路由
    Route::prefix('submissions')->group(function () {
        Route::get('/', [SubmissionController::class, 'index']);
        Route::post('/', [SubmissionController::class, 'store']);
        Route::get('/{id}', [SubmissionController::class, 'show']);
        Route::get('/by-assignment/{assignmentId}', [SubmissionController::class, 'byAssignment']);
        Route::put('/files/{fileId}/grade', [SubmissionController::class, 'gradeFile'])->middleware('auth:api');
        Route::delete('/{id}', [SubmissionController::class, 'destroy'])->middleware('auth:api');
    });

    // 学生管理路由
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store'])->middleware('auth:api');
        Route::put('/{id}', [StudentController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [StudentController::class, 'destroy'])->middleware('auth:api');
    });

    // 作业管理路由
    Route::prefix('assignments')->group(function () {
        Route::get('/', [AssignmentController::class, 'index']);
        Route::post('/', [AssignmentController::class, 'store'])->middleware('auth:api');
        Route::put('/reorder', [AssignmentController::class, 'reorder'])->middleware('auth:api');
        Route::get('/{id}', [AssignmentController::class, 'show']);
        Route::put('/{id}', [AssignmentController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [AssignmentController::class, 'destroy'])->middleware('auth:api');
        Route::delete('/{id}/cascade', [AssignmentController::class, 'cascadeDelete'])->middleware('auth:api');
        Route::get('/{id}/submissions', [AssignmentController::class, 'submissions']);
        Route::get('/{id}/upload-requirements', [AssignmentController::class, 'uploadRequirements']);
        Route::post('/{id}/upload-requirements', [AssignmentController::class, 'storeRequirement'])->middleware('auth:api');
        Route::put('/{id}/upload-requirements/{requirementId}', [AssignmentController::class, 'updateRequirement'])->middleware('auth:api');
        Route::delete('/{id}/upload-requirements/{requirementId}', [AssignmentController::class, 'destroyRequirement'])->middleware('auth:api');
        Route::put('/{id}/upload-requirements/reorder', [AssignmentController::class, 'reorderRequirements'])->middleware('auth:api');
        Route::get('/{id}/export', [AssignmentController::class, 'export'])->middleware('auth:api');
        Route::post('/{id}/move-uploaded-files', [AssignmentController::class, 'moveUploadedFiles'])->middleware('auth:api');
    });

    // 上传类型管理路由
    Route::prefix('upload-types')->group(function () {
        Route::get('/', [UploadTypeController::class, 'index']);
        Route::get('/{id}', [UploadTypeController::class, 'show']);
        Route::post('/', [UploadTypeController::class, 'store'])->middleware('auth:api');
        Route::put('/{id}', [UploadTypeController::class, 'update'])->middleware('auth:api');
        Route::delete('/{id}', [UploadTypeController::class, 'destroy'])->middleware('auth:api');
        Route::put('/batch/sort', [UploadTypeController::class, 'batchSort'])->middleware('auth:api');
    });

    // 文件上传路由
    Route::prefix('upload')->group(function () {
        Route::post('/upload-image', [FileUploadController::class, 'uploadImage']);
        Route::post('/upload-assignment-attachment', [FileUploadController::class, 'uploadAttachment']);
    });

    // 文件下载路由
    Route::get('/download/{filename}', [FileController::class, 'download']);

    // 健康检查
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'message' => 'Server is running',
            'timestamp' => now()
        ]);
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');