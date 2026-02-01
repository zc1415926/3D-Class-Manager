<?php

namespace Database\Seeders;

use App\Models\UploadType;
use Illuminate\Database\Seeder;

class UploadTypeSeeder extends Seeder
{
    public function run(): void
    {
        if (UploadType::count() === 0) {
            $types = [
                [
                    'name' => 'STL模型',
                    'code' => 'stl',
                    'description' => '3D打印模型文件',
                    'extensions' => '.stl',
                    'sort_order' => 1,
                ],
                [
                    'name' => 'OBJ模型',
                    'code' => 'obj',
                    'description' => '3D对象文件',
                    'extensions' => '.obj',
                    'sort_order' => 2,
                ],
                [
                    'name' => '图片',
                    'code' => 'image',
                    'description' => '图片文件（JPG、PNG等）',
                    'extensions' => '.jpg,.jpeg,.png,.gif,.webp',
                    'sort_order' => 3,
                ],
                [
                    'name' => '文档',
                    'code' => 'document',
                    'description' => '文档文件（PDF、DOC等）',
                    'extensions' => '.pdf,.doc,.docx,.txt',
                    'sort_order' => 4,
                ],
                [
                    'name' => '视频',
                    'code' => 'video',
                    'description' => '视频文件',
                    'extensions' => '.mp4,.avi,.mov,.mkv',
                    'sort_order' => 5,
                ],
            ];

            foreach ($types as $type) {
                UploadType::create($type);
            }

            $this->command->info('上传类型已创建');
        }
    }
}