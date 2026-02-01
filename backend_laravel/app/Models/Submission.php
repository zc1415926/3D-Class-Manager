<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'student_year',
        'work_name',
        'description',
        'assignment_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 关联的作业
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * 提交的文件
     */
    public function submissionFiles()
    {
        return $this->hasMany(SubmissionFile::class);
    }
}