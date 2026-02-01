<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 评分的文件
     */
    public function gradedFiles()
    {
        return $this->hasMany(SubmissionFile::class, 'grader_id');
    }

    /**
     * 检查用户是否为管理员
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * 检查用户是否为教师
     */
    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }
}