<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\CreateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $credentials = $request->only('username', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'error' => '用户名或密码错误'
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'role' => $user->role
                ]
            ]
        ]);
    }

    public function me()
    {
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => '注销成功'
        ]);
    }

    public function refreshToken(Request $request)
    {
        $user = $request->user();

        $user->currentAccessToken()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = Auth::user();

        if (!Hash::check($request->currentPassword, $user->password)) {
            return response()->json([
                'success' => false,
                'error' => '当前密码错误'
            ], 401);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => '密码修改成功，请重新登录'
        ]);
    }

    public function createUser(CreateUserRequest $request)
    {
        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'teacher'
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ], 201);
    }

    public function users()
    {
        $users = User::orderBy('created_at', 'desc')
            ->get(['id', 'username', 'role', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function deleteUser($id)
    {
        if ((int)$id === Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => '不能删除当前用户'
            ], 400);
        }

        $user = User::findOrFail($id);

        $user->tokens()->delete();

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => '用户删除成功'
        ]);
    }
}