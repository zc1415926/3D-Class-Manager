<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        if (User::count() === 0) {
            User::create([
                'username' => 'zc1415926',
                'password' => Hash::make('zaq12wsx'),
                'role' => 'teacher',
            ]);

            $this->command->info('默认用户已创建');
        }
    }
}