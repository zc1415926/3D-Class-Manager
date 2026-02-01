<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'grade',
        'class_number',
    ];

    protected $casts = [
        'year' => 'integer',
        'class_number' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}