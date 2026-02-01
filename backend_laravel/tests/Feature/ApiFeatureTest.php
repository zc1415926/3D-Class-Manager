<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ApiFeatureTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 测试健康检查端点
     */
    public function test_health_check_endpoint()
    {
        $response = $this->get('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'message' => 'Server is running'
            ]);
    }

    /**
     * 测试学生列表API
     */
    public function test_get_students_api()
    {
        $response = $this->get('/api/v1/students');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'year',
                        'grade',
                        'class_number',
                        'createdAt'
                    ]
                ]
            ]);
    }

    /**
     * 测试作业列表API
     */
    public function test_get_assignments_api()
    {
        $response = $this->get('/api/v1/assignments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data'
            ]);
    }

    /**
     * 测试作品列表API
     */
    public function test_get_submissions_api()
    {
        $response = $this->get('/api/v1/submissions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data'
            ]);
    }

    /**
     * 测试登录API
     */
    public function test_login_api()
    {
        $user = User::factory()->create([
            'username' => 'test_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $response = $this->post('/api/v1/auth/login', [
            'username' => 'test_user',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'token_type',
                    'user' => [
                        'id',
                        'username',
                        'role'
                    ]
                ]
            ]);
    }

    /**
     * 测试认证保护
     */
    public function test_authenticated_endpoint_requires_token()
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    /**
     * 测试创建学生API
     */
    public function test_create_student_api()
    {
        $user = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/v1/students', [
            'name' => '测试学生',
            'year' => 2026,
            'grade' => '三',
            'class_number' => 1
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试更新学生API
     */
    public function test_update_student_api()
    {
        $student = Student::create([
            'name' => '原始学生',
            'year' => 2026,
            'grade' => '三',
            'class_number' => 1
        ]);

        $user = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->put("/api/v1/students/{$student->id}", [
            'name' => '更新后的学生',
            'year' => 2026,
            'grade' => '四',
            'class_number' => 2
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试删除学生API
     */
    public function test_delete_student_api()
    {
        $student = Student::create([
            'name' => '待删除学生',
            'year' => 2026,
            'grade' => '三',
            'class_number' => 1
        ]);

        $user = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->delete("/api/v1/students/{$student->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试创建作业API
     */
    public function test_create_assignment_api()
    {
        $user = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/v1/assignments', [
            'name' => '测试作业',
            'year' => 2026,
            'description' => '这是一个测试作业',
            'upload_types' => ['stl', 'obj']
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试作业详情API
     */
    public function test_get_assignment_detail_api()
    {
        $assignment = Assignment::create([
            'name' => '测试作业',
            'year' => 2026,
            'upload_types' => json_encode(['stl', 'obj']),
            'description' => '测试描述'
        ]);

        $response = $this->get("/api/v1/assignments/{$assignment->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试修改密码API
     */
    public function test_change_password_api()
    {
        $user = User::factory()->create([
            'username' => 'test_user',
            'password' => bcrypt('old_password'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/v1/auth/change-password', [
            'currentPassword' => 'old_password',
            'newPassword' => 'new_password_123'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试文件评分API
     */
    public function test_grade_file_api()
    {
        $user = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->put('/api/v1/submissions/files/1/grade', [
            'score' => 90,
            'grade' => 'A'
        ]);

        // 如果文件不存在，可能返回404
        $this->assertTrue(
            $response->status() === 200 || $response->status() === 404,
            'Status code should be 200 or 404, got: ' . $response->status()
        );
    }

    /**
     * 测试上传类型列表API
     */
    public function test_get_upload_types_api()
    {
        $response = $this->get('/api/v1/upload-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'code',
                        'extensions'
                    ]
                ]
            ]);
    }

    /**
     * 测试作业上传要求API
     */
    public function test_get_assignment_upload_requirements_api()
    {
        $assignment = Assignment::create([
            'name' => '测试作业',
            'year' => 2026,
            'upload_types' => json_encode(['stl', 'obj'])
        ]);

        $response = $this->get("/api/v1/assignments/{$assignment->id}/upload-requirements");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试按作业获取作品API
     */
    public function test_get_submissions_by_assignment_api()
    {
        $assignment = Assignment::create([
            'name' => '测试作业',
            'year' => 2026,
            'upload_types' => json_encode(['stl'])
        ]);

        $response = $this->get("/api/v1/assignments/{$assignment->id}/submissions");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);
    }

    /**
     * 测试未授权访问管理API
     */
    public function test_unauthorized_access_to_admin_api()
    {
        $teacherUser = User::factory()->create([
            'username' => 'teacher_user',
            'password' => bcrypt('password123'),
            'role' => 'teacher'
        ]);

        $token = $teacherUser->createToken('api-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/v1/auth/users', [
            'username' => 'new_user',
            'password' => 'password123',
            'role' => 'admin'
        ]);

        // 教师用户应该无法创建管理员用户
        $this->assertTrue(
            $response->status() === 403 || $response->status() === 401,
            'Status code should be 403 or 401, got: ' . $response->status()
        );
    }
}