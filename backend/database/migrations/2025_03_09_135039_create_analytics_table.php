<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        Schema::create('analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->unsignedInteger('total_conversations')->default(0);
            $table->unsignedInteger('total_messages')->default(0);
            $table->unsignedInteger('avg_response_time')->default(0); // in seconds
            $table->unsignedInteger('avg_conversation_duration')->default(0); // in seconds
            $table->unsignedTinyInteger('peak_hour')->nullable(); // 0-23 representing hour of day
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            // Make website_id and date unique together
            $table->unique(['website_id', 'date']);
        });

        // Create indexes for better performance
        Schema::table('analytics', function (Blueprint $table) {
            $table->index('website_id');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics');
    }
};
