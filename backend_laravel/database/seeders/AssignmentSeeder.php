<?php

namespace Database\Seeders;

use App\Models\Assignment;
use Illuminate\Database\Seeder;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        if (Assignment::count() === 0) {
            Assignment::create([
                'name' => '3D建模入门',
                'year' => 2026,
                'upload_types' => ['stl', 'obj'],
                'description' => '学习基础的3D建模技术，完成一个简单的立方体模型',
                'status' => 'active',
                'sort_order' => 1,
            ]);

            Assignment::create([
                'name' => '3D建模进阶',
                'year' => 2026,
                'upload_types' => ['stl', 'obj', 'image'],
                'description' => '完成一个复杂的三维建筑模型，包含多个组件',
                'status' => 'active',
                'sort_order' => 2,
            ]);

            Assignment::create([
                'name' => '创意设计',
                'year' => 2025,
                'upload_types' => ['stl'],
                'description' => '自由创作一个独特的3D作品',
                'status' => 'active',
                'sort_order' => 3,
            ]);

            $this->command->info('示例作业已创建');
        }
    }
}