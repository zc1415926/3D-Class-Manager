<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submission_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->onDelete('cascade');
            $table->foreignId('requirement_id')->nullable()->constrained('assignment_upload_requirements')->onDelete('set null');
            $table->string('filename');
            $table->string('filepath');
            $table->string('thumbnail_path')->nullable();
            $table->string('file_type')->default('general');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->integer('score')->nullable();
            $table->string('grade', 2)->nullable();
            $table->foreignId('grader_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submission_files');
    }
};