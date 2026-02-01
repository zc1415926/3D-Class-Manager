<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignmentUploadRequirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'name',
        'upload_type',
        'is_required',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_published' => 'boolean',
        'sort_order' => 'integer',
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
     * 关联的提交文件
     */
    public function submissionFiles()
    {
        return $this->hasMany(SubmissionFile::class, 'requirement_id');
    }
}