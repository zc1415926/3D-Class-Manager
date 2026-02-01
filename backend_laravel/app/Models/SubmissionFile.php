<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubmissionFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'requirement_id',
        'filename',
        'filepath',
        'thumbnail_path',
        'file_type',
        'is_primary',
        'sort_order',
        'score',
        'grade',
        'grader_id',
        'graded_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
        'score' => 'integer',
        'graded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 关联的提交
     */
    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    /**
     * 关联的作业要求
     */
    public function requirement()
    {
        return $this->belongsTo(AssignmentUploadRequirement::class, 'requirement_id');
    }

    /**
     * 评分者
     */
    public function grader()
    {
        return $this->belongsTo(User::class, 'grader_id');
    }
}