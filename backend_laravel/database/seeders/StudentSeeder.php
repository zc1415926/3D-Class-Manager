<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        if (Student::count() === 0) {
            $students = [
                ['name' => '张三', 'year' => 2026, 'grade' => '一', 'class_number' => 1],
                ['name' => '李四', 'year' => 2026, 'grade' => '一', 'class_number' => 2],
                ['name' => '王五', 'year' => 2025, 'grade' => '二', 'class_number' => 1],
                ['name' => '赵六', 'year' => 2026, 'grade' => '一', 'class_number' => 3],
                ['name' => '钱七', 'year' => 2025, 'grade' => '二', 'class_number' => 2],
            ];

            foreach ($students as $student) {
                Student::create($student);
            }

            $this->command->info('示例学生已创建');
        }
    }
}